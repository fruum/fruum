/******************************************************************************
Handles sharing functionality
*******************************************************************************/

/* globals Fruum */

(function() {
  'use strict';
  window.Fruum.require.push(function() {
    Fruum.views = Fruum.views || {};

    var $ = Fruum.libs.$,
        _ = Fruum.libs._,
        Marionette = Fruum.libs.Marionette;

    Fruum.views.ShareView = Marionette.View.extend({
      template: _.noop,
      events: {
        'click .fruum-popup-close': 'onClose',
        'click textarea': 'onSelect',
      },
      initialize: function(options) {
        this.ui_state = options.ui_state;
        this.listenTo(Fruum.io, 'fruum:share', this.onShare);
        this.listenTo(Fruum.io, 'fruum:view', this.onView);
      },
      onShare: function(el_caller, post_index) {
        if (el_caller) {
          this.$el.css('top', (el_caller.offset().top - this.$el.parent().offset().top) + 'px');
        }
        this.$el.removeClass('fruum-nodisplay').find('textarea').
          val(Fruum.utils.permaLink(this.ui_state.get('viewing').id, post_index)).
          focus().
          select();
      },
      onView: function() {
        this.onClose();
      },
      onClose: function(event) {
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }
        this.$el.addClass('fruum-nodisplay');
      },
      onSelect: function(event) {
        $(event.target).focus().select();
      },
    });
  });
})();
