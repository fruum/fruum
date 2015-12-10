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
      childView: Fruum.views.SearchResultView
    });
  });
})();
