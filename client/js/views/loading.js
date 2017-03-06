/******************************************************************************
Loader helper view
*******************************************************************************/

/* globals Fruum */

(function() {
  'use strict';
  window.Fruum.require.push(function() {
    Fruum.views = Fruum.views || {};

    var _ = Fruum.libs._,
        Marionette = Fruum.libs.Marionette;

    Fruum.views.LoadingView = Marionette.View.extend({
      template: '#fruum-template-loading',
      modelEvents: {
        'change:loading': 'onLoading',
      },
      initialize: function(options) {
        _.bindAll(this, 'onRender');
        this.$content = options.content;
      },
      onRender: function() {
        this.timer = null;
        this.$el.parent().stop(true, true).fadeIn(1);
        this.$content.stop(true, true).fadeOut(1);
      },
      onLoading: function() {
        var state = this.model.get('loading');
        if (state) {
          // default delay
          var delay = 1000;
          // semi fade out content panel
          if (state.slice(0, 5) == 'view:') {
            var id = state.slice(5),
                view_el = this.$content.find('[data-docid="' + id + '"]');
            this.$content.find('[data-docid]:not([data-docid="' + id + '"])').fadeTo(600, 0);
            if (view_el.length) {
              delay = 700;
              view_el.addClass('fruum-interactive-clicked').
                      animate({
                        'padding-top': '3em',
                        'padding-bottom': '3em',
                        'margin-top': '-2em',
                      }, 400).
                      animate({
                        'opacity': 0,
                      }, 300);
            } else {
              delay = 700;
            }
          }

          if (state == 'link' || state == 'connect' || state == 'search') {
            if (this.timer) {
              clearTimeout(this.timer);
              this.timer = null;
            }
            this.$el.parent().stop(true, true).fadeIn(1);
            this.$content.stop(true, true).fadeOut(1);
          } else {
            if (!this.timer) this.timer = setTimeout(this.onRender, delay);
          }
        } else {
          if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
          }
          this.$el.parent().stop(true, true).fadeOut('fast');
          // show content panel
          this.$content.stop(true, true).fadeTo(100, 1);
        }
      },
    });
  });
})();
