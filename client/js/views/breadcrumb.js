/******************************************************************************
Breadcrumb view
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
    Fruum.views.BreadcrumbView = Marionette.ItemView.extend({
      template: '#fruum-template-breadcrumb',
      ui: {
        navigate: '.fruum-js-navigate',
        close_search: '.fruum-js-search-close',
        manageopen: '.fruum-manage-settings',
        manage: '.fruum-manage',
        edit: '[data-action="edit"]',
        visible: '[data-action="visible"]',
        allow_threads: '[data-action="allow_threads"]',
        allow_channels: '[data-action="allow_channels"]'
      },
      modelEvents: {
        'change:viewing change:searching': 'render'
      },
      events: {
        'click @ui.close_search': 'onCloseSearch',
        'click @ui.navigate': 'onNavigate',
        'click @ui.manageopen': 'onManage',
        'click @ui.manage': 'onManage',
        'click @ui.edit': 'onEdit',
        'click @ui.allow_threads': 'onAllowThreads',
        'click @ui.allow_channels': 'onAllowChannels',
        'click @ui.visible': 'onVisible'
      },
      onNavigate: function(event) {
        event.preventDefault();
        Fruum.io.trigger('fruum:view', { id: $(event.target).closest('[data-id]').data('id') });
      },
      onCloseSearch: function(event) {
        event.preventDefault();
        Fruum.io.trigger('fruum:clear_search');
      },
      onManage: function(event) {
        Fruum.io.trigger('fruum:toggle_manage', this.ui.manage);
      },
      onAllowThreads: function(event) {
        event.preventDefault();
        var viewing = this.model.get('viewing');
        if (viewing.id) {
          Fruum.io.trigger('fruum:field', {
            id: viewing.id,
            field: 'allow_threads',
            value: !viewing.allow_threads
          });
        }
      },
      onAllowChannels: function(event) {
        event.preventDefault();
        var viewing = this.model.get('viewing');
        if (viewing.id) {
          Fruum.io.trigger('fruum:field', {
            id: viewing.id,
            field: 'allow_channels',
            value: !viewing.allow_channels
          });
        }
      },
      onVisible: function(event) {
        event.preventDefault();
        var viewing = this.model.get('viewing');
        if (viewing.id) {
          Fruum.io.trigger('fruum:field', {
            id: viewing.id,
            field: 'visible',
            value: !viewing.visible
          });
        }
      },
      onEdit: function(event) {
        event.preventDefault();
        Fruum.io.trigger('fruum:edit', _.clone(this.model.get('viewing')));
      }
    });
  });
})();
