/******************************************************************************
 Emoji panel
*******************************************************************************/

/* globals Fruum */

(function() {
  'use strict';
  window.Fruum.require.push(function() {
    Fruum.views = Fruum.views || {};

    var $ = Fruum.libs.$,
        _ = Fruum.libs._,
        Marionette = Fruum.libs.Marionette;

    Fruum.views.EmojiPanelView = Marionette.View.extend({
      template: false,
      $el_root: $('#fruum'),
      el: '.fruum-js-emoji',
      events: {
        'click [data-item]': 'onSelect',
      },
      initialize: function(options) {
        _.bindAll(this, 'onKey');
        this.$el.html(_.template($('#fruum-template-emojipanel').html())());
        this.interactions = options.interactions;
      },
      onSelect: function(event) {
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }
        var item = $(event.target).closest('[data-item]').data('item'),
            field = this.interactions.ui.field_body;
        if (item) {
          field.val(field.val() + ' ' + item + ' ');
          this.hide();
          _.defer(function() { field.focus(); });
        }
      },
      onKey: function(event) {
        if (event.which == 27) this.hide();
      },
      show: function() {
        if (!this.$el.hasClass('fruum-nodisplay')) return;
        this.$el.removeClass('fruum-nodisplay');
        $(document).on('keydown', this.onKey);
      },
      hide: function() {
        if (this.$el.hasClass('fruum-nodisplay')) return;
        this.$el.addClass('fruum-nodisplay');
        $(document).off('keydown', this.onKey);
      },
      toggle: function() {
        if (this.$el.is(':visible')) {
          this.hide();
        } else {
          this.show();
        }
      },
    });
  });
})();
