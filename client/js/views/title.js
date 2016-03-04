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
        search: '[data-search-shortcut]',
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
        'click @ui.search': 'onSearch',
        'click @ui.manage': 'onManage',
        'click @ui.edit': 'onEdit',
        'click @ui.delete': 'onDelete',
        'click @ui.visible': 'onVisible',
        'click @ui.locked': 'onLocked'
      },
      onSearch: function(event) {
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }
        var search = $(event.target).
          closest('[data-search-shortcut]').
          data('search-shortcut');
        if (!search) return;
        Fruum.io.trigger('fruum:set_search', search);
      },
      onManage: function(event) {
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }
        Fruum.io.trigger('fruum:unset_onboard', 'manage');
        Fruum.io.trigger('fruum:toggle_manage', this.ui.manage);
      },
      onLocked: function(event) {
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }
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
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }
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
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }
        var viewing = _.clone(this.model.get('viewing'));
        if (viewing.type == 'bookmark') {
          Fruum.io.trigger('fruum:show_bookmark', viewing);
        }
        else {
          Fruum.io.trigger('fruum:unset_onboard', 'edit');
          Fruum.io.trigger('fruum:edit', viewing);
        }
      },
      onDelete: function(event) {
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }
        var viewing = this.model.get('viewing');
        if (viewing.id) Fruum.io.trigger('fruum:archive', { id: viewing.id });
      }
    });
  });
})();
