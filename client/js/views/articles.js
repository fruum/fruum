/******************************************************************************
Articles view
*******************************************************************************/

(function() {
  'use strict';
  window.Fruum.require.push(function () {
    Fruum.views = Fruum.views || {};
    //libraries
    var $ = Fruum.libs.$,
        _ = Fruum.libs._,
        Backbone = Fruum.libs.Backbone,
        Marionette = Fruum.libs.Marionette,
        TRANSITION = Fruum.utils.marionette_itemview_transition;
    //View
    Fruum.views.ArticleView = TRANSITION(Marionette.ItemView.extend({
      template: '#fruum-template-article',
      ui: {
        navigate: '.fruum-js-navigate',
        manage: '.fruum-js-manage',
        up: '[data-action="up"]',
        down: '[data-action="down"]',
        delete: '[data-action="delete"]',
        edit: '[data-action="edit"]'
      },
      modelEvents: {
        'change': 'render'
      },
      events: {
        'click @ui.manage': 'onManage',
        'click @ui.navigate': 'onNavigate',
        'click @ui.delete': 'onDelete',
        'click @ui.up': 'onUp',
        'click @ui.down': 'onDown',
        'click @ui.edit': 'onEdit'
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
      onDelete: function(event) {
        event.preventDefault();
        event.stopPropagation();
        Fruum.io.trigger('fruum:close_manage');
        Fruum.io.trigger('fruum:archive', { id: this.model.get('id') });
      },
      onUp: function(event) {
        event.preventDefault();
        event.stopPropagation();
        Fruum.io.trigger('fruum:close_manage');
        var collection = this.model.collection;
        if (!collection) return;
        var index = collection.models.indexOf(this.model);
        if (index <= 0) return;
        var prev_model = collection.models[index - 1];
        Fruum.io.trigger('fruum:field', {
          id: this.model.get('id'), field: 'order', value: prev_model.get('order')
        });
        Fruum.io.trigger('fruum:field', {
          id: prev_model.get('id'), field: 'order', value: this.model.get('order')
        });
      },
      onDown: function(event) {
        event.preventDefault();
        event.stopPropagation();
        Fruum.io.trigger('fruum:close_manage');
        var collection = this.model.collection;
        if (!collection) return;
        var index = collection.models.indexOf(this.model);
        if (index + 1 >= collection.models.length) return;
        var next_model = collection.models[index + 1];
        Fruum.io.trigger('fruum:field', {
          id: this.model.get('id'), field: 'order', value: next_model.get('order')
        });
        Fruum.io.trigger('fruum:field', {
          id: next_model.get('id'), field: 'order', value: this.model.get('order')
        });
      },
      onEdit: function(event) {
        event.preventDefault();
        event.stopPropagation();
        Fruum.io.trigger('fruum:close_manage');
        Fruum.io.trigger('fruum:edit', this.model.toJSON());
      }
    }));
    Fruum.views.ArticlesView = Marionette.CollectionView.extend({
      childView: Fruum.views.ArticleView
    });
  });
})();
