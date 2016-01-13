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
        manage: '.fruum-js-manage',
        edit: '[data-action="edit"]',
        visible: '[data-action="visible"]',
        delete: '[data-action="delete"]',
        locked: '[data-action="locked"]'
      },
      modelEvents: {
        'change:viewing change:searching': 'render'
      },
      events: {
        'click @ui.manage': 'onManage',
        'click @ui.edit': 'onEdit',
        'click @ui.delete': 'onDelete',
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
        var viewing = _.clone(this.model.get('viewing'));
        if (viewing.type == 'bookmark') {
          Fruum.io.trigger('fruum:show_bookmark', viewing);
        }
        else {
          Fruum.io.trigger('fruum:edit', viewing);
        }
      },
      onDelete: function(event) {
        event.preventDefault();
        var viewing = this.model.get('viewing');
        if (viewing.id) Fruum.io.trigger('fruum:archive', { id: viewing.id });
      }
    });
  });
})();
