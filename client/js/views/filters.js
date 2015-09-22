/******************************************************************************
Search button
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
    Fruum.views.FiltersView = Marionette.ItemView.extend({
      template: '#fruum-template-filters',
      ui: {
        search: '.fruum-js-search',
        search_input: '.fruum-js-search-input',
        search_close: '.fruum-js-search-close'
      },
      events: {
        'keyup @ui.search_input': 'onSearchKeyup',
        'blur @ui.search_input': 'onSearchBlur',
        'click @ui.search': 'onSearchOpen',
        'click @ui.search_close': 'onSearchClose'
      },
      initialize: function(options) {
        _.bindAll(this, '_search');
        this.listenTo(Fruum.io, 'fruum:clear_search', this.onSearchClose);

        this.notifications = options.notifications;
        this.listenTo(this.notifications, 'reset', this.render);
      },
      templateHelpers: function() {
        return {
          has_notifications: this.notifications.length
        }
      },
      onSearchKeyup: function(event) {
        if (this.search_timer) clearTimeout(this.search_timer);
        this.search_timer = setTimeout(this._search, 500);
      },
      onSearchBlur: function(event) {
        if (!this.ui.search_input.val()) {
          this.ui.search.removeClass('fruum-search-active');
          this.model.set('searching', false);
        }
      },
      onSearchOpen: function(event) {
        this.model.set('searching', true);
        this.ui.search.addClass('fruum-search-active');
        this.ui.search_input.focus();
      },
      onSearchClose: function(event) {
        event && event.stopPropagation();
        this.ui.search_input.val('').blur();
        this.onSearchBlur();
      },
      _search: function() {
        this.search_timer = null;
        Fruum.io.trigger('fruum:search', this.ui.search_input.val());
      }
    });
  });
})();
