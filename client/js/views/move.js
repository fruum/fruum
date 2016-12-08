/******************************************************************************
Handles move document
*******************************************************************************/

/* globals Fruum */

(function() {
  'use strict';
  window.Fruum.require.push(function() {
    Fruum.views = Fruum.views || {};

    var $ = Fruum.libs.$,
        _ = Fruum.libs._,
        Marionette = Fruum.libs.Marionette,
        Messages = Fruum.messages;

    Fruum.views.MoveItemView = Marionette.ItemView.extend({
      template: '#fruum-template-move-entry',
      triggers: {
        'click': 'select:category',
      },
    });

    Fruum.views.MoveCollectionView = Marionette.CollectionView.extend({
      childView: Fruum.views.MoveItemView,
      initialize: function(options) {
        this.ui_state = options.ui_state;
      },
      filter: function(child, index, collection) {
        return child.get('id') != this.ui_state.get('viewing').id;
      },
    });

    Fruum.views.MoveView = Marionette.LayoutView.extend({
      template: '#fruum-template-move',
      regions: {
        list: '.fruum-js-move-entries',
      },
      ui: {
        close: '.fruum-js-close',
      },
      events: {
        'click @ui.close': 'onClose',
      },
      initialize: function(options) {
        _.bindAll(this, 'onKey');
        this.ui_state = options.model;
        this.all_categories = options.all_categories;
        this.listenTo(Fruum.io, 'fruum:show_move', this.show);
      },
      onChildviewSelectCategory: function(event) {
        if (!this.move_document) return;
        if (confirm(Messages.move)) {
          Fruum.io.trigger('fruum:move', {
            id: this.move_document.id,
            category: event.model.get('id'),
          });
          this.onClose();
        }
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
      onKey: function(event) {
        if (event.which == 27) this.onClose();
      },
      onRender: function() {
        this.el_container = this.$el.parent();
        this.showChildView('list', new Fruum.views.MoveCollectionView({
          ui_state: this.ui_state,
          collection: this.all_categories,
        }));
      },
      show: function(document) {
        if (!document) return;
        this.move_document = document;
        this.render();
        if (!this.el_container.hasClass('fruum-nodisplay')) return;
        this.el_container.removeClass('fruum-nodisplay');
        $(document).on('keydown', this.onKey);
        Fruum.io.trigger('fruum:categories', {});
      },
      templateHelpers: function() {
        return {
          move_document: this.move_document,
        };
      },
    });
  });
})();
