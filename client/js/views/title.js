/******************************************************************************
Handles the top part
*******************************************************************************/

(function() {
  'use strict';
  window.Fruum.require.push(function () {
    Fruum.views = Fruum.views || {};

    var $ = Fruum.libs.$,
        _ = Fruum.libs._,
        Messages = Fruum.messages,
        Backbone = Fruum.libs.Backbone,
        Marionette = Fruum.libs.Marionette;

    Fruum.views.TitleView = Marionette.ItemView.extend({
      template: '#fruum-template-title',
      ui: {
        manage: '.fruum-manage',
        edit: '[data-action="edit"]',
        visible: '[data-action="visible"]',
        delete: '[data-action="delete"]',
        locked: '[data-action="locked"]',
        allow_threads: '[data-action="allow_threads"]',
        allow_channels: '[data-action="allow_channels"]'
      },
      modelEvents: {
        'change:viewing change:searching': 'render'
      },
      events: {
        'click @ui.manage': 'onManage',
        'click @ui.edit': 'onEdit',
        'click @ui.delete': 'onDelete',
        'click @ui.allow_threads': 'onAllowThreads',
        'click @ui.allow_channels': 'onAllowChannels',
        'click @ui.visible': 'onVisible',
        'click @ui.locked': 'onLocked'
      },
      initialize: function(options) {
        this.notifications = options.notifications;
        this.listenTo(this.notifications, 'reset', this.render);
      },
      templateHelpers: function() {
        return {
          has_notifications: this.notifications.length
        }
      },
      onManage: function(event) {
        Fruum.io.trigger('fruum:toggle_manage', this.ui.manage);
      },
      onAllowThreads: function(event) {
        event.preventDefault();
        var viewing = this.model.get('viewing');
        if (viewing.id) {
          Fruum.io.trigger('fruum:field', {
            id: viewing.id,
            field: 'allow_threads',
            value: !viewing.allow_threads
          });
        }
      },
      onAllowChannels: function(event) {
        event.preventDefault();
        var viewing = this.model.get('viewing');
        if (viewing.id) {
          Fruum.io.trigger('fruum:field', {
            id: viewing.id,
            field: 'allow_channels',
            value: !viewing.allow_channels
          });
        }
      },
      onLocked: function(event) {
        event.preventDefault();
        var viewing = this.model.get('viewing');
        if (viewing.id) {
          Fruum.io.trigger('fruum:field', {
            id: viewing.id,
            field: 'locked',
            value: !viewing.locked
          });
        }
      },
      onVisible: function(event) {
        event.preventDefault();
        var viewing = this.model.get('viewing');
        if (viewing.id && confirm(viewing.visible?Messages.private:Messages.public)) {
          Fruum.io.trigger('fruum:field', {
            id: viewing.id,
            field: 'visible',
            value: !viewing.visible
          });
        }
      },
      onEdit: function(event) {
        event.preventDefault();
        Fruum.io.trigger('fruum:edit', _.clone(this.model.get('viewing')));
      },
      onDelete: function(event) {
        event.preventDefault();
        var viewing = this.model.get('viewing');
        if (viewing.id) Fruum.io.trigger('fruum:archive', { id: viewing.id });
      }
    });
  });
})();
