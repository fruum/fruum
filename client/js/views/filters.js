/******************************************************************************
Search button
*******************************************************************************/

/* globals Fruum */

(function() {
  'use strict';
  window.Fruum.require.push(function() {
    Fruum.views = Fruum.views || {};

    var $ = Fruum.libs.$,
        _ = Fruum.libs._,
        Marionette = Fruum.libs.Marionette;

    Fruum.views.FiltersView = Marionette.ItemView.extend({
      template: '#fruum-template-filters',
      ui: {
        search: '.fruum-js-search',
        search_input: '.fruum-js-search-input',
        search_close: '.fruum-js-search-close',
      },
      events: {
        'keyup @ui.search_input': 'onSearchKeyup',
        'blur @ui.search_input': 'onSearchBlur',
        'click @ui.search': 'onSearchOpen',
        'click @ui.search_close': 'onSearchClose',
      },
      initialize: function(options) {
        _.bindAll(this, '_search');
        this.listenTo(Fruum.io, 'fruum:clear_search', this.onSearchClose);
        this.listenTo(Fruum.io, 'fruum:set_search', this.onSearchSet);
      },
      onSearchSet: function(query) {
        this.model.set('searching', true);
        if (!this.ui.search.hasClass('fruum-search-active')) {
          this.ui.search.addClass('fruum-search-active');
        }
        this.ui.search_input.focus().val(query + ' ');
        this.searchNow();
      },
      onSearchKeyup: function(event) {
        if (this.search_timer) clearTimeout(this.search_timer);
        this.search_timer = setTimeout(this._search, 500);
      },
      onSearchBlur: function(event) {
        if (!this.ui.search_input.val()) {
          this.ui.search.removeClass('fruum-search-active');
          if (this.model.get('searching')) {
            this.model.set('searching', false);
            Fruum.io.trigger('fruum:restore_view_route');
          }
        }
        this._updateStatus();
      },
      onSearchOpen: function(event) {
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }
        this.model.set('searching', true);
        if (!this.ui.search.hasClass('fruum-search-active')) {
          this.ui.search.addClass('fruum-search-active');
          this.ui.search_input.focus().select();
          this.searchNow();
        }
      },
      onSearchClose: function(event) {
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }
        this.ui.search_input.val('').blur();
        this.onSearchBlur();
      },
      searchNow: function() {
        if (this.search_timer) clearTimeout(this.search_timer);
        this._search();
      },
      _updateStatus: function() {
        this.model.set('has_search_string', $.trim(this.ui.search_input.val() || '').length > 0);
      },
      _search: function() {
        this.search_timer = null;
        this._updateStatus();
        Fruum.io.trigger('fruum:search', this.ui.search_input.val());
      },
    });
  });
})();
