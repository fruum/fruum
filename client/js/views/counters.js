/******************************************************************************
 Counters
*******************************************************************************/

(function() {
  'use strict';
  window.Fruum.require.push(function () {
    Fruum.views = Fruum.views || {};
    //libraries
    var $ = Fruum.libs.$,
        _ = Fruum.libs._,
        Backbone = Fruum.libs.Backbone,
        Marionette = Fruum.libs.Marionette;

    Fruum.views.CountersView = Marionette.ItemView.extend({
      template: '#fruum-template-counters',
      ui: {
        down: '.fruum-js-filter-down',
        up: '.fruum-js-filter-up'
      },
      modelEvents: {
        'change:total_entries change:viewing_from change:viewing_to': 'render'
      },
      events: {
        'click @ui.down': 'onDown',
        'click @ui.up': 'onUp'
      },
      onDown: function() {
        Fruum.io.trigger('fruum:scroll_bottom');
      },
      onUp: function() {
        Fruum.io.trigger('fruum:scroll_top');
      }
    });
  });
})();
