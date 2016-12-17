/******************************************************************************
Handles the bottom input part
*******************************************************************************/

/* globals Fruum */

(function() {
  'use strict';
  window.Fruum.require.push(function() {
    Fruum.views = Fruum.views || {};

    var $ = Fruum.libs.$,
        _ = Fruum.libs._,
        toMarkdown = Fruum.libs.toMarkdown,
        Marionette = Fruum.libs.Marionette;

    Fruum.views.InteractionsView = Marionette.ItemView.extend({
      ui: {
        search: '.fruum-js-search-category',
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
        help_tab: '[data-help-tab]',
        karma_notify: '.fruum-js-karma-notify',
        show_profile: '.fruum-js-show-profile',
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
        popup_permission: '.fruum-js-choose-permission',
      },
      modelEvents: {
        'change:editing change:viewing change:searching change:has_search_string': 'onChange',
        'change:interacting change:connected': 'onInteracting',
        'change:search_helper': 'onSearchHelper',
        'change:updates_count': 'onUpdatesCount',
      },
      events: {
        'click @ui.search': 'onSearch',
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
        'click @ui.help_tab': 'onHelpTab',
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
        'click @ui.show_profile': 'onShowProfile',
        // capture changes and store them
        'blur @ui.field_body': 'onBodyBlur',
        'keyup @ui.field_body': 'onKeyBody',
        'keyup @ui.field_header': 'onKeyHeader',
        'keyup @ui.field_initials': 'onKeyInitials',
        'keyup @ui.field_tags': 'onKeyTags',
        'paste @ui.field_body': 'onPasteBody',
      },
      initialize: function(options) {
        _.bindAll(this,
          'typeNotificationStart', 'typeNotificationEnd',
          '_clearSearch', '_updatesCount', '_onboard'
        );
        // helper to mark how many posts the user has submitted for onboarding
        this.post_count = 0;
        this.new_karma = 0;
        this.ui_state = this.model;
        this.collections = options.collections;
        this.listenTo(Fruum.io, 'fruum:resize', this.onResize);
        this.listenTo(Fruum.io, 'fruum:update_notify', this.onUpdateNotify);
        this.listenTo(Fruum.io, 'fruum:message', this.onMessage);
        this.listenTo(Fruum.io, 'fruum:new_karma', this.onNewKarma);
        this.listenTo(Fruum.io, 'fruum:default_action', function() {
          var el = this.$('.fruum-js-default-action');
          if (el.length) {
            el.addClass('fruum-button-active');
            setTimeout(function() {
              el.trigger('click');
            }, 100);
          }
        });
        this.onAttach = this.onDomRefresh = this.onInteracting;
        this.mode = this._getMode();
        this.autocomplete_view = new Fruum.views.AutocompleteView({
          ui_state: this.ui_state,
          interactions: this,
        });
        this.emojipanel_view = new Fruum.views.EmojiPanelView({
          ui_state: this.ui_state,
          interactions: this,
        });
        this.attachments_view = new Fruum.views.AttachmentsView({
          ui_state: this.ui_state,
          interactions: this,
        });
        this.help_tab = Fruum.utils.isDesktop() ? 'shortcuts' : 'text';
      },
      getTemplate: function() {
        if (Fruum.user.anonymous) return '#fruum-template-interactions-anonymous';
        var editing = this.ui_state.get('editing'),
            viewing = this.ui_state.get('viewing');
        if (this.ui_state.get('searching')) {
          return '#fruum-template-interactions-searching';
        }
        switch (editing.type) {
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
        switch (viewing.type) {
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

      // --------------------------- NOTIFICATIONS -----------------------------

      onUpdatesCount: function() {
        var count = this.ui_state.get('updates_count');
        if (!count) {
          if (this.__update_drawer_timer) {
            clearTimeout(this.__update_drawer_timer);
          }
          this._updatesCount();
        } else {
          if (!this.__update_drawer_timer) {
            this.__update_drawer_timer = setTimeout(this._updatesCount, 1500);
          }
        }
      },
      _updatesCount: function() {
        this.__update_drawer_timer = null;
        var count = this.ui_state.get('updates_count');
        if (!count) {
          this.$('.fruum-js-updates-drawer').stop(true, true).slideUp('fast');
        } else {
          this.$('.fruum-js-updates-number').html(count);
          this.$('.fruum-js-updates-drawer').stop(true, true).slideDown('fast');
        }
      },
      onUpdateNotify: function() {
        var notifications = Fruum.userUtils.countNotifications();
        if (notifications > 0) {
          this.ui.field_notifications.html(notifications).fadeIn();
          this.ui.avatar_container.removeClass('fruum-link-disabled').
            attr('data-fruumtipsy-right', this.ui.avatar_container.attr('data-fruumtipsy-original'));
        } else {
          this.ui.field_notifications.html(notifications).fadeOut();
          this.ui.avatar_container.addClass('fruum-link-disabled').removeAttr('data-fruumtipsy-right');
        }
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
      onShowProfile: function(event) {
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }
        Fruum.io.trigger('fruum:profile', {
          username: Fruum.user.username,
          id: Fruum.user.id,
        });
      },
      onNewKarma: function(diff) {
        this.new_karma += diff;
        this.consumeKarma();
      },
      consumeKarma: function() {
        var el = this.$(this.ui.karma_notify);
        if (this.new_karma && el.length) {
          el.find('.fruum-js-karma-diff').html(
            (this.new_karma > 0 ? '+' : '-') + this.new_karma
          );
          el.delay(500).fadeIn('fast').delay(4000).fadeOut('slow');
          this.new_karma = 0;
        }
      },

      // ----------------------------- SEARCH ----------------------------------

      onSearch: function(event) {
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }
        Fruum.io.trigger(
          'fruum:set_search',
          'parent:' + this.ui_state.get('viewing').id + ' '
        );
      },
      onSearchHelper: function() {
        if (this.ui_state.get('search_helper') && !this.ui_state.get('editing').type) {
          Fruum.io.trigger('fruum:message', 'search');
        } else {
          if (this.timer_clearsearch) clearTimeout(this.timer_clearsearch);
          this.timer_clearsearch = setTimeout(this._clearSearch, 700);
        }
      },
      _clearSearch: function() {
        this.timer_clearsearch = null;
        Fruum.io.trigger('fruum:message');
      },

      // ----------------------------- MESSAGES --------------------------------

      onMessage: function(msg_type) {
        if (msg_type) {
          this.$('[data-message="' + msg_type + '"]').slideDown();
        } else {
          this.$('[data-message]').slideUp('fast');
        }
      },

      // -------------------------- INTERACTION --------------------------------

      onInteracting: function() {
        var el = this.$el.parent();
        if (this.ui_state.get('interacting') || !this.ui_state.get('connected')) {
          this.$('input, textarea').attr('disabled', 'disabled');
          el.addClass('fruum-interaction-unavailable').
            removeClass('fruum-interacting');
        } else {
          this.$('input, textarea').removeAttr('disabled');
          el.removeClass('fruum-interaction-unavailable');
          if (this.$('.fruum-js-interacting').length) {
            el.addClass('fruum-interacting');
          }
        }
      },
      onRender: function() {
        Fruum.io.trigger('fruum:set_onboard');
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
        Fruum.io.trigger('fruum:unset_onboard', 'attachments');
      },
      onHelp: function() {
        this.emojipanel_view.hide();
        this.attachments_view.hide();
        if (this.ui.help_panel.is(':visible')) {
          this.ui.help_panel.slideUp('show', 'easeInOutBack');
        } else {
          this._selectHelpTab(this.help_tab);
          this.ui.help_panel.slideDown('show', 'easeInOutBack');
        }
        Fruum.io.trigger('fruum:unset_onboard', 'help');
      },
      onHelpTab: function(event) {
        event.preventDefault();
        event.stopPropagation();
        var tab = $(event.target).closest('[data-help-tab]').data('help-tab');
        if (!tab) return;
        this.help_tab = tab;
        this._selectHelpTab(this.help_tab);
      },
      _selectHelpTab: function(tab) {
        this.$('[data-help-tab]').removeClass('fruum-active');
        this.$('[data-help-tab="' + tab + '"]').addClass('fruum-active');
        this.$('[data-help-content]').addClass('fruum-nodisplay');
        this.$('[data-help-content="' + tab + '"]').removeClass('fruum-nodisplay');
      },

      onResize: function() {
        switch (this.ui_state.get('editing').type) {
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
      onChange: function() {
        var new_mode = this._getMode();
        if (new_mode === this.mode) {
          this.render();
          if (this.ui_state.get('viewing').type === 'channel') {
            this.ui.channel_input.focus();
          }
          Fruum.io.trigger('fruum:resize');
          this.startOnboard();
          return;
        }
        this.mode = new_mode;

        var that = this;
        var el = this.$el.parent();
        Fruum.io.trigger('fruum:resize_to_bottom');
        el.stop(true, true).animate({
          bottom: (-el.outerHeight()) + 'px',
        }, 100, function() {
          that.render();
          if (that.$('.fruum-js-interacting').length) {
            el.addClass('fruum-interacting');
          } else {
            el.removeClass('fruum-interacting');
          }
          that.onResize();
          el.css('bottom', (-el.outerHeight()) + 'px').
            stop(true, true).
            animate({
              bottom: '0px',
            }, 'fast', that._getEasing(), function() {
              Fruum.io.trigger('fruum:resize');
              if (that.ui_state.get('viewing').type === 'channel') {
                that.ui.channel_input.focus();
                Fruum.io.trigger('fruum:scroll_bottom');
              } else {
                switch (that.ui_state.get('editing').type) {
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
              }
              that.startOnboard();
              that.consumeKarma();
            });
        });
      },
      _getEasing: function() {
        switch (this.ui_state.get('editing').type) {
          case 'thread':
          case 'article':
          case 'blog':
            return 'easeOutSine';
        }
        return 'easeInOutBack';
      },
      _getMode: function() {
        if (Fruum.user.anonymous) return 'anonymous';
        return this.ui_state.get('viewing').type + ':' +
               this.ui_state.get('editing').type + ':' +
               this.ui_state.get('searching');
      },

      // ------------------------------ PREVIEW --------------------------------

      onPreview: function() {
        this.emojipanel_view.hide();
        this.attachments_view.hide();
        this.ui.preview.toggleClass('fruum-is-active');
        this.renderPreview();
        Fruum.io.trigger('fruum:unset_onboard', 'preview');
      },
      renderPreview: function() {
        if (this.ui.preview.hasClass('fruum-is-active')) {
          var h = this.ui.field_body.height();
          this.ui.field_body.hide();
          this.ui.preview_panel.css('display', 'inline-block').height(h).html(
            Fruum.utils.xssProtect(
              Fruum.utils.print(
                this.ui.field_body.val(),
                this.ui_state.get('editing').attachments
              )
            )
          );
        } else {
          this.ui.preview_panel.hide();
          this.ui.field_body.show();
        }
      },

      // ------------------------------ ONBOARD --------------------------------

      startOnboard: function() {
        if (this.onboard_timer) clearTimeout(this.onboard_timer);
        this.onboard_timer = setTimeout(this._onboard, 100);
      },
      _onboard: function() {
        this.onboard_timer = null;
        if (!this.ui_state.get('editing').type) {
          Fruum.io.trigger('fruum:set_onboard', 'add_stream');
          Fruum.io.trigger('fruum:set_onboard', 'add_category');
          Fruum.io.trigger('fruum:set_onboard', 'manage');
          Fruum.io.trigger('fruum:set_onboard', 'edit');
          Fruum.io.trigger('fruum:set_onboard', 'watch');
          Fruum.io.trigger('fruum:set_onboard', 'breadcrumb');
        }
      },

      // ------------------------------- EDIT ----------------------------------

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
      onChannelKey: function(event) {
        switch (event.which) {
          case 13: // Enter
            if (!event._autocomplete_consumed) {
              this.onPost(event);
            }
            break;
          case 27: // Escape
            if (!event._autocomplete_consumed) {
              this.ui.channel_input.val('').blur();
            }
            break;
        }
      },
      onBodyKeydown: function(event) {
        // send type notification
        this.typeNotificationStart();
        if (event.metaKey || event.ctrlKey) {
          var selection = null;
          switch (event.which) {
            case 13: // enter
              if (this.ui_state.get('editing').type == 'post') {
                var that = this;
                this.ui.post.addClass('fruum-button-active');
                setTimeout(function() {
                  that.onPost(event);
                  that.ui.post.removeClass('fruum-button-active');
                }, 100);
              }
              break;
            case 66: // b
            case 73: // i
              selection = (this.ui.field_body.getSelection() || {}).text;
              event.preventDefault();
              break;
          }
          switch (event.which) {
            case 66: // b
              if (selection) this.ui.field_body.replaceSelection('**' + selection + '**');
              else this.ui.field_body.val(this.ui.field_body.val() + ' **bold**');
              break;
            case 73: // i
              if (selection) this.ui.field_body.replaceSelection('*' + selection + '*');
              else this.ui.field_body.val(this.ui.field_body.val() + ' *italics*');
              break;
          }
        } else if (event.which == 13) {
          // onboard
          if (this.post_count % 2) {
            Fruum.io.trigger('fruum:set_onboard', 'help');
          } else {
            Fruum.io.trigger('fruum:set_onboard', 'preview');
            Fruum.io.trigger('fruum:set_onboard', 'attachments');
          }
          // smart markdown
          this.onSmartText(event);
        }
        this.autocomplete_view.onKey(event);
      },
      onSmartText: function(event) {
        // smart markdown, get last line
        var curretPos = this.ui.field_body.prop('selectionStart');
        if (curretPos) {
          // get last line
          var text = this.ui.field_body.val() || '',
              line_start = text.lastIndexOf('\n', curretPos - 1);

          if (line_start < curretPos) {
            var line = text.substr(line_start + 1, curretPos - line_start - 1) || '',
                tabs = line.search(/\S/) || 0,
                smart_text;

            line = $.trim(line);
            // check for list or empty list
            if (line == '*' || line == '+' || line == '-') {
              // remove line
              this.ui.field_body.val(
                Fruum.utils.truncateString(text, line_start + 1, curretPos, '\n')
              );
              Fruum.utils.setCaretPosition(this.ui.field_body, line_start + 2);
              event.preventDefault();
            } else if (line.indexOf('* ') == 0) {
              smart_text = Fruum.utils.padFactory(' ', tabs) + '* ';
            } else if (line.indexOf('+ ') == 0) {
              smart_text = Fruum.utils.padFactory(' ', tabs) + '+ ';
            } else if (line.indexOf('- ') == 0) {
              smart_text = Fruum.utils.padFactory(' ', tabs) + '- ';
            } else {
              // numbered list
              var match = line.match(/(^\d+)\. /);
              if (match && match[1] | 0) {
                match = (match[1] | 0) + 1;
                smart_text = Fruum.utils.padFactory(' ', tabs) + match + '. ';
              }
            }
            // inject smart text
            if (smart_text) {
              this.ui.field_body.val(Fruum.utils.injectString(text, '\n' + smart_text, curretPos));
              Fruum.utils.setCaretPosition(this.ui.field_body, curretPos + smart_text.length + 1);
              event.preventDefault();
            }
          }
        }
      },
      onKeyBody: function(event) {
        var editing = this.ui_state.get('editing');
        editing.body = this.ui.field_body.val() || '';
        this.onKeyAny(event);
      },
      onKeyHeader: function(event) {
        var editing = this.ui_state.get('editing');
        editing.header = this.ui.field_header.val() || '';
        this.onKeyAny(event);
      },
      onKeyInitials: function(event) {
        var editing = this.ui_state.get('editing');
        editing.initials = this.ui.field_initials.val() || '';
      },
      onKeyTags: function(event) {
        // check for trailing space
        if (event.which == 32) {
          var tags = this.ui.field_tags.val() || '';
          if (tags.charAt(tags.length - 1) == ' ' && tags.charAt(tags.length - 2) != ',') {
            tags = (tags.trim() + ', ').replace(/,{2,}/g, ',').replace(/, ,/g, ', ');
            this.ui.field_tags.val(tags);
          }
        }
      },
      onKeyAny: function(event) {
        if (event && event.which == 27) {
          // check if all fields are empty
          if (!this.ui.field_header.val() && !this.ui.field_body.val()) {
            this.onCancel();
          }
        }
      },
      onPasteBody: function(event) {
        var clp = (event.originalEvent || event).clipboardData;
        if (clp && clp.getData) {
          var text = clp.getData('text/html') || '';
          if (text) {
            try {
              text = toMarkdown(text, { converters: [
                {
                  filter: ['html', 'body', 'span', 'div'],
                  replacement: function(innerHTML) {
                    return innerHTML;
                  },
                },
                {
                  filter: ['head', 'script', 'style', 'input', 'form'],
                  replacement: function() { return ''; },
                }
              ]});
              event.preventDefault();
              this.ui.field_body.replaceSelection(text);
            } catch (err) {}
            return;
          }
          // try text plain
          text = clp.getData('text/plain') || clp.getData('Text');
          if (text) {
            // find links
            if (Fruum.utils.startsWith(text, 'https://') ||
                Fruum.utils.startsWith(text, 'http://')
            ) {
              // check for image
              if (_.some(['.png', '.jpg', '.jpeg', '.gif'], function(ext) {
                return Fruum.utils.endsWith(text, ext);
              })) {
                text = '![image](' + text + ')';
              } else {
                text = '[link](' + text + ')';
              }
              event.preventDefault();
              this.ui.field_body.replaceSelection(text);
              // select field
              var curretPos = this.ui.field_body.prop('selectionStart'),
                  el = this.ui.field_body.get(0);
              if (curretPos && el && el.setSelectionRange) {
                var value = this.ui.field_body.val() || '';
                el.setSelectionRange(
                  value.lastIndexOf('[', curretPos) + 1,
                  value.lastIndexOf(']', curretPos)
                );
              }
            }
          }
        }
      },

      // -------------------------------- BUTTONS ------------------------------

      onCancel: function() {
        this.ui_state.set('editing', {});
      },
      onAddCategory: function(event) {
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }
        Fruum.io.trigger('fruum:unset_onboard', 'add_category');
        this.ui_state.set('editing', {
          type: 'category',
          parent: this.ui_state.get('viewing').id,
          permission: this.ui_state.get('viewing').permission,
        });
        this.ui.field_header.focus();
      },
      onAddArticle: function(event) {
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }
        Fruum.io.trigger('fruum:unset_onboard', 'add_stream');
        this.ui_state.set('editing', {
          type: 'article',
          parent: this.ui_state.get('viewing').id,
        });
        this.ui.field_header.focus();
      },
      onAddBlog: function(event) {
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }
        Fruum.io.trigger('fruum:unset_onboard', 'add_stream');
        this.ui_state.set('editing', {
          type: 'blog',
          parent: this.ui_state.get('viewing').id,
        });
        this.ui.field_header.focus();
      },
      onAddThread: function(event) {
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }
        Fruum.io.trigger('fruum:unset_onboard', 'add_stream');
        this.ui_state.set('editing', {
          type: 'thread',
          parent: this.ui_state.get('viewing').id,
        });
        this.ui.field_header.focus();
      },
      onAddChannel: function(event) {
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }
        Fruum.io.trigger('fruum:unset_onboard', 'add_stream');
        this.ui_state.set('editing', {
          type: 'channel',
          parent: this.ui_state.get('viewing').id,
        });
        this.ui.field_header.focus();
      },
      onAddPost: function(event) {
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }
        Fruum.io.trigger('fruum:unset_onboard', 'add_stream');
        this.ui_state.set('editing', {
          type: 'post',
          parent: this.ui_state.get('viewing').id,
        });
        this.ui.field_body.focus();
      },
      onAddSearch: function(event) {
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }
        Fruum.io.trigger('fruum:show_bookmark', {
          body: this.ui_state.get('search'),
        });
      },
      onPost: function(event) {
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }
        var editing = this.ui_state.get('editing'),
            id = editing.id || '',
            order = 0;
        switch (this.ui.field_type.val()) {
          case 'category':
            order = this.collections.categories.length + 1;
            // set default if they do not exist
            if (this.ui.field_initials.length && !this.ui.field_initials.val()) {
              this.ui.field_initials.val((this.ui.field_header.val() || '').substr(0, 3));
            }
            break;
          case 'article':
            order = this.collections.articles.length + 1;
            break;
        }
        if (editing.id) {
          id = editing.id;
          order = editing.order || order;
        }
        // prepare tags
        var tags = _.uniq(_.compact(
          (this.ui.field_tags.val() || '').
            replace(/ /g, ',').
            replace(/#/g, '').
            toLowerCase().
            split(',')
        ));
        var header = this.ui.field_header.val() || '',
            body = this.ui.field_body.val() || '',
            type = this.ui.field_type.val() || '';
        if (type == 'post' && !body) return;
        if (type != 'post' && !header) return;
        Fruum.io.trigger(id ? 'fruum:update' : 'fruum:add', {
          id: id,
          parent: this.ui.field_parent.val() || '',
          initials: this.ui.field_initials.val() || '',
          type: type,
          header: header,
          body: body,
          attachments: this.cleanAttachments(body, editing.attachments || []),
          tags: tags,
          usage: this.ui.field_usage.data('value') | 0,
          permission: this.ui.field_permission.data('value') | 0,
          order: order,
        });
        this.post_count++;
      },
      // remove unused attachments
      cleanAttachments: function(body, attachments) {
        for (var i = attachments.length - 1; i >= 0; --i) {
          var attachment = attachments[i];
          if (!Fruum.utils.usesAttachment(body, attachment)) {
            attachments.splice(i, 1);
          }
        }
        return attachments;
      },

      // ------------------------- CATEGORY USE FOR ---------------------------

      onClickUsage: function(event) {
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }
        this.ui.popup_usage.toggleClass('fruum-nodisplay');
      },
      onSelectUsage: function(event) {
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }
        var usage = $(event.target).closest('[data-usage]').data('usage') | 0;
        this.ui.field_usage.data('value', usage).html(Fruum.usage[usage]);
        this.ui.popup_usage.addClass('fruum-nodisplay');
      },

      // ------------------------- CATEGORY PERM -------------------------------

      onClickPermission: function(event) {
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }
        this.ui.popup_permission.toggleClass('fruum-nodisplay');
      },
      onSelectPermission: function(event) {
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }
        var permission = $(event.target).closest('[data-permission]').data('permission') | 0;
        this.ui.field_permission.data('value', permission).html(Fruum.permission[permission]);
        this.ui.popup_permission.addClass('fruum-nodisplay');
      },
    });
  });
})();
