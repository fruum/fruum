/******************************************************************************
Handles the bottom input part
*******************************************************************************/

(function() {
  'use strict';
  window.Fruum.require.push(function () {
    Fruum.views = Fruum.views || {};
    //libraries
    var $ = Fruum.libs.$,
        _ = Fruum.libs._,
        Backbone = Fruum.libs.Backbone,
        Marionette = Fruum.libs.Marionette;
    //View
    Fruum.views.InteractionsView = Marionette.ItemView.extend({
      ui: {
        post: '[data-action="post"]',
        add_category: '[data-action="add_category"]',
        add_article: '[data-action="add_article"]',
        add_thread: '[data-action="add_thread"]',
        add_channel: '[data-action="add_channel"]',
        add_post: '[data-action="add_post"]',
        cancel: '[data-action="cancel"]',
        help: '[data-action="help"]',
        help_panel: '.fruum-js-help',
        show_notifications: '.fruum-js-show-notifications',
        avatar_container: '.fruum-js-avatar-container',
        field_parent: '[data-field="parent"]',
        field_type: '[data-field="type"]',
        field_initials: '[data-field="initials"]',
        field_header: '[data-field="header"]',
        field_body: '[data-field="body"]',
        field_notifications: '[data-field="notifications"]',
        field_is_blog: '[data-field="is_blog"]',
        channel_input: '.fruum-js-channel-input'
      },
      modelEvents: {
        'change:editing change:viewing change:searching': 'onChange',
        'change:interacting change:connected': 'onInteracting'
      },
      events: {
        'focus @ui.field_initials': 'onInitialFocus',
        'keydown @ui.field_initials': 'onInitialsKeydown',
        'keydown @ui.field_body': 'onBodyKeydown',
        'keydown @ui.channel_input': 'onChannelKey',
        'blur @ui.field_header': 'onHeaderBlur',
        'click @ui.help': 'onHelp',
        'click @ui.post': 'onPost',
        'click @ui.add_thread': 'onAddThread',
        'click @ui.add_article': 'onAddArticle',
        'click @ui.add_channel': 'onAddChannel',
        'click @ui.add_category': 'onAddCategory',
        'click @ui.add_post': 'onAddPost',
        'click @ui.cancel': 'onCancel',
        'click @ui.show_notifications': 'onShowNotifications',
        //capture changes and store them
        'blur @ui.field_body': 'onBodyBlur',
        'keyup @ui.field_body': 'onKeyBody',
        'keyup @ui.field_header': 'onKeyHeader',
        'keyup @ui.field_initials': 'onKeyInitials',
        'change @ui.field_is_blog': 'onKeyIsBlog'
      },
      initialize: function(options) {
        this.ui_state = this.model;
        this.collections = options.collections;
        this.listenTo(Fruum.io, 'fruum:resize', this.onResize);
        this.listenTo(Fruum.io, 'fruum:update_notify', this.onUpdateNotify);
        this.onAttach = this.onDomRefresh = this.onInteracting;
        this.mode = this._getMode();
        this.autocomplete_view = new Fruum.views.AutocompleteView({
          interactions: this
        });
      },
      getTemplate: function() {
        if (Fruum.user.anonymous) return '#fruum-template-interactions-anonymous';
        if (this.ui_state.get('searching')) return '#fruum-template-interactions-searching';
        switch(this.ui_state.get('editing').type) {
          case 'category':
            return '#fruum-template-interactions-edit-category';
          case 'article':
            return '#fruum-template-interactions-edit-article';
          case 'thread':
            return '#fruum-template-interactions-edit-thread';
          case 'channel':
            return '#fruum-template-interactions-edit-channel';
          case 'post':
            return '#fruum-template-interactions-edit-post';
        }
        switch(this.ui_state.get('viewing').type) {
          case 'thread':
          case 'article':
            return '#fruum-template-interactions-view-thread';
          case 'channel':
            return '#fruum-template-interactions-view-channel';
        }
        if (Fruum.user.admin) return '#fruum-template-interactions-admin';
        return '#fruum-template-interactions-user';
      },
      onInteracting: function() {
        if (this.ui_state.get('interacting') || !this.ui_state.get('connected')) {
          this.$('input, textarea').attr('disabled', 'disabled');
          this.$el.parent().addClass('fruum-interaction-unavailable');
        }
        else {
          this.$('input, textarea').removeAttr('disabled');
          this.$el.parent().removeClass('fruum-interaction-unavailable');
        }
      },
      onRender: function() {
      },
      onHelp: function() {
        if (this.ui.help_panel.is(':visible'))
          this.ui.help_panel.slideUp('show', 'easeInOutBack');
        else
          this.ui.help_panel.slideDown('show', 'easeInOutBack');
      },
      onChannelKey: function(event) {
        switch(event.which) {
          case 13: //Enter
            if (!event._autocomplete_consumed)
              this.onPost(event);
            break;
          case 27: //Escape
            if (!event._autocomplete_consumed)
              this.ui.channel_input.val('').blur();
            break;
        }
      },
      onResize: function() {
        switch(this.ui_state.get('editing').type) {
          case 'thread':
          case 'article':
            this.ui.field_body.height(
              this.ui_state.get('panel_height') -
              (this.$el.parent().outerHeight() - this.ui.field_body.height()) -
              this.ui_state.get('navigation_height') + 1
            );
            break;
        }
      },
      onUpdateNotify: function() {
        var notifications = Fruum.userUtils.countNotifications();
        if (notifications > 0) {
          this.ui.field_notifications.html(notifications).fadeIn();
          this.ui.avatar_container.removeClass('fruum-link-disabled').
            attr('data-fruumtipsy-right', this.ui.avatar_container.attr('data-fruumtipsy-original'));
        }
        else {
          this.ui.field_notifications.html(notifications).fadeOut();
          this.ui.avatar_container.addClass('fruum-link-disabled').removeAttr('data-fruumtipsy-right');
        }
      },
      _getEasing: function() {
        switch(this.ui_state.get('editing').type) {
          case 'thread':
          case 'article':
            return 'easeOutSine';
        }
        return 'easeInOutBack'
      },
      _getMode: function() {
        if (Fruum.user.anonymous) return 'anonymous';
        return this.ui_state.get('viewing').type + ':' +
               this.ui_state.get('editing').type + ':' +
               this.ui_state.get('searching');
      },
      onChange: function() {
        var new_mode = this._getMode();
        if (new_mode === this.mode) {
          this.render();
          if (this.ui_state.get('viewing').type === 'channel') {
            this.ui.channel_input.focus();
          }
          Fruum.io.trigger('fruum:resize');
          return;
        }
        this.mode = new_mode;

        var that = this;
        var el = this.$el.parent();
        Fruum.io.trigger('fruum:resize_to_bottom');
        el.stop(true,true).animate({
          bottom: (-el.outerHeight()) + 'px'
        }, 100, function() {
          that.render();
          if (that.$('.fruum-js-interacting').length) {
            el.addClass('fruum-interacting');
          }
          else {
            el.removeClass('fruum-interacting');
          }
          that.onResize();
          el.css('bottom', (-el.outerHeight()) + 'px').
            stop(true,true).
            animate({
              bottom: '0px'
            }, 'fast', that._getEasing(), function() {
              Fruum.io.trigger('fruum:resize');
              if (that.ui_state.get('viewing').type === 'channel') {
                that.ui.channel_input.focus();
                Fruum.io.trigger('fruum:scroll_bottom');
              }
              else switch(that.ui_state.get('editing').type) {
                case 'thread':
                case 'article':
                case 'channel':
                case 'category':
                  that.ui.field_header.focus().select();
                  break;
                case 'post':
                  that.ui.field_body.focus();
                  break;
              }
            });
        });
      },
      onHeaderBlur: function(event) {
        if (this.ui.field_initials.length && !this.ui.field_initials.val()) {
          this.ui.field_initials.val(
            (this.ui.field_header.val() || '').substr(0, 3)
          );
          this.onInitialsKeydown(event);
        }
      },
      onBodyBlur: function(event) {
        this.autocomplete_view.hide();
      },
      onInitialFocus: function() {
        this.ui.field_initials.select();
      },
      onInitialsKeydown: function(event) {
        this.ui.field_initials.parent().attr('data-initials', Fruum.utils.printInitials(this.ui.field_initials.val()));
      },
      onBodyKeydown: function(event) {
        if (event.metaKey || event.ctrlKey) {
          var selection = null;
          switch(event.which) {
            case 13: //enter
              if (this.ui_state.get('editing').type == 'post') {
                this.onPost(event);
              }
              break;
            case 66: //b
            case 73: //i
              selection = (this.ui.field_body.getSelection() || {}).text;
              break;
          }
          if (selection) {
            switch(event.which) {
              case 66: //b
                this.ui.field_body.replaceSelection('**' + selection + '**');
                break;
              case 73: //i
                this.ui.field_body.replaceSelection('*' + selection + '*');
                break;
            }
            event.preventDefault();
          }
        }
        this.autocomplete_view.onKey(event);
      },
      onCancel: function() {
        this.ui_state.set('editing', {});
      },
      onAddCategory: function(event) {
        event.preventDefault();
        this.ui_state.set('editing', {
          type: 'category',
          parent: this.ui_state.get('viewing').id
        });
        this.ui.field_header.focus();
      },
      onAddArticle: function(event) {
        event.preventDefault();
        this.ui_state.set('editing', {
          type: 'article',
          parent: this.ui_state.get('viewing').id
        });
        this.ui.field_header.focus();
      },
      onAddThread: function(event) {
        event.preventDefault();
        this.ui_state.set('editing', {
          type: 'thread',
          parent: this.ui_state.get('viewing').id
        });
        this.ui.field_header.focus();
      },
      onAddChannel: function(event) {
        event.preventDefault();
        this.ui_state.set('editing', {
          type: 'channel',
          parent: this.ui_state.get('viewing').id
        });
        this.ui.field_header.focus();
      },
      onAddPost: function(event) {
        event.preventDefault();
        this.ui_state.set('editing', {
          type: 'post',
          parent: this.ui_state.get('viewing').id
        });
        this.ui.field_body.focus();
      },
      onPost: function(event) {
        event.preventDefault();
        var id = this.ui_state.get('editing').id || '';
        var order = 0;
        switch(this.ui.field_type.val()) {
          case 'category':
            order = this.collections.categories.length + 1;
            //set default if they do not exist
            if (this.ui.field_initials.length && !this.ui.field_initials.val()) {
              this.ui.field_initials.val((this.ui.field_header.val() || '').substr(0, 3));
            }
            break;
          case 'article':
            order = this.collections.articles.length + 1;
            break;
        }
        if (this.ui_state.get('editing').id) {
          id = this.ui_state.get('editing').id;
          order = this.ui_state.get('editing').order || order;
        }
        Fruum.io.trigger(id?'fruum:update':'fruum:add', {
          id: id,
          parent: this.ui.field_parent.val() || '',
          initials: this.ui.field_initials.val() || '',
          header: this.ui.field_header.val() || '',
          body: this.ui.field_body.val() || '',
          type: this.ui.field_type.val() || '',
          is_blog: this.ui.field_is_blog.is(':checked'),
          order: order
        });
      },
      onShowNotifications: function(event) {
        event && event.preventDefault();
        if (Fruum.userUtils.countNotifications()) {
          Fruum.io.trigger('fruum:notifications', { ids: Fruum.user.notifications });
        }
      },

      onKeyBody: function() {
        var editing = this.ui_state.get('editing');
        editing.body = this.ui.field_body.val() || '';
      },
      onKeyHeader: function() {
        var editing = this.ui_state.get('editing');
        editing.header = this.ui.field_header.val() || '';
      },
      onKeyInitials: function() {
        var editing = this.ui_state.get('editing');
        editing.initials = this.ui.field_initials.val() || '';
      },
      onKeyIsBlog: function() {
        var editing = this.ui_state.get('editing');
        editing.is_blog = this.ui.field_is_blog.is(':checked');
      }
    });
  });
})();
