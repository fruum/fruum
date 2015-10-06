/******************************************************************************
Main client app
*******************************************************************************/

(function() {
  'use strict';
  //here we define the address of the server that is hosting fruum files
  var remote_host = '__url__';
  //loads css and html to display fruum panel
  function setup() {
    //load css
    var $ = Fruum.libs.$,
        css_loaded = false,
        html_loaded = false;
    $.get(remote_host + '/fruum.css?app_id=' + window.fruumSettings.app_id, function(data) {
      $('head').append('<style>' + data + '</style>');
      css_loaded = true;
      if (html_loaded) run();
    });
    //load html templates
    $.get(remote_host + '/fruum.html?app_id=' + window.fruumSettings.app_id, function(data) {
      $(window.fruumSettings.container || 'body').append(data);
      //start the app
      html_loaded = true;
      if (css_loaded) run();
    });
  }
  //when all dependencies have been loaded, start the app
  function run() {
    //libraries
    var $ = Fruum.libs.$,
        _ = Fruum.libs._,
        Backbone = Fruum.libs.Backbone,
        Marionette = Fruum.libs.Marionette,
        io = Fruum.libs.io;
    //load requirements
    _.each(Fruum.require, function(fn) { fn(); });
    //cache some stuff
    var Models = Fruum.models,
        Collections = Fruum.collections,
        Views = Fruum.views;
    //root view
    var RootView = Marionette.LayoutView.extend({
      ui: {
        message_reconnect: '.fruum-js-message-reconnecting',
        message_invalid_app: '.fruum-js-message-invalid-app',
        message_restore: '.fruum-js-message-restore',
        message_report: '.fruum-js-message-report',
        message_view_error: '.fruum-js-message-view-error',
        restore_undo: '.fruum-js-restore-undo',
        sticky_section: '.fruum-section-sticky',
        close: '.fruum-js-panel-close'
      },
      regions: {
        navigation: '.fruum-js-navigation-section',
        content: '.fruum-js-content-section',
        divider_category_article: '.fruum-js-divider-category-article',
        divider_article_thread: '.fruum-js-divider-article-thread',
        divider_thread_channel: '.fruum-js-divider-thread-channel',
        breadcrumb: '.fruum-js-region-breadcrumb',
        title: '.fruum-section-title',
        filters: '.fruum-js-region-filters',
        counters: '.fruum-js-region-counters',
        list: '.fruum-objects-list',
        loading: '.fruum-is-loading',
        categories: '.fruum-category-list',
        articles: '.fruum-article-list',
        threads: '.fruum-thread-list',
        channels: '.fruum-channel-list',
        posts: '.fruum-post-list',
        search: '.fruum-search-list',
        notifications: '.fruum-notification-list',
        interactions: '.fruum-interactions-section',
        empty: '.fruum-empty-list',
        share: '.fruum-js-region-share'
      },
      events: {
        'keydown input, textarea': 'onInterceptKeyboard',
        'keyup input, textarea': 'onInterceptKeyboard',
        'click @ui.close': 'onClose',
        'click @ui.restore_undo': 'onRestore',
        'click @ui.message_view_error > a': 'onGoHome'
      },
      initialize: function() {
        var that = this;
        //saves scroll state for viewed documents
        this.scroll_history = {};

        _.bindAll(this,
          'resize', 'onScroll', 'calculateViewRegions',
          '_scrollTop', '_scrollBottom', '_snapTop', '_snapBottom',
          'restoreScrollState', 'saveScrollState'
        );
        $(window).resize(function() {
          Fruum.io.trigger('fruum:resize');
        });
        //models
        while(this._consumeData());
        this.ui_state = new Models.UIState();
        this.categories = new Collections.Categories();
        this.threads = new Collections.Threads();
        this.articles = new Collections.Articles();
        this.channels = new Collections.Channels();
        this.posts = new Collections.Posts();
        this.search = new Collections.Search();
        this.notifications = new Collections.Notifications();
        this.socket = io(remote_host);

        //initialize plugins
        Fruum.utils.chain(Fruum.processors.init, this);

        //initialize standard regions
        this.showChildView('breadcrumb', new Views.BreadcrumbView({
          model: this.ui_state,
          notifications: this.notifications
        }));
        this.showChildView('title', new Views.TitleView({
          model: this.ui_state,
          notifications: this.notifications
        }));
        this.showChildView('filters', new Views.FiltersView({
          model: this.ui_state,
          notifications: this.notifications
        }));
        this.showChildView('counters', new Views.CountersView({
          model: this.ui_state
        }));
        this.showChildView('loading', new Views.LoadingView({
          model: this.ui_state,
          content: this.getRegion('list').$el
        }));
        this.showChildView('categories', new Views.CategoriesView({
          collection: this.categories,
          ui_state: this.ui_state
        }));
        this.showChildView('articles', new Views.ArticlesView({
          collection: this.articles,
          ui_state: this.ui_state
        }));
        this.showChildView('threads', new Views.ThreadsView({
          collection: this.threads,
          ui_state: this.ui_state
        }));
        this.showChildView('channels', new Views.ChannelsView({
          collection: this.channels,
          ui_state: this.ui_state
        }));
        this.showChildView('posts', new Views.PostsView({
          collection: this.posts,
          ui_state: this.ui_state
        }));
        this.showChildView('search', new Views.SearchView({
          collection: this.search,
          ui_state: this.ui_state
        }));
        this.showChildView('notifications', new Views.NotificationsView({
          collection: this.notifications,
          ui_state: this.ui_state
        }));
        this.showChildView('empty', new Views.EmptyView({
          model: this.ui_state
        }));
        new Views.ShareView({
          ui_state: this.ui_state,
          el: this.regions.share
        });
        this.listenTo(this.notifications, 'reset', function() {
          if (this.notifications.length) Fruum.io.trigger('fruum:clear_search');
          this.onRefresh();
        });
        this.listenTo(this.ui_state, 'change:loading change:searching', this.onRefresh);
        this.listenTo(this.ui_state, 'change:searching', function() {
          if (!this.ui_state.get('searching'))
            this.search.reset();
          else
            this.notifications.reset();
        });
        this.listenTo(this.ui_state, 'change:viewing', function() {
          var type = this.ui_state.get('viewing').type;
          if (type === 'channel' || type === 'thread' || type === 'article') {
            $(this.ui.sticky_section).removeClass('fruum-section-empty');
          }
          else {
            $(this.ui.sticky_section).addClass('fruum-section-empty');
          }
        });

        // ------------------- IO EVENTS -------------------

        this.listenTo(Fruum.io, 'fruum:scroll_top', this._scrollTop);
        this.listenTo(Fruum.io, 'fruum:scroll_bottom', this._scrollBottom);
        this.listenTo(Fruum.io, 'fruum:refresh', this.onRefresh);
        this.listenTo(Fruum.io, 'fruum:resize', this.resize);
        this.listenTo(Fruum.io, 'fruum:resize_to_bottom', this.resize_to_bottom);
        this.listenTo(Fruum.io, 'fruum:edit', function(json) {
          that.ui_state.set('editing', json || {});
        });
        this.listenTo(Fruum.io, 'fruum:toggle_manage', function(el) {
          if (el.hasClass('fruum-manage-display')) {
            el.removeClass('fruum-manage-display');
          }
          else {
            this.$('.fruum-manage').removeClass('fruum-manage-display');
            el.addClass('fruum-manage-display');
          }
        });
        this.listenTo(Fruum.io, 'fruum:close_manage', function() {
          this.$('.fruum-manage').removeClass('fruum-manage-display');
        });

        // ------------------- VIEW -------------------

        this.bindIO('fruum:view',
          function send(payload) {
            //save previous scroll pos
            that.saveScrollState();
            //grab some meta data from the trigger
            var loading = payload.origin || 'view';
            //remove metadata
            delete payload.origin;
            that.ui_state.set({
              loading: loading,
              interacting: true
            });
            that.socket.emit('fruum:view', payload);
          },
          function recv(payload) {
            if (!payload) {
              that.ui_state.set({
                loading: '',
                interacting: false
              });
              $(that.ui.message_view_error).slideDown('fast');
              return;
            }

            if ($(that.ui.message_view_error).is(':visible'))
              $(that.ui.message_view_error).slideUp('fast');

            var breadcrumb = payload.breadcrumb || [];
            var last_doc = breadcrumb.pop() || {};
            that.ui_state.set({
              loading: '',
              interacting: false,
              breadcrumb: breadcrumb,
              online: payload.online || {}
            });

            if (that.ui_state.get('viewing').id != last_doc.id) {
              that.ui_state.set({
                viewing: last_doc,
                editing: {}
              });
            }

            var categories = [], articles = [], threads = [], channels = [], posts = [];
            if (last_doc.body) {
              switch(last_doc.type) {
                case 'article':
                case 'thread':
                  posts.push(last_doc);
                  break;
              }
            }

            _.each(payload.documents, function(entry) {
              switch(entry.type) {
                case 'category':
                  categories.push(entry);
                  break;
                case 'article':
                  articles.push(entry);
                  break;
                case 'thread':
                  threads.push(entry);
                  break;
                case 'channel':
                  channels.push(entry);
                  break;
                case 'post':
                  posts.push(entry);
                  break;
              }
            });
            that.categories.reset(categories);
            that.articles.reset(articles);
            that.threads.reset(threads);
            that.channels.reset(channels);
            that.posts.reset(posts);

            that.onRefresh();

            if (last_doc.type === 'channel') {
              //scroll to bottom
              _.defer(that._snapBottom);
            }
            else {
              //scroll to top
              if (that.hasScrollState())
                _.defer(that.restoreScrollState);
              else
                _.defer(that._snapTop);
            }

            //remove from notifications
            if (Fruum.userUtils.hasNotification(payload.id)) {
              Fruum.io.trigger('fruum:unnotify', { id: payload.id });
            }

            //store on local storage
            Fruum.utils.sessionStorage('fruum:view:' + window.fruumSettings.app_id, last_doc.id);
            if (that.router) that.router.navigate('!v/' + last_doc.id);
          }
        );

        // ------------------- ADD UPDATE DOCUMENT -------------------

        this.bindIO('fruum:add',
          function send(payload) {
            that.ui_state.set({
              loading: 'add',
              interacting: true
            });
            that.socket.emit('fruum:add', payload);
          },
          function recv(payload) {
            that.ui_state.set({
              loading: '',
              interacting: false
            });
            if (!payload) return;
            that.ui_state.set('editing', {});
            that.upsertPayload(payload);
            var watch_id;
            switch (payload.type) {
              case 'thread':
              case 'article':
                watch_id = payload.id;
                Fruum.io.trigger('fruum:view', { id: payload.id });
                break;
              case 'channel':
                Fruum.io.trigger('fruum:view', { id: payload.id });
                break;
              case 'post':
                if (payload.parent_type == 'thread' || payload.parent_type == 'article')
                  watch_id = payload.parent;
                that.ui_state.trigger('change:editing');
                Fruum.io.trigger('fruum:scroll_bottom');
                break;
              default:
                break;
            }
            if (watch_id && !Fruum.userUtils.isWatching(watch_id)) {
              Fruum.io.trigger('fruum:watch', { id: watch_id });
            }
          }
        );

        this.bindIO('fruum:update',
          function send(payload) {
            that.ui_state.set({
              loading: 'update',
              interacting: true
            });
            that.socket.emit('fruum:update', payload);
          },
          function recv(payload) {
            that.ui_state.set({
              loading: '',
              interacting: false,
              editing: {}
            });
            if (!payload) return;
            that.upsertPayload(payload);
          }
        );

        // ------------------- DELETION -------------------

        this.bindIO('fruum:archive',
          function send(payload) {
            that.ui_state.set({
              loading: 'archive',
              interacting: true
            });
            that.socket.emit('fruum:archive', payload);
            $(that.ui.message_restore).stop(true, true).slideDown('fast').delay(4000).slideUp('slow');
            that.last_archived_id = payload.id;
          },
          function recv(payload) {
            that.ui_state.set({
              loading: '',
              interacting: false
            });
            if (!payload) return;
            that.deletePayload(payload);
          }
        );

        this.bindIO('fruum:restore',
          function send(payload) {
            that.ui_state.set({
              loading: 'restore',
              interacting: true
            });
            that.socket.emit('fruum:restore', payload);
          },
          function recv(payload) {
            that.ui_state.set({
              loading: '',
              interacting: false
            });
            if (!payload) return;
            that.upsertPayload(payload);
          }
        );

        // -------------------- WATCH --------------------

        this.bindIO('fruum:watch',
          function send(payload) {
            that.socket.emit('fruum:watch', payload);
          },
          function recv(payload) {
            if (payload) {
              Fruum.userUtils.watch(payload.id);
              that.upsertPayload(payload);
            }
          }
        );

        this.bindIO('fruum:unwatch',
          function send(payload) {
            that.socket.emit('fruum:unwatch', payload);
          },
          function recv(payload) {
            if (payload) {
              Fruum.userUtils.unwatch(payload.id);
              that.upsertPayload(payload);
            }
          }
        );

        // -------------------- NOTIFICATIONS --------------------

        //fetch notifications
        this.bindIO('fruum:notifications',
          function send(payload) {
            that.socket.emit('fruum:notifications', payload);
          },
          function recv(payload) {
            if (!payload.notifications) return;
            //update badge
            var ids = [];
            _.each(payload.notifications, function(document) {
              ids.push(document.id);
            });
            //find not existent notifications
            var diff = _.difference(Fruum.user.notifications || [], ids);
            Fruum.user.notifications = ids;
            Fruum.io.trigger('fruum:update_notify');
            //store in collection
            that.notifications.reset(payload.notifications);
            //remove invalid notifications
            _.each(diff, function(doc_id) {
              Fruum.io.trigger('fruum:unnotify', { id: doc_id});
            });
          }
        );

        this.bindIO('fruum:notify',
          function send(payload) {
            that.socket.emit('fruum:notify', payload);
          },
          function recv(payload) {
            if (payload) {
              Fruum.userUtils.addNotification(payload.id);
              Fruum.io.trigger('fruum:update_notify');
            }
          }
        );

        this.bindIO('fruum:unnotify',
          function send(payload) {
            that.socket.emit('fruum:unnotify', payload);
          },
          function recv(payload) {
            if (payload) {
              Fruum.userUtils.removeNotification(payload.id);
              Fruum.io.trigger('fruum:update_notify');
            }
          }
        );

        // -------------------- REPORT --------------------

        this.bindIO('fruum:report',
          function send(payload) {
            that.socket.emit('fruum:report', payload);
          },
          function recv(payload) {
            if (payload) {
              $(that.ui.message_report).stop(true, true).slideDown('fast').delay(3000).slideUp('slow');
            }
          }
        );

        // ------------------- SORTING -------------------

        this.bindIO('fruum:field',
          function send(payload) {
            that.ui_state.set({
              loading: 'field',
              interacting: true
            });
            that.socket.emit('fruum:field', payload);
          },
          function recv(payload) {
            that.ui_state.set({
              loading: '',
              interacting: false
            });
            if (!payload) return;
            that.upsertPayload(payload);
          }
        );

        // ------------------- POSTS -------------------

        //authenticate
        this.socket.on('fruum:auth', function(payload) {
          if (!payload) {
            Fruum.__permanent_abort = true;
            $(that.ui.message_invalid_app).slideDown('fast');
            that.ui_state.set('loading', '');
            return;
          }
          Fruum.user = payload.user || Fruum.user;
          Fruum.application = payload.application || Fruum.application;
          that.showChildView('interactions', new Views.InteractionsView({
            model: that.ui_state,
            collections: {
              categories: that.categories,
              threads: that.threads,
              articles: that.articles,
              channels: that.channels,
              posts: that.posts
            }
          }));
          that.onRefresh();
          if (window.fruumSettings.view_id == '*') window.fruumSettings.view_id = undefined;
          Fruum.io.trigger('fruum:view', {
            id: window.fruumSettings.view_id ||
                that.ui_state.get('viewing').id ||
                Fruum.utils.sessionStorage('fruum:view:' + window.fruumSettings.app_id) ||
                'home',
            origin: window.fruumSettings.view_id?'link':''
          });
          $(that.ui.message_reconnect).slideUp('fast');
          that.ui_state.get('viewing').id = undefined;
          window.fruumSettings.view_id = undefined;
        });

        // ----------------- LIVE UPDATES -----------------

        this.socket.on('fruum:dirty', function(payload) {
          that.upsertPayload(payload);
        });
        this.socket.on('fruum:info', function(payload) {
          //enable notification badge
          if (payload) {
            that.$('[data-info-id="' + payload.id + '"]').fadeIn();
          }
        });
        this.socket.on('fruum:online', function(payload) {
          if (!payload) return;
          that.ui_state.set(
            'online',
            _.extend(that.ui_state.get('online'), payload)
          );
          //update region counters
          var el = that.getRegion('channels').$el;
          for (var channel in payload) {
            el.find('[data-channel-members="' + channel + '"]').html(payload[channel]);
          }
        });

        // ----------------- SEARCH -----------------

        this.bindIO('fruum:search',
          function send(text) {
            that.ui_state.set({
              search: text
            });
            if (!that.ui_state.get('searching') || !text) {
              that.search.reset();
              that.onRefresh();
            }
            else {
              that.socket.emit('fruum:search', {
                q: text
              });
            }
          },
          function recv(payload) {
            if (!payload) return;
            //check if search is valid
            if (payload.q === that.ui_state.get('search') && that.ui_state.get('searching')) {
              that.search.reset(payload.results);
              that.onRefresh();
            }
          }
        );

        // ----------------- START -----------------

        this.socket.on('connect', function() {
          that.socket.emit('fruum:auth', window.fruumSettings);
        });
        this.socket.on('disconnect', function() {
          if (!Fruum.__permanent_abort)
            $(that.ui.message_reconnect).slideDown('fast');
        });

        setInterval(function() {
          while(that._consumeData());
        }, 1000);

        //close preview
        _.defer(function() {
          $('#fruum-preview').removeClass('fruum-clicked fruum-peak');
        });
        //remove hide button on full page mode
        if (window.fruumSettings.fullpage) {
          this.$(this.ui.close).remove();
        }
        //if history is enabled enable it
        if (window.fruumSettings.history) {
          this.startRouter();
        }
        //start nano scroller
        this.getRegion('content').$el.nanoScroller({
          preventPageScrolling: true,
          iOSNativeScrolling: true,
          disableResize: true
        });
        this.getRegion('content').$el.on('update', this.onScroll);

        //store open state
        Fruum.utils.sessionStorage('fruum:open:' + window.fruumSettings.app_id, 1);

        //start with loading state open
        this.ui_state.set('loading', 'connect');
        this.onRefresh();
        Fruum.io.trigger('fruum:resize');
      },
      onScroll: function() {
        if (this.calculate_regions_timer) return;
        this.calculate_regions_timer = setTimeout(this.calculateViewRegions, 100);
      },
      onRefresh: function() {
        var viewing_type = this.ui_state.get('viewing').type;
        if (this.notifications.length) {
          //show notifications
          this.getRegion('empty').$el.stop(true, true).hide();
          this.getRegion('search').$el.hide();
          this.getRegion('categories').$el.hide();
          this.getRegion('articles').$el.hide();
          this.getRegion('threads').$el.hide();
          this.getRegion('channels').$el.hide();
          this.getRegion('divider_category_article').$el.hide();
          this.getRegion('divider_article_thread').$el.hide();
          this.getRegion('divider_thread_channel').$el.hide();
          this.getRegion('posts').$el.hide();
          this.getRegion('notifications').$el.show();
          this.ui_state.set({
            total_entries: this.notifications.length
          });
        }
        else if (this.ui_state.get('searching')) {
          //Search mode
          this.getRegion('empty').$el.stop(true, true).hide();
          this.getRegion('notifications').$el.hide();
          this.getRegion('categories').$el.hide();
          this.getRegion('articles').$el.hide();
          this.getRegion('threads').$el.hide();
          this.getRegion('channels').$el.hide();
          this.getRegion('divider_category_article').$el.hide();
          this.getRegion('divider_article_thread').$el.hide();
          this.getRegion('divider_thread_channel').$el.hide();
          this.getRegion('posts').$el.hide();
          this.getRegion('search').$el.show();
          this.ui_state.set({
            total_entries: this.search.length
          });
        }
        else if (viewing_type === 'channel' || viewing_type === 'thread' || viewing_type === 'article') {
          //Viewing posts
          this.getRegion('empty').$el.stop(true, true).hide();
          this.getRegion('notifications').$el.hide();
          this.getRegion('search').$el.hide();
          this.getRegion('categories').$el.hide();
          this.getRegion('articles').$el.hide();
          this.getRegion('threads').$el.hide();
          this.getRegion('channels').$el.hide();
          this.getRegion('divider_category_article').$el.hide();
          this.getRegion('divider_article_thread').$el.hide();
          this.getRegion('divider_thread_channel').$el.hide();
          this.getRegion('posts').$el.show();
          this.ui_state.set({
            total_entries: this.posts.length
          });
        }
        else if (this.categories.length || this.articles.length || this.threads.length || this.channels.length) {
          this.getRegion('empty').$el.stop(true, true).hide();
          this.getRegion('notifications').$el.hide();
          this.getRegion('search').$el.hide();
          this.getRegion('categories').$el.show();
          this.getRegion('articles').$el.show();
          this.getRegion('threads').$el.show();
          this.getRegion('channels').$el.show();
          this.getRegion('posts').$el.hide();
          if (this.categories.length && (this.articles.length || this.threads.length || this.channels.length)) {
            this.getRegion('divider_category_article').$el.show();
          }
          else {
            this.getRegion('divider_category_article').$el.hide();
          }
          if (this.articles.length && (this.threads.length || this.channels.length)) {
            this.getRegion('divider_article_thread').$el.show();
          }
          else {
            this.getRegion('divider_article_thread').$el.hide();
          }
          if (this.threads.length && this.channels.length) {
            this.getRegion('divider_thread_channel').$el.show();
          }
          else {
            this.getRegion('divider_thread_channel').$el.hide();
          }
          this.ui_state.set({
            total_entries: this.categories.length + this.threads.length + this.channels.length + this.articles.length
          });
        }
        else {
          this.getRegion('empty').$el.fadeIn('fast');
          this.getRegion('categories').$el.hide();
          this.getRegion('notifications').$el.hide();
          this.getRegion('search').$el.hide();
          this.getRegion('articles').$el.hide();
          this.getRegion('threads').$el.hide();
          this.getRegion('channels').$el.hide();
          this.getRegion('divider_category_article').$el.hide();
          this.getRegion('divider_article_thread').$el.hide();
          this.getRegion('divider_thread_channel').$el.hide();
          this.getRegion('posts').$el.hide();
          this.ui_state.set({
            total_entries: 0
          });
        }
        _.defer(this.resize);
      },
      deletePayload: function(payload) {
        if (!payload) return;
        //update only if we are viewing the same parent
        if (payload.parent === this.ui_state.get('viewing').id) {
          switch(payload.type) {
            case 'category':
              this.categories.remove(payload);
              break;
            case 'article':
              this.articles.remove(payload);
              break;
            case 'thread':
              this.threads.remove(payload);
              break;
            case 'channel':
              this.channels.remove(payload);
              break;
            case 'post':
              this.posts.remove(payload);
              break;
          }
          this.onRefresh();
        }
        else if (payload.id === this.ui_state.get('viewing').id) {
          //view parent
          Fruum.io.trigger('fruum:view', { id: payload.parent });
        }
      },
      upsertPayload: function(payload) {
        if (!payload) return;
        var viewing = this.ui_state.get('viewing');
        //update only if we are viewing the same parent
        if (payload.parent === viewing.id) {
          //check if content area scroll is on bottom
          var on_bottom = this.isContentOnBottom();
          switch(payload.type) {
            case 'category':
              this.categories.add(payload, {merge: true});
              break;
            case 'article':
              this.articles.add(payload, {merge: true});
              break;
            case 'thread':
              this.threads.add(payload, {merge: true});
              break;
            case 'channel':
              this.channels.add(payload, {merge: true});
              break;
            case 'post':
              this.posts.add(payload, {merge: true});
              break;
          }
          this.onRefresh();
          if (on_bottom) _.defer(this._scrollBottom);
        }
        //check breadcrumb update
        else if (payload.id === viewing.id) {
          if (payload.body != viewing.body ||
              payload.header != viewing.header)
          {
            this.ui_state.set('viewing', {});
            Fruum.io.trigger('fruum:view', {id: payload.id});
          }
          else {
            this.ui_state.set('viewing', payload, { silent: true });
            this.ui_state.trigger('change:viewing');
            this.onRefresh();
          }
        }
      },
      resize: function() {
        var panel_h = this.$el.height(),
            navigation_h = this.getRegion('navigation').$el.outerHeight(),
            interactions_h = this.getRegion('interactions').$el.outerHeight(),
            content_h = 0;
        if (!this.getRegion('interactions').$el.is(':visible')) interactions_h = 0;
        content_h = panel_h - navigation_h - interactions_h;
        this.getRegion('content').$el.height(content_h);
        this.ui_state.set({
          navigation_height: navigation_h,
          interactions_height: interactions_h,
          content_height: content_h,
          panel_height: this.$el.height()
        });
        this.getRegion('content').$el.nanoScroller({ reset: true });
        this.onScroll();
      },
      resize_to_bottom: function() {
        this.getRegion('content').$el.height(
           this.$el.height() - this.getRegion('navigation').$el.outerHeight()
        );
      },
      calculateViewRegions: function() {
        this.calculate_regions_timer = null;
        //find all object elements
        var entries_cls = '';
        if (this.notifications.length)
          entries_cls = '.fruum-js-entry-notification';
        else if (this.ui_state.get('searching'))
          entries_cls = '.fruum-js-entry-search';
        else
          entries_cls = '.fruum-js-entry-default';

        var top = this.getRegion('content').$el.offset().top,
            bottom = top + this.getRegion('content').$el.height(),
            entries = this.$(entries_cls),
            start = 0,
            end = entries.length;
        for (var i = 0; i < entries.length; ++i) {
          if (!start && entries.eq(i).offset().top >= top) {
            start = i + 1;
          }
          else if (entries.eq(i).offset().top > bottom) {
            end = i;
            break;
          }
        }
        this.ui_state.set({
          viewing_from: start,
          viewing_to: end
        });
      },
      bindIO: function(call, send_fn, recv_fn) {
        if (send_fn) {
          this.listenTo(Fruum.io, call, function(payload) {
            send_fn(
              Fruum.utils.chain(Fruum.processors.transmit, payload, call)
            );
          });
        }
        if (recv_fn) {
          this.socket.on(call, function(payload) {
            recv_fn(
              Fruum.utils.chain(Fruum.processors.receive, payload, call)
            );
          });
        }
      },
      saveScrollState: function() {
        var view_id = this.ui_state.get('viewing').id;
        if (view_id)
          this.scroll_history[view_id] = this._getScrollTop();
      },
      restoreScrollState: function() {
        var view_id = this.ui_state.get('viewing').id;
        if (this.scroll_history[view_id]) {
          this._snapTo(this.scroll_history[view_id]);
        }
      },
      hasScrollState: function() {
        return this.scroll_history[this.ui_state.get('viewing').id];
      },
      _getScrollTop: function() {
        return this.getRegion('content').$el.find('.nano-content').scrollTop();
      },
      isContentOnBottom: function() {
        var el = this.getRegion('content').$el.find('.nano-content');
        return (el.get(0).scrollHeight - el.scrollTop()) <= el.outerHeight() + 60;
      },
      //smooth scroll bottom
      _scrollBottom: function() {
        var el = this.getRegion('content').$el.find('.nano-content');
        el.stop(true, true).delay(1).animate({ scrollTop: el.get(0).scrollHeight }, 'fast');
      },
      //smooth scroll top
      _scrollTop: function() {
        var el = this.getRegion('content').$el.find('.nano-content');
        el.stop(true, true).delay(1).animate({ scrollTop: 0 }, 'fast');
      },
      //hard scroll to position
      _snapTo: function(top) {
        this.getRegion('content').$el.nanoScroller({ scrollTop: top });
      },
      //hard scroll bottom
      _snapBottom: function() {
        this.getRegion('content').$el.nanoScroller({ scrollBottom: true });
      },
      //hard scroll top
      _snapTop: function() {
        this.getRegion('content').$el.nanoScroller({ scrollTop: true });
      },
      _consumeData: function() {
        if (window.FruumData && window.FruumData.length) {
          var data = window.FruumData.shift();
          if (!data) return;
          if (data.user) {
            window.fruumSettings.user = data.user;
            if (this.isOpen() && this.socket) {
              this.socket.disconnect();
              this.socket.connect();
            }
          }
          return true;
        }
        return false;
      },

      onInterceptKeyboard: function(event) {
        event.stopPropagation();
      },
      onGoHome: function(event) {
        event && event.preventDefault();
        Fruum.io.trigger('fruum:view', { id: 'home' });
      },
      onRestore: function(event) {
        event && event.preventDefault();
        $(this.ui.message_restore).stop(true, true).slideUp('fast');
        if (this.last_archived_id) Fruum.io.trigger('fruum:restore', { id: this.last_archived_id });
        delete this.last_archived_id;
      },
      onClose: function(event) {
        event && event.preventDefault();
        if (this.$el.hasClass('fruum-hide')) return;
        Fruum.__permanent_abort = true;
        this.$el.addClass('fruum-hide');
        this.socket.disconnect();
        this.$el.stop(true, true).delay(1000).fadeOut(1);
        Fruum.utils.sessionStorage('fruum:open:' + window.fruumSettings.app_id, 0);
      },
      onOpen: function() {
        if (!this.$el.hasClass('fruum-hide')) return;
        Fruum.__permanent_abort = false;
        this.$el.stop(true, true).fadeIn(1);
        this.$el.removeClass('fruum-hide');
        this.ui_state.set('loading', 'connect');
        this.socket.connect();
        Fruum.utils.sessionStorage('fruum:open:' + window.fruumSettings.app_id, 1);
      },
      isOpen: function() {
        return !this.$el.hasClass('fruum-hide');
      },

      //start history route
      startRouter: function() {
        this.router = new Marionette.AppRouter({
          controller: this,
          appRoutes: {
            '!v/:id': 'onRouteView'
          }
        });
        Backbone.history.start();
      },
      onRouteView: function(id) {
        if (id && this.ui_state.get('viewing').id !== id) {
          Fruum.io.trigger('fruum:view', {id: id});
        }
      }
    });

    //initialize plugins
    _.each(Fruum.plugins, function(plugin_fn) {
      var plugin = new plugin_fn();
      if (plugin.post_content)
        Fruum.processors.post.push(plugin.post_content);
      if (plugin.transmit)
        Fruum.processors.transmit.push(plugin.transmit);
      if (plugin.receive)
        Fruum.processors.receive.push(plugin.receive);
      if (plugin.init)
        Fruum.processors.init.push(plugin.init);
    });

    //start app
    var app = new Marionette.Application();
    app.rootView = new RootView({
      el: '#fruum'
    });
    app.on('before:start', function(options) {
    });
    app.on('start', function(options) {
    });

    //register api
    Fruum.api = {
      open: function(doc_id) {
        if (!app.rootView.isOpen()) {
          window.fruumSettings.view_id = doc_id;
          app.rootView.onOpen();
        }
        //if we are already viewing the same document, abort
        else if (doc_id != '*' && doc_id && doc_id !== app.rootView.ui_state.get('viewing').id) {
          Fruum.io.trigger('fruum:view', {id: doc_id, origin: 'link'});
        }
      }
    }

    //ignite`
    app.start();
  }
  //initiate fruum
  if (window.fruumSettings && window.fruumSettings.app_id)
    setup();
})();
