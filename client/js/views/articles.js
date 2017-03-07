/******************************************************************************
Articles view
*******************************************************************************/

/* globals Fruum */

(function() {
  'use strict';
  window.Fruum.require.push(function() {
    Fruum.views = Fruum.views || {};

    var $ = Fruum.libs.$,
        Marionette = Fruum.libs.Marionette,
        TRANSITION = Fruum.utils.marionette_itemview_transition;

    Fruum.views.ArticleView = TRANSITION(Marionette.View.extend({
      template: '#fruum-template-article',
      ui: {
        search: '[data-search-shortcut]',
        navigate: '.fruum-js-navigate',
        manage: '.fruum-js-manage',
        up: '[data-action="up"]',
        down: '[data-action="down"]',
        move: '[data-action="move"]',
        delete: '[data-action="delete"]',
      },
      modelEvents: {
        'change': 'render',
      },
      events: {
        'click @ui.search': 'onSearch',
        'click @ui.manage': 'onManage',
        'click @ui.navigate': 'onNavigate',
        'click @ui.delete': 'onDelete',
        'click @ui.up': 'onUp',
        'click @ui.down': 'onDown',
        'click @ui.move': 'onMove',
      },
      templateContext: function() {
        return {
          is_new: Fruum.utils.isNewVisit(
            this.model.get('id'), this.model.get('updated')
          ),
        };
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
      onDelete: function(event) {
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }
        Fruum.io.trigger('fruum:close_manage');
        Fruum.io.trigger('fruum:archive', { id: this.model.get('id') });
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
      onMove: function(event) {
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }
        Fruum.io.trigger('fruum:close_manage');
        Fruum.io.trigger('fruum:show_move', this.model.toJSON());
      },
    }));

    Fruum.views.ArticlesView = Marionette.CollectionView.extend({
      childView: Fruum.views.ArticleView,
    });
  });
})();
