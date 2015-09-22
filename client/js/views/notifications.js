/******************************************************************************
Handles notifications list
*******************************************************************************/

(function() {
  'use strict';
  window.Fruum.require.push(function () {
    Fruum.views = Fruum.views || {};
    //libraries
    var $ = Fruum.libs.$,
        _ = Fruum.libs._,
        Backbone = Fruum.libs.Backbone,
        Marionette = Fruum.libs.Marionette,
        TRANSITION = Fruum.utils.marionette_itemview_transition;
    //View
    Fruum.views.NotificationView = TRANSITION(Marionette.ItemView.extend({
      template: '#fruum-template-notification',
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
        this.model.collection.reset();
        Fruum.io.trigger('fruum:view', { id: id });
      }
    }));
    Fruum.views.NotificationsView = Marionette.CollectionView.extend({
      childView: Fruum.views.NotificationView
    });
  });
})();
