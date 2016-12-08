/******************************************************************************
User profile view
*******************************************************************************/

/* globals Fruum */

(function() {
  'use strict';
  window.Fruum.require.push(function() {
    Fruum.views = Fruum.views || {};

    var $ = Fruum.libs.$,
        _ = Fruum.libs._,
        Backbone = Fruum.libs.Backbone,
        Marionette = Fruum.libs.Marionette,
        TRANSITION = Fruum.utils.marionette_itemview_transition,
        PAGE_SIZE = 50;

    // -------------------------------------------------------------------------

    var HeaderView = Marionette.ItemView.extend({
      template: '#fruum-template-profile-header',
      modelEvents: { 'change': 'render' },
    });

    var MainCardView = Marionette.ItemView.extend({
      template: '#fruum-template-profile-maincard',
      modelEvents: { 'change': 'render' },
    });

    var TabsView = Marionette.ItemView.extend({
      template: '#fruum-template-profile-tabs',
      modelEvents: {
        'change:topics change:replies change:id': 'render',
      },
      ui: {
        tabs: '[data-tab]',
      },
      events: {
        'click @ui.tabs': 'onTab',
      },
      initialize: function(options) {
        this.controller = options.controller;
        this.ui_state = options.ui_state;
      },
      onAttach: function() {
        this.listenTo(Fruum.io, 'fruum:update_notify', this.render);
        this.listenTo(this.ui_state, 'change:profile_total_users', this.render);
        this.listenTo(this.controller, 'change:tab', this.highlightTab);
        this.onDomRefresh();
      },
      onDomRefresh: function() {
        var tab = this.controller.get('tab');
        if (!tab ||
            tab && !(this.$('[data-tab="' + tab + '"]').length)
        ) {
          if (this.templateHelpers().notifications) {
            this.controller.set('tab', 'notifications');
          } else {
            this.controller.set('tab', this.$('[data-tab]').eq(0).data('tab') || '');
          }
        } else {
          this.highlightTab();
        }
      },
      highlightTab: function() {
        var tab = this.controller.get('tab');
        this.ui.tabs.removeClass('fruum-active');
        this.$('[data-tab="' + tab + '"]').addClass('fruum-active');
      },
      onTab: function(event) {
        event.preventDefault();
        event.stopPropagation();
        var tab = $(event.target).closest('[data-tab]').data('tab');
        if (tab) {
          this.controller.set('tab', tab);
        }
      },
      templateHelpers: function() {
        var notifications = 0;
        if (Fruum.user.id == this.model.get('id')) {
          notifications = Fruum.userUtils.countNotifications();
        }
        return {
          notifications: notifications,
          users: this.ui_state.get('profile_total_users'),
        };
      },
    });

    var ActionsView = Marionette.ItemView.extend({
      template: '#fruum-template-profile-actions',
      modelEvents: { 'change': 'render' },
      triggers: {
        'click [data-action="block"]': 'action:block',
        'click [data-action="unblock"]': 'action:unblock',
      },
    });

    // -------------------------------------------------------------------------

    var DocumentView = TRANSITION(Marionette.ItemView.extend({
      template: '#fruum-template-profile-document',
      ui: {
        navigate: '.fruum-js-navigate',
      },
      events: {
        'click @ui.navigate': 'onNavigate',
      },
      initialize: function(options) {
        this.templateHelpers = {
          is_notification: options.is_notification,
        };
      },
      onNavigate: function(event) {
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }
        var id = this.model.get('id');
        if (this.model.get('type') === 'post') id = this.model.get('parent');
        Fruum.io.trigger('fruum:profile');
        Fruum.io.trigger('fruum:view', { id: id });
      },
    }));

    var DocumentsView = Marionette.CollectionView.extend({
      childView: DocumentView,
      initialize: function(options) {
        this.childViewOptions = {
          is_notification: options.is_notification,
        };
      },
      onAttach: function() {
        this.triggerMethod('resize');
        this.listenTo(this.collection, 'add remove reset', function() {
          this.triggerMethod('resize');
        });
      },
    });

    // -------------------------------------------------------------------------

    var UserView = TRANSITION(Marionette.ItemView.extend({
      template: '#fruum-template-profile-user',
      events: {
        'click': 'onSelect',
      },
      modelEvents: {
        'change': 'render',
      },
      onSelect: function(event) {
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }
        Fruum.io.trigger('fruum:profile', {
          id: this.model.get('id'),
          username: this.model.get('username'),
        });
      },
    }));
    var UsersView = Marionette.CollectionView.extend({
      childView: UserView,
      onAttach: function() {
        this.triggerMethod('resize');
        this.listenTo(this.collection, 'add remove reset', function() {
          this.triggerMethod('resize');
        });
      },
    });

    // -------------------------------------------------------------------------

    Fruum.views.ProfileView = Marionette.LayoutView.extend({
      template: '#fruum-template-profile-layout',
      regions: {
        navigation: '.fruum-js-profile-navigation',
        header: '.fruum-js-profile-region-header',
        maincard: '.fruum-js-profile-region-maincard',
        tabs: '.fruum-js-profile-tabs',
        content: '.fruum-js-profile-content',
        actions: '.fruum-js-profile-actions',
      },
      ui: {
        close: '[data-action="close"]',
        nano: '.nano',
      },
      events: {
        'click @ui.close': 'onClose',
      },
      initialize: function(options) {
        var that = this;
        _.bindAll(this, 'resize', 'nextFeed');
        this.parent = options.parent;
        this.ui_state = options.ui_state;
        this.notifications = options.notifications;
        this.topics = options.topics;
        this.replies = options.replies;
        this.users = options.users;
        // profile controller model
        this.controller = new Backbone.Model({ tab: '' });
        // show/hide panel
        this.listenTo(this.ui_state, 'change:profile', function() {
          if (!this.ui_state.get('profile')) {
            that.topics.reset();
            that.replies.reset();
            that.notifications.reset();
            if (that.ui_state.get('viewing').id) {
              Fruum.io.trigger('fruum:restore_view_route');
            } else {
              Fruum.io.trigger('fruum:view_default');
            }
            this.parent.fadeOut('fast', function() {
              that.parent.addClass('fruum-nodisplay');
            });
          } else if (!this.ui_state.previous('profile')) {
            // hide onboarding
            Fruum.io.trigger('fruum:set_onboard');
            this.parent.removeClass('fruum-nodisplay').fadeIn('fast', function() {
              that.$(that.regions.actions).toggle(that.canDisplayActions());
              that.resize();
            });
          } else {
            that.$(that.regions.actions).toggle(that.canDisplayActions());
            that.resize();
          }
        });
        this.listenTo(this.ui_state, 'change:connected', function() {
          // display the action area only if user is admin
          this.$(this.regions.actions).toggle(this.canDisplayActions());
          if (!this.parent.hasClass('fruum-nodisplay')) this.resize();
        });
        this.listenTo(Fruum.io, 'fruum:resize', this.resize);
        this.listenTo(this.controller, 'change:tab', this.renderContent);
        this.listenTo(this.model, 'change:id', function() {
          this.controller.set('tab', '');
        });
      },
      onBeforeShow: function() {
        this.showChildView('header', new HeaderView({ model: this.model }));
        this.showChildView('maincard', new MainCardView({ model: this.model }));
        this.showChildView('tabs', new TabsView({
          model: this.model,
          controller: this.controller,
          ui_state: this.ui_state,
        }));
        this.showChildView('actions', new ActionsView({ model: this.model }));
        this.ui.nano.nanoScroller({
          preventPageScrolling: true,
          iOSNativeScrolling: true,
          disableResize: true,
        }).bind('scrollend', this.nextFeed);
      },
      onClose: function(event) {
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }
        this.ui_state.set('profile', '');
      },
      onChildviewActionBlock: function() {
        if (!Fruum.user.admin) return;
        Fruum.io.trigger('fruum:user:block', { id: this.model.get('id') });
        this.model.set('blocked', true);
        var user = this.users.get(this.model.get('id'));
        if (user) user.set('blocked', true);
      },
      onChildviewActionUnblock: function() {
        if (!Fruum.user.admin) return;
        Fruum.io.trigger('fruum:user:unblock', { id: this.model.get('id') });
        this.model.set('blocked', false);
        var user = this.users.get(this.model.get('id'));
        if (user) user.set('blocked', false);
      },
      onChildviewResize: function() {
        this.resize();
      },
      canDisplayActions: function() {
        return Fruum.user.admin && this.model.get('id') != Fruum.user.id;
      },
      resize: function() {
        this.ui.nano.height(
          this.parent.height() - this.$(this.regions.navigation).outerHeight() -
          (this.canDisplayActions() ? this.$(this.regions.actions).outerHeight() : 0)
        ).nanoScroller({ reset: true });
      },
      nextFeed: function() {
        if (!this.model.get('id')) return;
        switch (this.controller.get('tab')) {
          case 'topics':
            Fruum.io.trigger('fruum:user:feed', {
              id: this.model.get('id'),
              feed: 'topics',
              from: this.topics.length,
              size: PAGE_SIZE,
            });
            break;
          case 'replies':
            Fruum.io.trigger('fruum:user:feed', {
              id: this.model.get('id'),
              feed: 'replies',
              from: this.replies.length,
              size: PAGE_SIZE,
            });
            break;
          case 'users':
            Fruum.io.trigger('fruum:user:list', {
              from: this.users.length,
              size: PAGE_SIZE,
            });
            break;
        }
      },
      renderContent: function() {
        switch (this.controller.get('tab')) {
          case 'topics':
            if (!this.topics.length) {
              Fruum.io.trigger('fruum:user:feed', {
                id: this.model.get('id'),
                feed: 'topics',
                from: 0,
                size: PAGE_SIZE,
              });
            }
            this.showChildView('content', new DocumentsView({
              collection: this.topics,
              ui_state: this.ui_state,
              is_notification: false,
            }));
            break;
          case 'replies':
            if (!this.replies.length) {
              Fruum.io.trigger('fruum:user:feed', {
                id: this.model.get('id'),
                feed: 'replies',
                from: 0,
                size: PAGE_SIZE,
              });
            }
            this.showChildView('content', new DocumentsView({
              collection: this.replies,
              ui_state: this.ui_state,
              is_notification: false,
            }));
            break;
          case 'notifications':
            if (Fruum.userUtils.countNotifications() != this.notifications.length) {
              Fruum.io.trigger('fruum:notifications', { ids: Fruum.user.notifications });
            }
            this.showChildView('content', new DocumentsView({
              collection: this.notifications,
              ui_state: this.ui_state,
              is_notification: true,
            }));
            break;
          case 'users':
            if (!this.users.length) {
              Fruum.io.trigger('fruum:user:list', {
                from: 0,
                size: PAGE_SIZE,
              });
            }
            this.showChildView('content', new UsersView({
              collection: this.users,
              ui_state: this.ui_state,
            }));
            break;
        }
        this.ui.nano.nanoScroller && this.ui.nano.nanoScroller({ scroll: 'top' });
        _.defer(this.resize);
      },
    });
  });
})();
