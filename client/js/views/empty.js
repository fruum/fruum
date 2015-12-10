/******************************************************************************
Handles empty categories
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

    Fruum.views.EmptyView = TRANSITION(Marionette.ItemView.extend({
      template: '#fruum-template-empty',
      modelEvents: {
        'change:viewing': 'render'
      }
    }));
  });
})();
