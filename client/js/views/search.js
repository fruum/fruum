/******************************************************************************
Handles search results
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

    Fruum.views.SearchResultEmptyView = TRANSITION(Marionette.ItemView.extend({
      initialize: function(options) {
        this.ui_state = options.ui_state;
        this.listenTo(this.ui_state, 'change:search', function() {
          var current = this.ui_state.get('search'),
              previous = this.ui_state.previous('search');
          if ( (current && !previous) || (previous && !current) ) this.render();
        });
      },
      templateHelpers: function() {
        return {
          search: this.ui_state.get('search')
        }
      },
      getTemplate: function() {
        if (this.ui_state.get('search')) {
          return '#fruum-template-search-noresults';
        }
        else {
          return '#fruum-template-search-empty';
        }
      }
    }));
    Fruum.views.SearchResultView = TRANSITION(Marionette.ItemView.extend({
      template: '#fruum-template-search',
      ui: {
        navigate: '.fruum-js-navigate'
      },
      events: {
        'click @ui.navigate': 'onNavigate'
      },
      onNavigate: function(event) {
        event.preventDefault();
        event.stopPropagation();
        var id = this.model.get('id');
        if (this.model.get('type') === 'post') id = this.model.get('parent');
        Fruum.io.trigger('fruum:view', { id: id });
        Fruum.io.trigger('fruum:clear_search');
      }
    }));
    Fruum.views.SearchView = Marionette.CollectionView.extend({
      emptyView: Fruum.views.SearchResultEmptyView,
      childView: Fruum.views.SearchResultView,
      initialize: function(options) {
        this.ui_state = options.ui_state;
      },
      childViewOptions: function() {
        return { ui_state: this.ui_state };
      }
    });
  });
})();
