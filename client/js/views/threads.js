/******************************************************************************
Threads view
*******************************************************************************/

(function() {
  'use strict';
  window.Fruum.require.push(function () {
    Fruum.views = Fruum.views || {};

    var $ = Fruum.libs.$,
        _ = Fruum.libs._,
        Backbone = Fruum.libs.Backbone,
        Marionette = Fruum.libs.Marionette,
        TRANSITION = Fruum.utils.marionette_itemview_transition;

    Fruum.views.ThreadView = TRANSITION(Marionette.ItemView.extend({
      template: '#fruum-template-thread',
      ui: {
        search: '[data-search-shortcut]',
        navigate: '.fruum-js-navigate',
        manage: '.fruum-js-manage',
        sticky: '[data-action="sticky"]',
        move: '[data-action="move"]',
        delete: '[data-action="delete"]',
        edit: '[data-action="edit"]'
      },
      modelEvents: {
        'change': 'render'
      },
      events: {
        'click @ui.search': 'onSearch',
        'click @ui.manage': 'onManage',
        'click @ui.navigate': 'onNavigate',
        'click @ui.sticky': 'onSticky',
        'click @ui.delete': 'onDelete',
        'click @ui.move': 'onMove',
        'click @ui.edit': 'onEdit'
      },
      templateHelpers: function() {
        return {
          is_new: Fruum.utils.isNewVisit(
            this.model.get('id'), this.model.get('updated')
          )
        }
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
      onNavigate: function(event) {
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }
        Fruum.io.trigger('fruum:view', { id: this.model.get('id') });
      },
      onManage: function(event) {
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }
        Fruum.io.trigger('fruum:toggle_manage', this.ui.manage);
      },
      onSticky: function(event) {
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }
        Fruum.io.trigger('fruum:close_manage');
        Fruum.io.trigger('fruum:field', {
          id: this.model.get('id'),
          field: 'sticky',
          value: !this.model.get('sticky')
        });
      },
      onDelete: function(event) {
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }
        Fruum.io.trigger('fruum:close_manage');
        Fruum.io.trigger('fruum:archive', { id: this.model.get('id') });
      },
      onMove: function(event) {
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }
        Fruum.io.trigger('fruum:close_manage');
        Fruum.io.trigger('fruum:show_move', this.model.toJSON());
      },
      onEdit: function(event) {
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }
        Fruum.io.trigger('fruum:close_manage');
        Fruum.io.trigger('fruum:edit', this.model.toJSON());
      }
    }));
    Fruum.views.ThreadsView = Marionette.CollectionView.extend({
      childView: Fruum.views.ThreadView
    });
  });
})();
