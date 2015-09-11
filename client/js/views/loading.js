/******************************************************************************
Loader helper view
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
    Fruum.views.LoadingView = (Marionette.ItemView.extend({
      template: '#fruum-template-loading',
      modelEvents: {
        'change:loading': 'onLoading'
      },
      initialize: function(options) {
        _.bindAll(this, 'onShow');
        this.$content = options.content;
      },
      onShow: function() {
        this.timer = null;
        this.$el.parent().stop(true,true).fadeIn(1);
      },
      onLoading: function() {
        var state = this.model.get('loading');
        if (state) {
          //semi fade out content panel
          if (state == 'view')
            this.$content.stop(true,true).fadeTo(1000, 0.6);

          if (state == 'link' || state == 'connect') {
            if (this.timer) {
              clearTimeout(this.timer);
              this.timer = null;
            }
            this.$el.parent().stop(true,true).fadeIn(1);
          }
          else {
            if (!this.timer) this.timer = setTimeout(this.onShow, 1000);
          }
        }
        else {
          if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
          }
          this.$el.parent().stop(true,true).fadeOut('fast');
          //show content panel
          this.$content.stop(true,true).fadeTo(100, 1);
        }
      }
    }));
  });
})();
