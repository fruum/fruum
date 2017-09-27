/******************************************************************************
Handles bookmark search
*******************************************************************************/

/* globals Fruum */

(function() {
  'use strict';
  window.Fruum.require.push(function() {
    Fruum.views = Fruum.views || {};

    var $ = Fruum.libs.$,
        _ = Fruum.libs._,
        Marionette = Fruum.libs.Marionette,
        TRANSITION = Fruum.utils.marionette_itemview_transition;

    Fruum.views.BookmarkItemView = Marionette.View.extend({
      template: '#fruum-template-bookmark-category',
      triggers: {
        'click': 'select:category',
      },
    });

    Fruum.views.BookmarkCollectionView = Marionette.CollectionView.extend({
      childView: Fruum.views.BookmarkItemView,
      onChildviewSelectCategory: function(childView) {
        // bubble to parent
        this.triggerMethod('select:category', childView.model);
      },
    });

    Fruum.views.BookmarkEditView = Marionette.View.extend({
      template: '#fruum-template-bookmark-edit',
      regions: {
        list: '.fruum-js-bookmark-categories',
      },
      ui: {
        close: '.fruum-js-close',
        delete: '.fruum-js-delete',
        header: '[data-field="header"]',
        body: '[data-field="body"]',
        store: '.fruum-js-store',
      },
      events: {
        'click @ui.close': 'onClose',
        'click @ui.delete': 'onDelete',
        'click @ui.store': 'onStore',
      },
      initialize: function(options) {
        _.bindAll(this, 'onKey');
        this.ui_state = options.model;
        this.all_categories = options.all_categories;
        this.categories = options.categories;
        this.listenTo(Fruum.io, 'fruum:show_bookmark', this.show);
        this.listenTo(Fruum.io, 'fruum:hide_bookmark', this.onClose);
        this.listenTo(this.all_categories, 'reset', this.onResetCategories);
      },
      onChildviewSelectCategory: function(model) {
        if (!this.bookmark) return;
        this.bookmark.parent = model.get('id');
        this.onResetCategories();
      },
      onResetCategories: function() {
        var that = this;
        _.defer(function() {
          if (that.bookmark && that.bookmark.parent) {
            that.$('[data-id]').removeClass('fruum-option-selected');
            that.$('[data-id="' + that.bookmark.parent + '"]').addClass('fruum-option-selected');
          }
        });
      },
      onClose: function(event) {
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }
        if (this.el_container.hasClass('fruum-nodisplay')) return;
        this.el_container.addClass('fruum-nodisplay');
        $(document).off('keydown', this.onKey);
      },
      onDelete: function(event) {
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }
        if (!this.bookmark || !this.bookmark.id) return;
        Fruum.io.trigger('fruum:delete', { id: this.bookmark.id });
        this.onClose();
      },
      onStore: function(event) {
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }
        if (!this.bookmark || !this.bookmark.parent) return;
        var header = $.trim(this.ui.header.val() || ''),
            body = $.trim(this.ui.body.val() || '') || this.bookmark.body;
        if (!header || !body) return;
        Fruum.io.trigger(this.bookmark.id ? 'fruum:update' : 'fruum:add', {
          id: this.bookmark.id || '',
          parent: this.bookmark.parent,
          header: header,
          type: 'bookmark',
          body: body,
          order: this.bookmark.id ? this.bookmark.order : (this.categories.length + 1),
        });
        this.onClose();
        if (!this.bookmark.id) Fruum.io.trigger('fruum:clear_search');
      },
      onKey: function(event) {
        if (event.which == 27) this.onClose();
      },
      onRender: function() {
        this.el_container = this.$el.parent();
        this.showChildView('list', new Fruum.views.BookmarkCollectionView({
          collection: this.all_categories,
        }));
      },
      show: function(bookmark) {
        if (!bookmark || !bookmark.body) return;
        this.bookmark = bookmark;
        this.render();
        if (!this.el_container.hasClass('fruum-nodisplay')) return;
        this.el_container.removeClass('fruum-nodisplay');
        $(document).on('keydown', this.onKey);
        Fruum.io.trigger('fruum:categories', {});
        this.ui.header.focus();
      },
      templateContext: function() {
        return {
          bookmark: this.bookmark || {},
        };
      },
    });

    Fruum.views.BookmarkSearchResultView = TRANSITION(Marionette.View.extend({
      template: '#fruum-template-bookmarksearch',
      ui: {
        search: '[data-search-shortcut]',
        navigate: '.fruum-js-navigate',
      },
      events: {
        'click @ui.search': 'onSearch',
        'click @ui.navigate': 'onNavigate',
      },
      onSearch: function(event) {
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }
        var search = $(event.target).
          closest('[data-search-shortcut]').
          data('search-shortcut');
        if (!search) return;
        Fruum.io.trigger('fruum:set_search', search);
      },
      onNavigate: function(event) {
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }
        var id = this.model.get('id');
        if (this.model.get('type') === 'post') id = this.model.get('parent');
        Fruum.io.trigger('fruum:view', { id: id });
      },
    }));

    Fruum.views.BookmarkSearchView = Marionette.CollectionView.extend({
      childView: Fruum.views.BookmarkSearchResultView,
    });
  });
})();
