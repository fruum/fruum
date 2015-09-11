/******************************************************************************
Threads view
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
    Fruum.views.ThreadView = TRANSITION(Marionette.ItemView.extend({
      template: '#fruum-template-thread',
      ui: {
        navigate: '.fruum-js-navigate',
        manage: '.fruum-js-manage',
        sticky: '[data-action="sticky"]',
        delete: '[data-action="delete"]',
        edit: '[data-action="edit"]'
      },
      modelEvents: {
        'change': 'render'
      },
      events: {
        'click @ui.manage': 'onManage',
        'click @ui.navigate': 'onNavigate',
        'click @ui.sticky': 'onSticky',
        'click @ui.delete': 'onDelete',
        'click @ui.edit': 'onEdit'
      },
      onNavigate: function(event) {
        event.preventDefault();
        event.stopPropagation();
        Fruum.io.trigger('fruum:view', { id: this.model.get('id') });
      },
      onManage: function(event) {
        event.preventDefault();
        event.stopPropagation();
        Fruum.io.trigger('fruum:toggle_manage', this.ui.manage);
      },
      onSticky: function(event) {
        event.preventDefault();
        event.stopPropagation();
        Fruum.io.trigger('fruum:close_manage');
        Fruum.io.trigger('fruum:field', {
          id: this.model.get('id'),
          field: 'sticky',
          value: !this.model.get('sticky')
        });
      },
      onDelete: function(event) {
        event.preventDefault();
        event.stopPropagation();
        Fruum.io.trigger('fruum:close_manage');
        Fruum.io.trigger('fruum:archive', { id: this.model.get('id') });
      },
      onEdit: function(event) {
        event.preventDefault();
        event.stopPropagation();
        Fruum.io.trigger('fruum:close_manage');
        Fruum.io.trigger('fruum:edit', this.model.toJSON());
      }
    }));
    Fruum.views.ThreadsView = Marionette.CollectionView.extend({
      childView: Fruum.views.ThreadView
    });
  });
})();
