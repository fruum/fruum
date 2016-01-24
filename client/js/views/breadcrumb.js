/******************************************************************************
Breadcrumb view
*******************************************************************************/

(function() {
  'use strict';
  window.Fruum.require.push(function () {
    Fruum.views = Fruum.views || {};

    var $ = Fruum.libs.$,
        _ = Fruum.libs._,
        Messages = Fruum.messages,
        Backbone = Fruum.libs.Backbone,
        Marionette = Fruum.libs.Marionette;

    Fruum.views.BreadcrumbView = Marionette.ItemView.extend({
      template: '#fruum-template-breadcrumb',
      ui: {
        navigate: '.fruum-js-navigate',
        close_search: '.fruum-js-search-close'
      },
      modelEvents: {
        'change:viewing change:searching': 'render'
      },
      events: {
        'click @ui.close_search': 'onCloseSearch',
        'click @ui.navigate': 'onNavigate'
      },
      initialize: function(options) {
        this.notifications = options.notifications;
        this.listenTo(this.notifications, 'reset', this.render);
      },
      templateHelpers: function() {
        return {
          has_notifications: this.notifications.length
        }
      },
      onNavigate: function(event) {
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }
        Fruum.io.trigger('fruum:view', { id: $(event.target).closest('[data-id]').data('id') });
      },
      onCloseSearch: function(event) {
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }
        if (this.notifications.length) this.notifications.reset();
        else Fruum.io.trigger('fruum:clear_search');
      }
    });
  });
})();
