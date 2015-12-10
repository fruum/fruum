/******************************************************************************
Categories view
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

    Fruum.views.CategoryView = TRANSITION(Marionette.ItemView.extend({
      template: '#fruum-template-category',
      ui: {
        navigate: '.fruum-js-navigate',
        manage: '.fruum-js-manage',
        edit: '[data-action="edit"]',
        up: '[data-action="up"]',
        down: '[data-action="down"]',
        delete: '[data-action="delete"]'
      },
      modelEvents: {
        'change': 'render'
      },
      events: {
        'click @ui.manage': 'onManage',
        'click @ui.navigate': 'onNavigate',
        'click @ui.edit': 'onEdit',
        'click @ui.up': 'onUp',
        'click @ui.down': 'onDown',
        'click @ui.delete': 'onDelete'
      },
      onNavigate: function(event) {
        event.preventDefault();
        event.stopPropagation();
        Fruum.io.trigger('fruum:view', { id: this.model.get('id') });
      },
      onManage: function(event) {
        event.preventDefault();
        event.stopPropagation();
        Fruum.io.trigger('fruum:toggle_manage', this.ui.manage);
      },
      onEdit: function(event) {
        event.preventDefault();
        event.stopPropagation();
        Fruum.io.trigger('fruum:close_manage');
        Fruum.io.trigger('fruum:edit', this.model.toJSON());
      },
      onUp: function(event) {
        event.preventDefault();
        event.stopPropagation();
        Fruum.io.trigger('fruum:close_manage');
        Fruum.utils.orderUp(this.model, event.shiftKey);
      },
      onDown: function(event) {
        event.preventDefault();
        event.stopPropagation();
        Fruum.io.trigger('fruum:close_manage');
        Fruum.utils.orderDown(this.model, event.shiftKey);
      },
      onDelete: function(event) {
        event.preventDefault();
        event.stopPropagation();
        Fruum.io.trigger('fruum:close_manage');
        Fruum.io.trigger('fruum:archive', { id: this.model.get('id') });
      }
    }));
    Fruum.views.CategoriesView = Marionette.CollectionView.extend({
      childView: Fruum.views.CategoryView
    });
  });
})();
