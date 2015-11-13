/******************************************************************************
Handles sharing functionality
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
    //View
    Fruum.views.ShareView = Marionette.View.extend({
      events: {
        'click .fruum-popup-close': 'onClose',
        'click textarea': 'onSelect'
      },
      initialize: function(options) {
        this.ui_state = options.ui_state;
        this.listenTo(Fruum.io, 'fruum:share', this.onShare);
        this.listenTo(Fruum.io, 'fruum:view', this.onView);
      },
      onShare: function(el_caller, post_index) {
        if (el_caller) {
          this.$el.css('top', (el_caller.offset().top - this.$el.parent().offset().top) + 'px')
        }
        this.$el.show().find('textarea').
          val(Fruum.utils.permaLink(this.ui_state.get('viewing').id, post_index)).
          focus().
          select();
      },
      onView: function() {
        this.onClose();
      },
      onClose: function(event) {
        event && event.preventDefault();
        this.$el.hide();
      },
      onSelect: function(event) {
        $(event.target).focus().select();
      }
    });
  });
})();
