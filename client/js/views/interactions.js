/******************************************************************************
Handles the bottom input part
*******************************************************************************/

(function() {
  'use strict';
  window.Fruum.require.push(function () {
    Fruum.views = Fruum.views || {};

    var $ = Fruum.libs.$,
        _ = Fruum.libs._,
        Backbone = Fruum.libs.Backbone,
        Marionette = Fruum.libs.Marionette;

    Fruum.views.InteractionsView = Marionette.ItemView.extend({
      ui: {
        post: '[data-action="post"]',
        add_category: '[data-action="add_category"]',
        add_article: '[data-action="add_article"]',
        add_blog: '[data-action="add_blog"]',
        add_thread: '[data-action="add_thread"]',
        add_channel: '[data-action="add_channel"]',
        add_post: '[data-action="add_post"]',
        add_search: '[data-action="add_search"]',
        cancel: '[data-action="cancel"]',
        preview: '[data-action="preview"]',
        help: '[data-action="help"]',
        emoji_panel: '[data-action="emojipanel"]',
        attachments: '[data-action="attachments"]',
        help_panel: '.fruum-js-help',
        show_notifications: '.fruum-js-show-notifications',
        avatar_container: '.fruum-js-avatar-container',
        preview_panel: '.fruum-js-preview',
        field_parent: '[data-field="parent"]',
        field_type: '[data-field="type"]',
        field_initials: '[data-field="initials"]',
        field_header: '[data-field="header"]',
        field_body: '[data-field="body"]',
        field_tags: '[data-field="tags"]',
        field_notifications: '[data-field="notifications"]',
        field_usage: '[data-field="usage"]',
        field_permission: '[data-field="permission"]',
        option_usage: '[data-usage]',
        option_permission: '[data-permission]',
        channel_input: '.fruum-js-channel-input',
        popup_usage: '.fruum-js-choose-usage',
        popup_permission: '.fruum-js-choose-permission'
      },
      modelEvents: {
        'change:editing change:viewing change:searching change:has_search_string': 'onChange',
        'change:interacting change:connected': 'onInteracting'
      },
      events: {
        'click @ui.field_usage': 'onClickUsage',
        'click @ui.field_permission': 'onClickPermission',
        'click @ui.option_usage': 'onSelectUsage',
        'click @ui.option_permission': 'onSelectPermission',
        'focus @ui.field_initials': 'onInitialFocus',
        'keydown @ui.field_initials': 'onInitialsKeydown',
        'keydown @ui.field_body': 'onBodyKeydown',
        'keydown @ui.channel_input': 'onChannelKey',
        'blur @ui.field_header': 'onHeaderBlur',
        'click @ui.help': 'onHelp',
        'click @ui.emoji_panel': 'onEmojiPanel',
        'click @ui.attachments': 'onAttachments',
        'click @ui.post': 'onPost',
        'click @ui.add_thread': 'onAddThread',
        'click @ui.add_article': 'onAddArticle',
        'click @ui.add_blog': 'onAddBlog',
        'click @ui.add_channel': 'onAddChannel',
        'click @ui.add_category': 'onAddCategory',
        'click @ui.add_post': 'onAddPost',
        'click @ui.add_search': 'onAddSearch',
        'click @ui.cancel': 'onCancel',
        'click @ui.preview': 'onPreview',
        'click @ui.show_notifications': 'onShowNotifications',
        //capture changes and store them
        'blur @ui.field_body': 'onBodyBlur',
        'keyup @ui.field_body': 'onKeyBody',
        'keyup @ui.field_header': 'onKeyHeader',
        'keyup @ui.field_initials': 'onKeyInitials',
        'keyup @ui.field_tags': 'onKeyTags'
      },
      initialize: function(options) {
        _.bindAll(this, 'typeNotificationStart', 'typeNotificationEnd');
        this.ui_state = this.model;
        this.collections = options.collections;
        this.listenTo(Fruum.io, 'fruum:resize', this.onResize);
        this.listenTo(Fruum.io, 'fruum:update_notify', this.onUpdateNotify);
        this.onAttach = this.onDomRefresh = this.onInteracting;
        this.mode = this._getMode();
        this.autocomplete_view = new Fruum.views.AutocompleteView({
          ui_state: this.ui_state,
          interactions: this
        });
        this.emojipanel_view = new Fruum.views.EmojiPanelView({
          ui_state: this.ui_state,
          interactions: this
        });
        this.attachments_view = new Fruum.views.AttachmentsView({
          ui_state: this.ui_state,
          interactions: this
        });
      },
      getTemplate: function() {
        if (Fruum.user.anonymous) return '#fruum-template-interactions-anonymous';
        var editing = this.ui_state.get('editing'),
            viewing = this.ui_state.get('viewing');
        if (this.ui_state.get('searching')) {
          return '#fruum-template-interactions-searching';
        }
        switch(editing.type) {
          case 'category':
            return '#fruum-template-interactions-edit-category';
          case 'article':
            return '#fruum-template-interactions-edit-article';
          case 'blog':
            return '#fruum-template-interactions-edit-blog';
          case 'thread':
            return '#fruum-template-interactions-edit-thread';
          case 'channel':
            return '#fruum-template-interactions-edit-channel';
          case 'post':
            return '#fruum-template-interactions-edit-post';
        }
        switch(viewing.type) {
          case 'thread':
          case 'article':
          case 'blog':
            return '#fruum-template-interactions-view-thread';
          case 'channel':
            return '#fruum-template-interactions-view-channel';
          case 'bookmark':
            return '#fruum-template-interactions-view-bookmark';
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
        Fruum.io.trigger('fruum:hide_bookmark');
        this.emojipanel_view.hide();
        this.attachments_view.hide();
      },
      onEmojiPanel: function() {
        this.attachments_view.hide();
        this.emojipanel_view.toggle();
      },
      onAttachments: function() {
        this.emojipanel_view.hide();
        this.attachments_view.toggle();
      },
      onHelp: function() {
        this.emojipanel_view.hide();
        this.attachments_view.hide();
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
          case 'blog':
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
          case 'blog':
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
      onPreview: function() {
        this.emojipanel_view.hide();
        this.attachments_view.hide();
        this.ui.preview.toggleClass('fruum-is-active');
        this.renderPreview();
      },
      renderPreview: function() {
        if (this.ui.preview.hasClass('fruum-is-active')) {
          var h = this.ui.field_body.height();
          this.ui.field_body.hide();
          this.ui.preview_panel.css('display','inline-block').height(h).html(
            Fruum.utils.print(this.ui.field_body.val(), this.ui_state.get('editing').attachments)
          );
        }
        else {
          this.ui.preview_panel.hide();
          this.ui.field_body.show();
        }
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
                case 'blog':
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
      typeNotificationStart: function() {
        if (!this.type_notification_timer) {
          Fruum.io.trigger('fruum:typing');
          this.type_notification_timer = setTimeout(this.typeNotificationEnd, 1500);
        }
      },
      typeNotificationEnd: function() {
        this.type_notification_timer = null;
      },
      onBodyKeydown: function(event) {
        //send type notification
        this.typeNotificationStart();
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
              event.preventDefault();
              break;
          }
          switch(event.which) {
            case 66: //b
              if (selection) this.ui.field_body.replaceSelection('**' + selection + '**');
              else this.ui.field_body.val(this.ui.field_body.val() + ' **bold**');
              break;
            case 73: //i
              if (selection) this.ui.field_body.replaceSelection('*' + selection + '*');
              else this.ui.field_body.val(this.ui.field_body.val() + ' *italics*');
              break;
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
      onAddBlog: function(event) {
        event.preventDefault();
        this.ui_state.set('editing', {
          type: 'blog',
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
      onAddSearch: function(event) {
        event.preventDefault();
        Fruum.io.trigger('fruum:show_bookmark', {
          body: this.ui_state.get('search')
        });
      },
      onPost: function(event) {
        event.preventDefault();
        var editing = this.ui_state.get('editing'),
            id = editing.id || '',
            order = 0;
        switch(this.ui.field_type.val()) {
          case 'category':
            order = this.collections.categories.length + 1;
            //set default if they do not exist
            if (this.ui.field_initials.length && !this.ui.field_initials.val()) {
              this.ui.field_initials.val((this.ui.field_header.val() || '').substr(0, 3));
            }
            break;
          case 'article':
          case 'blog':
            order = this.collections.articles.length + 1;
            break;
        }
        if (editing.id) {
          id = editing.id;
          order = editing.order || order;
        }
        //prepare tags
        var tags = _.uniq(_.compact(
          (this.ui.field_tags.val() || '').
            replace(/ /g, ',').
            replace(/#/g, '').
            toLowerCase().
            split(',')
        ));
        var body = this.ui.field_body.val() || '';
        Fruum.io.trigger(id?'fruum:update':'fruum:add', {
          id: id,
          parent: this.ui.field_parent.val() || '',
          initials: this.ui.field_initials.val() || '',
          header: this.ui.field_header.val() || '',
          body: body,
          type: this.ui.field_type.val() || '',
          attachments: this.cleanAttachments(body, editing.attachments || []),
          tags: tags,
          usage: this.ui.field_usage.data('value')|0,
          permission: this.ui.field_permission.data('value')|0,
          order: order
        });
      },
      //remove unused attachments
      cleanAttachments: function(body, attachments) {
        for (var i = attachments.length - 1; i >= 0; --i) {
          var attachment = attachments[i];
          if (!Fruum.utils.usesAttachment(body, attachment)) {
            attachments.splice(i, 1);
          }
        }
        return attachments;
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
      onKeyTags: function(event) {
        //check for trailing space
        if (event.which == 32) {
          var tags = this.ui.field_tags.val() || '';
          if (tags.charAt(tags.length - 1) == ' ' && tags.charAt(tags.length - 2) != ',') {
            tags = (tags.trim() + ', ').replace(/,{2,}/g, ',').replace(/, ,/g, ', ');
            this.ui.field_tags.val(tags);
          }
        }
      },

      onClickUsage: function(event) {
        event && event.preventDefault();
        this.ui.popup_usage.toggleClass('fruum-nodisplay');
      },
      onClickPermission: function(event) {
        event && event.preventDefault();
        this.ui.popup_permission.toggleClass('fruum-nodisplay');
      },
      onSelectUsage: function(event) {
        event && event.preventDefault();
        var usage = $(event.target).closest('[data-usage]').data('usage')|0;
        this.ui.field_usage.data('value', usage).html(Fruum.usage[usage]);
        this.ui.popup_usage.addClass('fruum-nodisplay');
      },
      onSelectPermission: function(event) {
        event && event.preventDefault();
        var permission = $(event.target).closest('[data-permission]').data('permission')|0;
        this.ui.field_permission.data('value', permission).html(Fruum.permission[permission]);
        this.ui.popup_permission.addClass('fruum-nodisplay');
      }
    });
  });
})();
