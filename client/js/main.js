/******************************************************************************
Main client app
*******************************************************************************/

/* globals Fruum */

(function() {
  'use strict';
  // here we define the address of the server that is hosting fruum files
  var remote_host = '__url__';
  // executes a function by string
  function executeFunctionByName(functionName, context /*, args */) {
    var args = [].slice.call(arguments).splice(2);
    var namespaces = functionName.split('.');
    var func = namespaces.pop();
    for (var i = 0; i < namespaces.length; i++) {
      context = context[namespaces[i]];
    }
    return context[func].apply(context, args);
  }
  // loads css and html to display fruum panel
  function setup() {
    // load css
    var $ = Fruum.libs.$,
        fruum_html, fruum_css;

    function loadHTML() {
      $('head').append('<style>' + fruum_css + '</style>');
      if (window.fruumSettings.container && $(window.fruumSettings.container).length) {
        $(window.fruumSettings.container).html(fruum_html);
      } else {
        $('body').append(fruum_html);
      }
      run();
    }

    $.get(remote_host + '/_/get/style/' + window.fruumSettings.app_id, function(data) {
      fruum_css = data;
      if (fruum_css && fruum_html) loadHTML();
    });
    $.get(remote_host + '/_/get/html/' + window.fruumSettings.app_id, function(data) {
      fruum_html = data;
      if (fruum_css && fruum_html) loadHTML();
    });
  }

  // when all dependencies have been loaded, start the app
  function run() {
    Fruum.application = {
      fullpage_url: window.fruumSettings.fullpage_url,
      pushstate: window.fruumSettings.fullpage_url && window.fruumSettings.pushstate,
    };

    // libraries
    var $ = Fruum.libs.$,
        _ = Fruum.libs._,
        Backbone = Fruum.libs.Backbone,
        Marionette = Fruum.libs.Marionette,
        io = Fruum.libs.io;

    // load requirements
    _.each(Fruum.require, function(fn) { fn(); });

    // cache some stuff
    var Models = Fruum.models,
        Collections = Fruum.collections,
        Views = Fruum.views;

    // root view
    var RootView = Marionette.View.extend({
      template: _.noop,
      ui: {
        navigation: '.fruum-js-navigation-container',
        content: '.fruum-js-content-container',
        list: '.fruum-js-objects-list',
        share: '.fruum-js-share-container',

        divider_category_article: '.fruum-js-divider-category-article',
        divider_article_blog: '.fruum-js-divider-article-blog',
        divider_blog_thread: '.fruum-js-divider-blog-thread',
        divider_thread_channel: '.fruum-js-divider-thread-channel',

        message_signin: '.fruum-js-message-signin',
        message_reconnect: '.fruum-js-message-reconnecting',
        message_invalid_app: '.fruum-js-message-invalid-app',
        message_restore: '.fruum-js-message-restore',
        message_report: '.fruum-js-message-report',
        message_account_removed: '.fruum-js-message-account-removed',
        message_account_not_exists: '.fruum-js-message-account-not-exists',

        restore_undo: '.fruum-js-restore-undo',
        sticky_section: '.fruum-section-sticky',
        close: '.fruum-js-panel-close',
        maximize: '.fruum-js-panel-maximize',
      },
      regions: {
        breadcrumb: '.fruum-js-region-breadcrumb',
        title: '.fruum-section-title',
        filters: '.fruum-js-region-filters',
        counters: '.fruum-js-region-counters',
        loading: '.fruum-is-loading',
        categories: '.fruum-category-list',
        articles: '.fruum-article-list',
        blogs: '.fruum-blog-list',
        threads: '.fruum-thread-list',
        channels: '.fruum-channel-list',
        posts: '.fruum-post-list',
        search: '.fruum-search-list',
        bookmarksearch: '.fruum-bookmarksearch-list',
        interactions: '.fruum-interactions-section',
        empty: '.fruum-empty-list',
        move: '.fruum-js-move',
        bookmark: '.fruum-js-bookmark',
        profile: '.fruum-js-profile',
      },
      events: {
        'keydown input, textarea': 'onInterceptKeyboard',
        'keyup input, textarea': 'onInterceptKeyboard',
        'click @ui.close': 'onClose',
        'click @ui.maximize': 'onMaximize',
        'click @ui.restore_undo': 'onRestore',
      },
      initialize: function() {
        var that = this;
        // saves scroll state for viewed documents
        this.scroll_history = {};
        // typing template
        this.template_typing = _.template($('#fruum-template-interactions-typing').html());
        this.typing_users = new Backbone.Collection();

        _.bindAll(this,
          'resize', 'onScroll', 'calculateViewRegions',
          '_scrollTop', '_scrollBottom', '_snapTop', '_snapBottom',
          'restoreScrollState', 'saveScrollState', 'onGlobalKey',
          'calculateUpdatesCount'
        );
        $(window).resize(function() {
          Fruum.io.trigger('fruum:resize');
        });
        // models
        while (this._consumeData());
        this.ui_state = new Models.UIState();
        this.profile = new Models.Profile();
        this.all_categories = new Collections.Categories();
        this.categories = new Collections.Categories();
        this.threads = new Collections.Threads();
        this.articles = new Collections.Articles();
        this.blogs = new Collections.Blogs();
        this.channels = new Collections.Channels();
        this.posts = new Collections.Posts();
        this.search = new Collections.Search();
        this.bookmarksearch = new Collections.Search();
        this.notifications = new Collections.Notifications();
        this.profile_topics = new Collections.ProfileTopics();
        this.profile_replies = new Collections.ProfileReplies();
        this.profile_users = new Collections.ProfileUsers();
        this.socket = io(remote_host);

        // initialize plugins
        Fruum.utils.chain(Fruum.processors.init, this);

        // initialize standard regions
        this.showChildView('breadcrumb', new Views.BreadcrumbView({
          model: this.ui_state,
        }));
        this.showChildView('title', new Views.TitleView({
          model: this.ui_state,
        }));
        this.showChildView('filters', new Views.FiltersView({
          model: this.ui_state,
        }));
        this.showChildView('counters', new Views.CountersView({
          model: this.ui_state,
        }));
        this.showChildView('loading', new Views.LoadingView({
          model: this.ui_state,
          content: this.$(this.ui.list),
        }));
        this.showChildView('categories', new Views.CategoriesView({
          collection: this.categories,
          ui_state: this.ui_state,
        }));
        this.showChildView('articles', new Views.ArticlesView({
          collection: this.articles,
          ui_state: this.ui_state,
        }));
        this.showChildView('blogs', new Views.BlogsView({
          collection: this.blogs,
          ui_state: this.ui_state,
        }));
        this.showChildView('threads', new Views.ThreadsView({
          collection: this.threads,
          ui_state: this.ui_state,
        }));
        this.showChildView('channels', new Views.ChannelsView({
          collection: this.channels,
          ui_state: this.ui_state,
        }));
        this.showChildView('posts', new Views.PostsView({
          collection: this.posts,
          ui_state: this.ui_state,
        }));
        this.showChildView('search', new Views.SearchView({
          collection: this.search,
          ui_state: this.ui_state,
        }));
        this.showChildView('bookmarksearch', new Views.BookmarkSearchView({
          collection: this.bookmarksearch,
          ui_state: this.ui_state,
        }));
        this.showChildView('empty', new Views.EmptyView({
          model: this.ui_state,
        }));
        this.showChildView('interactions', new Views.InteractionsView({
          model: this.ui_state,
          collections: {
            categories: this.categories,
            threads: this.threads,
            articles: this.articles,
            blogs: this.blogs,
            channels: this.channels,
            posts: this.posts,
          },
        }));
        this.showChildView('move', new Views.MoveView({
          model: this.ui_state,
          all_categories: this.all_categories,
        }));
        this.showChildView('bookmark', new Views.BookmarkEditView({
          model: this.ui_state,
          all_categories: this.all_categories,
          categories: this.categories,
        }));
        this.showChildView('profile', new Views.ProfileView({
          model: this.profile,
          ui_state: this.ui_state,
          notifications: this.notifications,
          topics: this.profile_topics,
          replies: this.profile_replies,
          users: this.profile_users,
          parent: this.$(this.regions.profile),
        }));
        new Views.ShareView({ // eslint-disable-line
          ui_state: this.ui_state,
          el: this.$(this.ui.share),
        });
        new Views.OnboardingView({ // eslint-disable-line
          ui_state: this.ui_state,
          root_el: this.$el,
        });
        this.listenTo(this.ui_state, 'change:loading change:searching', this.onRefresh);
        this.listenTo(this.ui_state, 'change:searching', function() {
          if (!this.ui_state.get('searching')) {
            if (this.search.length) this.search.reset();
          }
        });
        this.listenTo(this.ui_state, 'change:viewing', function() {
          var type = this.ui_state.get('viewing').type;
          if (_.contains(['channel', 'thread', 'article', 'blog'], type)) {
            $(this.ui.sticky_section).removeClass('fruum-section-empty');
          } else {
            $(this.ui.sticky_section).addClass('fruum-section-empty');
          }
        });

        // ------------------- TYPING NOTIFICATIONS -------------------

        function _cleanTyping() {
          that.typing_timer = null;
          var to_delete = [], now = Date.now();
          that.typing_users.each(function(model) {
            if (now - model.get('timestamp') > 2000) to_delete.push(model);
          });
          that.typing_users.remove(to_delete);
          if (that.typing_users.length) _notifyTyping();
          else {
            that.$('.fruum-interactions-stream-update').slideUp('fast');
          }
        }
        function _notifyTyping() {
          if (that.typing_timer) clearTimeout(that.typing_timer);
          that.typing_timer = setTimeout(_cleanTyping, 1000);
          that.$('.fruum-interactions-stream-update').
            html(that.template_typing({ users: that.typing_users.toJSON() })).
            slideDown('fast');
        }
        this.listenTo(this.typing_users, 'add change:timestamp', _notifyTyping);

        // ------------------- IO EVENTS -------------------

        this.listenTo(Fruum.io, 'fruum:view_default', function() {
          Fruum.io.trigger('fruum:view', {
            id: window.fruumSettings.view_id ||
                that.ui_state.get('viewing').id ||
                Fruum.utils.sessionStorage('fruum:view:' + window.fruumSettings.app_id) ||
                'home',
            origin: window.fruumSettings.view_id ? 'link' : '',
          });
        });
        this.listenTo(Fruum.io, 'fruum:restore_view_route', function() {
          var id = that.ui_state.get('viewing').id;
          if (that.router && id) that.router.navigate('v/' + id, { replace: true });
        });
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
          } else {
            this.$('.fruum-manage').removeClass('fruum-manage-display');
            el.addClass('fruum-manage-display');
          }
        });
        this.listenTo(Fruum.io, 'fruum:close_manage', function() {
          this.$('.fruum-manage').removeClass('fruum-manage-display');
        });

        // ------------------- SHORTCUTS -------------------

        this.listenTo(this.ui_state, 'change:visible', function() {
          if (this.ui_state.get('visible')) {
            $(document).on('keydown', this.onGlobalKey);
          } else {
            $(document).off('keydown', this.onGlobalKey);
          }
        });

        // ------------------- PROFILE -------------------

        this.bindIO('fruum:profile',
          function send(payload) {
            if (!payload) {
              that.ui_state.set('profile', '');
              return;
            }
            that.profile.set(that.profile.defaults);
            that.profile_topics.reset();
            that.profile_replies.reset();
            if (payload.id == Fruum.user.id) {
              // prefill
              that.profile.set(Fruum.user);
            }
            that.ui_state.set('profile', payload.username);
            if (that.router && payload.username) {
              that.router.navigate('u/' + encodeURIComponent(payload.username));
            }
            // count users
            if (!that.ui_state.get('profile_total_users')) {
              payload.count_users = true;
            }
            that.socket.emit('fruum:profile', payload);
          },
          function recv(payload) {
            if (payload) {
              that.profile.set(payload);
              if (payload.users) {
                that.ui_state.set('profile_total_users', payload.users);
              }
            } else {
              if (that.ui_state.get('profile')) {
                that.ui_state.set('profile', '');
                Fruum.io.trigger('fruum:view_default');
                // show error message
                $(that.ui.message_account_not_exists).stop(true, true).
                  delay(500).slideDown('fast').delay(3000).slideUp('slow');
              }
            }
          }
        );

        this.bindIO('fruum:user:feed',
          function send(payload) {
            that.socket.emit('fruum:user:feed', payload);
          },
          function recv(payload) {
            if (payload && payload.id == that.profile.get('id')) {
              switch (payload.feed) {
                case 'topics':
                  if (payload.from) {
                    that.profile_topics.add(payload.docs);
                  } else {
                    that.profile_topics.reset(payload.docs);
                  }
                  break;
                case 'replies':
                  if (payload.from) {
                    that.profile_replies.add(payload.docs);
                  } else {
                    that.profile_replies.reset(payload.docs);
                  }
                  break;
              }
            }
          }
        );

        this.bindIO('fruum:user:list',
          function send(payload) {
            that.socket.emit('fruum:user:list', payload);
          },
          function recv(payload) {
            if (!payload) return;
            if (payload.from) {
              that.profile_users.add(payload.users);
            } else {
              that.profile_users.reset(payload.users);
            }
            if (that.ui_state.get('profile_total_users') < that.profile_users.length) {
              that.ui_state.set('profile_total_users', that.profile_users.length);
            }
          }
        );

        // ------------------- VIEW -------------------

        this.bindIO('fruum:view',
          function send(payload) {
            // save previous scroll pos
            that.saveScrollState();
            // grab some meta data from the trigger
            var loading = payload.origin || ('view:' + payload.id);
            // remove metadata
            delete payload.origin;
            that.ui_state.set({
              loading: loading,
              view_req: payload.id,
            });
            that.socket.emit('fruum:view', payload);
          },
          function recv(payload) {
            if (!payload) {
              that.ui_state.set({
                loading: '',
                load_state: 'not_found',
                viewing: {},
              });
              that.categories.reset();
              that.articles.reset();
              that.blogs.reset();
              that.threads.reset();
              that.channels.reset();
              that.posts.reset();
              that.bookmarksearch.reset();
              that.onRefresh();
              return;
            }

            var breadcrumb = payload.breadcrumb || [];
            var last_doc = breadcrumb.pop() || {};
            that.ui_state.set({
              loading: '',
              load_state: 'found',
              breadcrumb: breadcrumb,
              online: payload.online || {},
            });

            if (that.ui_state.get('viewing').id != last_doc.id) {
              that.ui_state.set({
                viewing: last_doc,
              });
            }

            // reset edit
            if (that.ui_state.get('viewing').id != that.ui_state.get('editing').parent) {
              that.ui_state.set({
                editing: {},
              });
            }

            var categories = [],
                articles = [],
                blogs = [],
                threads = [],
                channels = [],
                posts = [],
                bookmarksearch = [];

            if (last_doc.type == 'bookmark') {
              bookmarksearch = payload.documents;
            } else {
              if (last_doc.body) {
                switch (last_doc.type) {
                  case 'article':
                  case 'blog':
                  case 'thread':
                    posts.push(last_doc);
                    break;
                }
              }

              _.each(payload.documents, function(entry) {
                switch (entry.type) {
                  case 'category':
                  case 'bookmark':
                    categories.push(entry);
                    break;
                  case 'article':
                    articles.push(entry);
                    break;
                  case 'blog':
                    blogs.push(entry);
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
            }

            that.categories.reset(categories);
            that.articles.reset(articles);
            that.blogs.reset(blogs);
            that.threads.reset(threads);
            that.channels.reset(channels);
            that.posts.reset(posts);
            that.bookmarksearch.reset(bookmarksearch);

            that.onRefresh();

            if (that.ui_state.get('jumpto_post') > 0) {
              var jumpto_post = that.ui_state.get('jumpto_post');
              that.ui_state.set('jumpto_post', 0);
              that.listenToOnce(Fruum.io, 'fruum:layout', function() {
                _.defer(function() {
                  that.jumpToPost(jumpto_post);
                });
              });
            } else if (last_doc.type === 'channel') {
              // scroll to bottom
              _.defer(that._snapBottom);
            } else {
              // scroll to top
              if (that.hasScrollState()) {
                _.defer(that.restoreScrollState);
              } else {
                _.defer(that._snapTop);
              }
            }

            // remove from notifications
            if (Fruum.userUtils.hasNotification(payload.id)) {
              Fruum.io.trigger('fruum:unnotify', { id: payload.id });
            }

            // store on local storage
            Fruum.utils.sessionStorage('fruum:view:' + window.fruumSettings.app_id, last_doc.id);
            if (that.router) that.router.navigate('v/' + last_doc.id);

            // update visit timestamp
            Fruum.utils.setVisitDate(last_doc.id);
          }
        );

        // ------------------- ADD UPDATE DOCUMENT -------------------

        this.bindIO('fruum:add',
          function send(payload) {
            that.ui_state.set({
              loading: 'add',
              interacting: true,
            });
            that.socket.emit('fruum:add', payload);
          },
          function recv(payload) {
            that.ui_state.set({
              loading: '',
              interacting: false,
            });
            if (!payload) {
              Fruum.io.trigger('fruum:message', 'error');
              return;
            }
            that.ui_state.set('editing', {});
            that.upsertPayload(payload);
            var watch_id;
            switch (payload.type) {
              case 'thread':
              case 'article':
              case 'blog':
                watch_id = payload.id;
                Fruum.io.trigger('fruum:view', { id: payload.id });
                break;
              case 'channel':
                Fruum.io.trigger('fruum:view', { id: payload.id });
                break;
              case 'post':
                if (_.contains(['thread', 'article', 'blog'], payload.parent_type)) {
                  watch_id = payload.parent;
                }
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
              interacting: true,
            });
            that.socket.emit('fruum:update', payload);
          },
          function recv(payload) {
            that.ui_state.set({
              loading: '',
              interacting: false,
            });
            if (!payload) {
              Fruum.io.trigger('fruum:message', 'error');
              return;
            }
            that.ui_state.set('editing', {});
            that.upsertPayload(payload);
          }
        );

        // ------------------- REACTION -------------------

        this.bindIO('fruum:react',
          function send(payload) {
            that.socket.emit('fruum:react', payload);
          },
          function recv(payload) {
            if (!payload) return;
            that.upsertPayload(payload);
          }
        );

        // ------------------- DELETION -------------------

        this.bindIO('fruum:delete',
          function send(payload) {
            that.ui_state.set({
              loading: 'delete',
              interacting: true,
            });
            that.socket.emit('fruum:delete', payload);
          },
          function recv(payload) {
            that.ui_state.set({
              loading: '',
              interacting: false,
            });
            if (!payload) return;
            that.deletePayload(payload);
          }
        );

        this.bindIO('fruum:archive',
          function send(payload) {
            that.ui_state.set({
              loading: 'archive',
              interacting: true,
            });
            that.socket.emit('fruum:archive', payload);
            $(that.ui.message_restore).stop(true, true).slideDown('fast').delay(4000).slideUp('slow');
            that.last_archived_id = payload.id;
          },
          function recv(payload) {
            that.ui_state.set({
              loading: '',
              interacting: false,
            });
            if (!payload) return;
            that.deletePayload(payload);
          }
        );

        this.bindIO('fruum:restore',
          function send(payload) {
            that.ui_state.set({
              loading: 'restore',
              interacting: true,
            });
            that.socket.emit('fruum:restore', payload);
          },
          function recv(payload) {
            that.ui_state.set({
              loading: '',
              interacting: false,
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

        // ------------------- MOVE -------------------

        this.bindIO('fruum:categories',
          function send(payload) {
            that.socket.emit('fruum:categories', payload);
          },
          function recv(payload) {
            if (payload && payload.categories) {
              that.all_categories.reset(payload.categories);
            }
          }
        );

        this.bindIO('fruum:move',
          function send(payload) {
            that.socket.emit('fruum:move', payload);
          },
          function recv(payload) {
            if (payload) {
              that.deletePayload(payload.source);
              that.upsertPayload(payload.target);
            }
          }
        );

        // -------------------- NOTIFICATIONS --------------------

        // fetch notifications
        this.bindIO('fruum:notifications',
          function send(payload) {
            that.socket.emit('fruum:notifications', payload);
          },
          function recv(payload) {
            if (!payload.notifications) return;
            // update badge
            var ids = [];
            _.each(payload.notifications, function(document) {
              ids.push(document.id);
            });
            // find not existent notifications
            var diff = _.difference(Fruum.user.notifications || [], ids);
            Fruum.user.notifications = ids;
            Fruum.io.trigger('fruum:update_notify');
            // store in collection
            that.notifications.reset(payload.notifications);
            // remove invalid notifications
            _.each(diff, function(doc_id) {
              Fruum.io.trigger('fruum:unnotify', { id: doc_id });
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

        this.bindIO('fruum:typing',
          function send(payload) {
            that.socket.emit('fruum:typing', {});
          },
          function recv(payload) {
            if (payload) {
              var model = that.typing_users.get(payload);
              if (model) model.set('timestamp', Date.now());
              else {
                that.typing_users.add({
                  id: payload,
                  timestamp: Date.now(),
                });
              }
            }
          }
        );

        this.bindIO('fruum:onboard',
          function send(payload) {
            that.socket.emit('fruum:onboard', payload);
          },
          function recv(payload) {
            // noop
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
              interacting: true,
            });
            that.socket.emit('fruum:field', payload);
          },
          function recv(payload) {
            that.ui_state.set({
              loading: '',
              interacting: false,
            });
            if (!payload) return;
            that.upsertPayload(payload);
          }
        );

        // ------------------- POSTS -------------------

        // authenticate
        this.socket.on('fruum:auth', function(payload) {
          if (!payload) {
            that.__permanent_abort = true;
            $(that.ui.message_invalid_app).slideDown('fast');
            that.ui_state.set('loading', '');
            return;
          }
          Fruum.user = payload.user || Fruum.user;
          Fruum.user.time_diff = Date.now() - Fruum.user.server_now;
          Fruum.utils.resetVisits();
          that.ui_state.set('connected', true);
          that.onRefresh();
          if (window.fruumSettings.view_id == '*') window.fruumSettings.view_id = undefined;
          // check for viewing profile
          if (that.ui_state.get('profile')) {
            Fruum.io.trigger('fruum:profile', { username: that.ui_state.get('profile') });
          } else {
            Fruum.io.trigger('fruum:view_default');
          }
          $(that.ui.message_reconnect).slideUp('fast');
          $(that.ui.message_signin).slideUp('fast');
          that.ui_state.get('viewing').id = undefined;
          window.fruumSettings.view_id = undefined;
          if (window.fruumSettings.jumpto | 0) {
            that.ui_state.set('jumpto_post', window.fruumSettings.jumpto | 0);
            window.fruumSettings.jumpto = undefined;
          }
          // check for karma update
          var karma_diff = Fruum.user.karma - Fruum.user.logout_karma;
          if (karma_diff) Fruum.io.trigger('fruum:new_karma', karma_diff);
          // ready event
          if (window.fruumSettings.ready) {
            if (_.isFunction(window.fruumSettings.ready)) {
              window.fruumSettings.ready();
            } else if (_.isString(window.fruumSettings.ready)) {
              executeFunctionByName(window.fruumSettings.ready, window);
            }
          }
        });

        // ----------------- LIVE UPDATES -----------------

        this.socket.on('fruum:karma', function(payload) {
          if (payload && payload.karma) {
            var diff = payload.karma - (Fruum.user.karma || 0);
            Fruum.user.karma = payload.karma;
            if (diff) Fruum.io.trigger('fruum:new_karma', diff);
          }
        });
        this.socket.on('fruum:dirty', function(payload) {
          if (payload) {
            // admin
            if (Fruum.user.admin) {
              that.upsertPayload(payload);
            } else if (!Fruum.user.anonymous) {
              // logged in user
              if (!payload.visible || payload.permission >= 2) {
                that.deletePayload(payload);
              } else {
                that.upsertPayload(payload);
              }
            } else {
              // anonymous
              if (!payload.visible || payload.permission >= 1) {
                that.deletePayload(payload);
              } else {
                that.upsertPayload(payload);
              }
            }
          }
        });
        this.socket.on('fruum:info', function(payload) {
          // enable notification badge
          if (payload && payload.id && that.ui_state.get('viewing').id != payload.id) {
            Fruum.utils.addVisitUpdate(payload.id);
            // also update existing documents
            var model;
            switch (payload.type) {
              case 'category':
                model = that.categories.get(payload.id);
                break;
              case 'article':
                model = that.articles.get(payload.id);
                break;
              case 'blog':
                model = that.blogs.get(payload.id);
                break;
              case 'thread':
                model = that.threads.get(payload.id);
                break;
              case 'channel':
                model = that.channels.get(payload.id);
                break;
              case 'post':
                model = that.posts.get(payload.id);
                break;
            }
            if (model) {
              model.set(payload);
              _.defer(that.calculateUpdatesCount);
            }
          }
        });
        this.socket.on('fruum:online', function(payload) {
          if (!payload) return;
          that.ui_state.set(
            'online',
            _.extend(that.ui_state.get('online'), payload)
          );
          // update region counters
          var el = that.$(that.regions.channels);
          for (var channel in payload) {
            el.find('[data-channel-members="' + channel + '"]').html(payload[channel]);
          }
        });

        // ----------------- SEARCH -----------------

        this.bindIO('fruum:search',
          function send(text) {
            that.ui_state.set({
              search: text,
            });
            if (!that.ui_state.get('searching') || !text) {
              if (that.search.length) that.search.reset();
              that.onRefresh();
            } else {
              that.ui_state.set({
                loading: 'search',
              });
              that.socket.emit('fruum:search', {
                q: text,
              });
            }
          },
          function recv(payload) {
            if (that.ui_state.get('loading') == 'search') {
              that.ui_state.set('loading', '');
            }
            if (!payload) return;
            // check if search is valid
            if (payload.q === that.ui_state.get('search') && that.ui_state.get('searching')) {
              that.search.reset(payload.results);
              that.onRefresh();
              if (that.router) that.router.navigate('s/' + encodeURIComponent(payload.q));
            }
          }
        );

        this.bindIO('fruum:autocomplete',
          function send(payload) {
            that.socket.emit('fruum:autocomplete', payload);
          },
          function recv(payload) {
            if (payload) Fruum.io.trigger('fruum:autocomplete_results', payload);
          }
        );

        // ----------------- OPTIMIZE -----------------

        this.bindIO('fruum:optimize',
          function send(payload) {
            that.ui_state.set('optimizing', that.ui_state.get('optimizing') + 1);
            that.socket.emit('fruum:optimize', payload);
          },
          function recv(payload) {
            that.ui_state.set('optimizing', Math.max(0, that.ui_state.get('optimizing') - 1));
            that.ui_state.trigger('fruum:optimize', payload);
          }
        );

        // -------------------- USER MANAGEMENT --------------------

        this.bindIO('fruum:user:block',
          function send(payload) {
            that.socket.emit('fruum:user:block', payload);
          },
          function recv(payload) {
          }
        );

        this.bindIO('fruum:user:unblock',
          function send(payload) {
            that.socket.emit('fruum:user:unblock', payload);
          },
          function recv(payload) {
          }
        );

        this.bindIO('fruum:user:remove',
          function send(payload) {
            that.socket.emit('fruum:user:remove', payload);
          },
          function recv(payload) {
            if (payload) {
              $(that.ui.message_account_removed).stop(true, true).
                delay(500).slideDown('fast').delay(3000).slideUp('slow');
            }
          }
        );

        // ----------------- START -----------------

        this.socket.on('connect', function() {
          that.__signin = false;
          that.socket.emit('fruum:auth', window.fruumSettings);
        });
        this.socket.on('disconnect', function() {
          that.ui_state.set('connected', false);
          if (that.__signin) {
            $(that.ui.message_signin).slideDown('fast');
          } else if (!that.__permanent_abort) {
            $(that.ui.message_reconnect).slideDown('fast');
          }
        });

        setInterval(function() {
          while (that._consumeData());
        }, 1000);

        // close preview
        _.defer(function() {
          $('#fruum-preview').removeClass('fruum-clicked fruum-peak');
        });
        // remove hide button on full page mode
        if (window.fruumSettings.fullpage) {
          this.$(this.ui.close).remove();
          this.$(this.ui.maximize).remove();
        }
        // if history is enabled enable it
        if (window.fruumSettings.history) {
          this.startRouter();
        }
        // start nano scroller
        this.$(this.ui.content).nanoScroller({
          preventPageScrolling: true,
          iOSNativeScrolling: true,
          disableResize: true,
        });
        this.$(this.ui.content).on('update', this.onScroll);

        // store open state
        Fruum.utils.sessionStorage('fruum:open:' + window.fruumSettings.app_id, 1);

        // start with loading state open
        this.ui_state.set('loading', 'connect');
        this.onRefresh();
        Fruum.io.trigger('fruum:resize');

        this.ui_state.set('visible', true);
      },
      onScroll: function() {
        if (this.calculate_regions_timer) return;
        this.calculate_regions_timer = setTimeout(this.calculateViewRegions, 200);
      },
      onRefresh: function() {
        var viewing_type = this.ui_state.get('viewing').type;
        if (this.ui_state.get('searching')) {
          // Search mode
          this.$(this.regions.empty).stop(true, true).hide();
          this.$(this.regions.categories).hide();
          this.$(this.regions.bookmarksearch).hide();
          this.$(this.regions.articles).hide();
          this.$(this.regions.blogs).hide();
          this.$(this.regions.threads).hide();
          this.$(this.regions.channels).hide();
          this.$(this.regions.posts).hide();
          this.$(this.regions.search).show();
          this.$(this.ui.divider_category_article).hide();
          this.$(this.ui.divider_article_blog).hide();
          this.$(this.ui.divider_blog_thread).hide();
          this.$(this.ui.divider_thread_channel).hide();
          this.ui_state.set({
            total_entries: this.search.length,
          });
        } else if (viewing_type === 'bookmark') {
          this.$(this.regions.empty).stop(true, true).hide();
          this.$(this.regions.categories).hide();
          this.$(this.regions.bookmarksearch).show();
          this.$(this.regions.articles).hide();
          this.$(this.regions.blogs).hide();
          this.$(this.regions.threads).hide();
          this.$(this.regions.channels).hide();
          this.$(this.regions.posts).hide();
          this.$(this.regions.search).hide();
          this.$(this.ui.divider_category_article).hide();
          this.$(this.ui.divider_article_blog).hide();
          this.$(this.ui.divider_blog_thread).hide();
          this.$(this.ui.divider_thread_channel).hide();
          this.ui_state.set({
            total_entries: this.bookmarksearch.length,
          });
        } else if (_.contains(['channel', 'thread', 'article', 'blog'], viewing_type)) {
          // Viewing posts
          this.$(this.regions.empty).stop(true, true).hide();
          this.$(this.regions.search).hide();
          this.$(this.regions.categories).hide();
          this.$(this.regions.bookmarksearch).hide();
          this.$(this.regions.articles).hide();
          this.$(this.regions.blogs).hide();
          this.$(this.regions.threads).hide();
          this.$(this.regions.channels).hide();
          this.$(this.regions.posts).show();
          this.$(this.ui.divider_category_article).hide();
          this.$(this.ui.divider_article_blog).hide();
          this.$(this.ui.divider_blog_thread).hide();
          this.$(this.ui.divider_thread_channel).hide();
          this.ui_state.set({
            total_entries: this.posts.length,
          });
        } else if (this.categories.length || this.articles.length ||
            this.blogs.length || this.threads.length ||
            this.channels.length
        ) {
          this.$(this.regions.empty).stop(true, true).hide();
          this.$(this.regions.search).hide();
          this.$(this.regions.categories).show();
          this.$(this.regions.bookmarksearch).hide();
          this.$(this.regions.articles).show();
          this.$(this.regions.blogs).show();
          this.$(this.regions.threads).show();
          this.$(this.regions.channels).show();
          this.$(this.regions.posts).hide();
          if (this.categories.length &&
              (this.articles.length || this.blogs.length || this.threads.length || this.channels.length)
          ) {
            this.$(this.ui.divider_category_article).show();
          } else {
            this.$(this.ui.divider_category_article).hide();
          }
          if (this.articles.length &&
              (this.blogs.length || this.threads.length || this.channels.length)
          ) {
            this.$(this.ui.divider_article_blog).show();
          } else {
            this.$(this.ui.divider_article_blog).hide();
          }
          if (this.blogs.length &&
              (this.threads.length || this.channels.length)) {
            this.$(this.ui.divider_blog_thread).show();
          } else {
            this.$(this.ui.divider_blog_thread).hide();
          }
          if (this.threads.length && this.channels.length) {
            this.$(this.ui.divider_thread_channel).show();
          } else {
            this.$(this.ui.divider_thread_channel).hide();
          }
          this.ui_state.set({
            total_entries: this.categories.length +
                           this.threads.length +
                           this.channels.length +
                           this.articles.length +
                           this.blogs.length,
          });
        } else {
          this.$(this.regions.empty).fadeIn('fast');
          this.$(this.regions.categories).hide();
          this.$(this.regions.bookmarksearch).hide();
          this.$(this.regions.search).hide();
          this.$(this.regions.articles).hide();
          this.$(this.regions.blogs).hide();
          this.$(this.regions.threads).hide();
          this.$(this.regions.channels).hide();
          this.$(this.regions.posts).hide();
          this.$(this.ui.divider_category_article).hide();
          this.$(this.ui.divider_article_blog).hide();
          this.$(this.ui.divider_blog_thread).hide();
          this.$(this.ui.divider_thread_channel).hide();
          this.ui_state.set({
            total_entries: 0,
          });
        }
        _.defer(this.resize);
      },
      deletePayload: function(payload) {
        if (!payload) return;
        // update only if we are viewing the same parent
        if (payload.parent === this.ui_state.get('viewing').id) {
          switch (payload.type) {
            case 'category':
            case 'bookmark':
              this.categories.remove(payload);
              break;
            case 'article':
              this.articles.remove(payload);
              break;
            case 'blog':
              this.blogs.remove(payload);
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
        } else if (payload.id === this.ui_state.get('viewing').id) {
          // view parent
          Fruum.io.trigger('fruum:view', { id: payload.parent });
        }
      },
      upsertPayload: function(payload) {
        if (!payload) return;
        var viewing = this.ui_state.get('viewing');
        // update only if we are viewing the same parent
        if (payload.parent === viewing.id) {
          // check if content area scroll is on bottom
          var on_bottom = this.isContentOnBottom();
          switch (payload.type) {
            case 'category':
            case 'bookmark':
              this.categories.add(payload, {merge: true});
              break;
            case 'article':
              this.articles.add(payload, {merge: true});
              break;
            case 'blog':
              this.blogs.add(payload, {merge: true});
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
        } else if (payload.id === viewing.id) {
          // check breadcrumb update
          if (payload.body != viewing.body ||
              payload.header != viewing.header
          ) {
            this.ui_state.set('viewing', {});
            Fruum.io.trigger('fruum:view', {id: payload.id});
          } else {
            // check for reaction changes on first post
            if (this.posts.get(payload.id)) {
              this.posts.add(payload, {merge: true});
            }
            this.ui_state.set('viewing', payload, { silent: true });
            this.ui_state.trigger('change:viewing');
            this.onRefresh();
          }
        }
      },
      resize: function() {
        var panel_h = this.$el.height(),
            navigation_h = this.$(this.ui.navigation).outerHeight(),
            interactions_h = this.$(this.regions.interactions).outerHeight(),
            content_h = 0;
        if (!this.$(this.regions.interactions).is(':visible')) interactions_h = 0;
        content_h = panel_h - navigation_h - interactions_h;
        this.$(this.ui.content).height(content_h);
        this.ui_state.set({
          navigation_height: navigation_h,
          interactions_height: interactions_h,
          content_height: content_h,
          panel_height: this.$el.height(),
        });
        this.$(this.ui.content).nanoScroller({ reset: true });
        this.onScroll();
        Fruum.io.trigger('fruum:layout');
      },
      resize_to_bottom: function() {
        this.$(this.ui.content).height(
           this.$el.height() - this.$(this.ui.navigation).outerHeight()
        );
      },
      calculateViewRegions: function() {
        this.calculate_regions_timer = null;
        // find all object elements
        var entries_cls = '';
        if (this.ui_state.get('searching')) {
          entries_cls = '.fruum-js-entry-search';
        } else {
          entries_cls = '.fruum-js-entry-default';
        }

        var top = this.$(this.ui.content).offset().top,
            bottom = top + this.$(this.ui.content).height(),
            entries = this.$(entries_cls),
            total = entries.length,
            start = 0,
            end = total;
        for (var i = 0; i < entries.length; ++i) {
          if (!start && entries.eq(i).offset().top >= top) {
            start = i + 1;
          } else if (entries.eq(i).offset().top > bottom) {
            end = i;
            break;
          }
        }
        this.ui_state.set({
          viewing_from: start,
          viewing_to: end,
          search_helper: (start >= 20) && end < total &&
                         this.ui_state.get('viewing').type == 'category',
        });
        this.calculateUpdatesCount();
      },
      calculateUpdatesCount: function() {
        if (this.ui_state.get('viewing').type != 'category') {
          this.ui_state.set('updates_count', 0);
          return;
        }
        var top = this.$(this.ui.content).offset().top,
            bottom = top + this.$(this.ui.content).height(),
            count = 0;
        // find updates that are not visible
        var entries = this.$('.fruum-js-has-update');
        for (var i = 0; i < entries.length; ++i) {
          if (entries.eq(i).offset().top > bottom) {
            count++;
          } else {
            entries.eq(i).removeClass('fruum-js-has-update');
          }
        }
        this.ui_state.set('updates_count', count);
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
        if (view_id) {
          this.scroll_history[view_id] = this._getScrollTop();
        }
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
        return this.$(this.ui.content).find('.nano-content').scrollTop();
      },
      isContentOnBottom: function() {
        var el = this.$(this.ui.content).find('.nano-content');
        return (el.get(0).scrollHeight - el.scrollTop()) <= el.outerHeight() + 60;
      },
      // smooth scroll bottom
      _scrollBottom: function() {
        var el = this.$(this.ui.content).find('.nano-content');
        el.stop(true, true).delay(1).animate({ scrollTop: el.get(0).scrollHeight }, 'fast');
      },
      // smooth scroll top
      _scrollTop: function() {
        var el = this.$(this.ui.content).find('.nano-content');
        el.stop(true, true).delay(1).animate({ scrollTop: 0 }, 'fast');
      },
      // hard scroll to position
      _snapTo: function(top) {
        this.$(this.ui.content).nanoScroller({ scrollTop: top });
      },
      // hard scroll to el
      _snapToEl: function(el) {
        if (el && el.length) {
          this.$(this.ui.content).nanoScroller({ scrollTo: el });
        }
      },
      // hard scroll bottom
      _snapBottom: function() {
        this.$(this.ui.content).nanoScroller({ scrollBottom: true });
      },
      // hard scroll top
      _snapTop: function() {
        this.$(this.ui.content).nanoScroller({ scrollTop: true });
      },
      _consumeData: function() {
        if (window.FruumData && window.FruumData.length) {
          var data = window.FruumData.shift();
          if (!data) return;
          if (data.user) {
            window.fruumSettings.user = data.user;
            if (this.isOpen() && this.socket) {
              this.__signin = true;
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
      jumpToPost: function(index) {
        if (index > 0) {
          this._snapToEl(this.$(this.regions.posts).find('.fruum-js-entry-default').eq(index - 1));
        }
      },
      onRestore: function(event) {
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }
        $(this.ui.message_restore).stop(true, true).slideUp('fast');
        if (this.last_archived_id) Fruum.io.trigger('fruum:restore', { id: this.last_archived_id });
        delete this.last_archived_id;
      },
      onClose: function(event) {
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }
        if (this.$el.hasClass('fruum-hide')) return;
        this.__permanent_abort = true;
        this.$el.addClass('fruum-hide');
        this.socket.disconnect();
        this.$el.stop(true, true).delay(1000).fadeOut(1);
        this.ui_state.set('visible', false);
        Fruum.utils.sessionStorage('fruum:open:' + window.fruumSettings.app_id, 0);
      },
      onMaximize: function(event) {
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }
        this.$el.toggleClass('fruum-takeover');
        if (this.$el.hasClass('fruum-takeover')) {
          this.$(this.ui.maximize).removeClass('fruum-icon-left').addClass('fruum-icon-right');
        } else {
          this.$(this.ui.maximize).removeClass('fruum-icon-right').addClass('fruum-icon-left');
        }
      },
      onGlobalKey: function(event) {
        switch (event.which) {
          case 27:
            if (!window.fruumSettings.fullpage) this.onClose();
            break;
          case 13:
            Fruum.io.trigger('fruum:default_action');
            break;
        }
      },
      onOpen: function() {
        if (!this.$el.hasClass('fruum-hide')) return;
        this.__permanent_abort = false;
        this.$el.stop(true, true).fadeIn(1);
        this.$el.removeClass('fruum-hide');
        this.ui_state.set({
          loading: 'connect',
          visible: true,
        });
        this.socket.connect();
        Fruum.utils.sessionStorage('fruum:open:' + window.fruumSettings.app_id, 1);
      },
      isOpen: function() {
        return !this.$el.hasClass('fruum-hide');
      },

      // start history route
      startRouter: function() {
        this.router = new Marionette.AppRouter({
          controller: this,
          appRoutes: {
            's/:query': 'onRouteSearch',
            'u/:username': 'onRouteProfile',
            'v/:id': 'onRouteView',
            'v/:id/': 'onRouteView',
            'v/:id/:post': 'onRouteViewPost',
          },
        });
        if (Fruum.application.pushstate) {
          Backbone.history.start({
            pushState: true,
            root: Fruum.utils.getLocation(Fruum.application.fullpage_url).pathname,
          });
        } else {
          Backbone.history.start();
        }
      },
      onRouteProfile: function(username) {
        username = decodeURIComponent(username);
        if (this.ui_state.get('profile') != username) {
          Fruum.io.trigger('fruum:profile', { username: username });
        }
      },
      onRouteSearch: function(query) {
        this.ui_state.set('profile', '');
        if (!this.ui_state.get('searching') ||
          (this.ui_state.get('searching') && this.ui_state.get('search') != query)
        ) {
          Fruum.io.trigger('fruum:set_search', query);
        }
      },
      onRouteView: function(id) {
        if (this.ui_state.get('searching')) {
          Fruum.io.trigger('fruum:clear_search');
        }
        this.ui_state.set('profile', '');
        this.ui_state.set('jumpto_post', 0);
        if (id && this.ui_state.get('viewing').id !== id) {
          Fruum.io.trigger('fruum:view', {id: id});
        }
      },
      onRouteViewPost: function(id, post) {
        if (this.ui_state.get('searching')) {
          Fruum.io.trigger('fruum:clear_search');
        }
        this.ui_state.set('profile', '');
        if (id && this.ui_state.get('viewing').id !== id) {
          this.ui_state.set('jumpto_post', post);
          Fruum.io.trigger('fruum:view', {id: id});
        } else {
          this.jumpToPost(post);
        }
      },
    });

    // initialize plugins
    _.each(Fruum.plugins, function(plugin_fn) {
      var plugin = new plugin_fn(); // eslint-disable-line
      if (plugin.personaSays) {
        Fruum.processors.persona.push(plugin.personaSays);
      }
      if (plugin.post_content) {
        Fruum.processors.post.push(plugin.post_content);
      }
      if (plugin.transmit) {
        Fruum.processors.transmit.push(plugin.transmit);
      }
      if (plugin.receive) {
        Fruum.processors.receive.push(plugin.receive);
      }
      if (plugin.init) {
        Fruum.processors.init.push(plugin.init);
      }
    });

    // start app
    var app = new Marionette.Application();
    app.rootView = new RootView({
      el: '#fruum',
    });

    // register to global Fruum object
    Fruum.RootView = app.rootView;

    // register api
    Fruum.api = {
      open: function(doc_id) {
        if (!app.rootView.isOpen()) {
          window.fruumSettings.view_id = doc_id;
          window.fruumSettings.jumpto = undefined;
          app.rootView.onOpen();
        } else if (
          doc_id != '*' &&
          doc_id &&
          doc_id !== app.rootView.ui_state.get('viewing').id
        ) {
          // if we are already viewing the same document, abort
          Fruum.io.trigger('fruum:view', {id: doc_id, origin: 'link'});
        }
      },
    };

    // ignite`
    app.start();
  }
  // initiate fruum
  if (window.fruumSettings && window.fruumSettings.app_id) {
    setup();
  }
})();
