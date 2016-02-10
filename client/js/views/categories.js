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
      initialize: function(options) {
        this.ui_state = options.ui_state;
      },
      templateHelpers: function() {
        return {
          viewing: this.ui_state.get('viewing'),
          is_new: Fruum.utils.isNewVisit(
            this.model.get('id'), this.model.get('updated')
          )
        }
      },
      getTemplate: function() {
        if (this.model.get('type') == 'bookmark')
          return '#fruum-template-bookmark';
        else
          return '#fruum-template-category';
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
      onEdit: function(event) {
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }
        Fruum.io.trigger('fruum:close_manage');
        if (this.model.get('type') == 'bookmark') {
          Fruum.io.trigger('fruum:show_bookmark', this.model.toJSON());
        }
        else {
          Fruum.io.trigger('fruum:edit', this.model.toJSON());
        }
      },
      onUp: function(event) {
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }
        Fruum.io.trigger('fruum:close_manage');
        Fruum.utils.orderUp(this.model, event.shiftKey);
      },
      onDown: function(event) {
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }
        Fruum.io.trigger('fruum:close_manage');
        Fruum.utils.orderDown(this.model, event.shiftKey);
      },
      onDelete: function(event) {
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }
        Fruum.io.trigger('fruum:close_manage');
        if (this.model.get('type') == 'bookmark')
          Fruum.io.trigger('fruum:delete', { id: this.model.get('id') });
        else
          Fruum.io.trigger('fruum:archive', { id: this.model.get('id') });
      }
    }));
    Fruum.views.CategoriesView = Marionette.CollectionView.extend({
      childView: Fruum.views.CategoryView,
      initialize: function(options) {
        this.ui_state = options.ui_state;
      },
      childViewOptions: function(model, index) {
        return { ui_state: this.ui_state };
      }
    });
  });
})();
