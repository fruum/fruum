/******************************************************************************
Channels view
*******************************************************************************/

/* globals Fruum */

(function() {
  'use strict';
  window.Fruum.require.push(function() {
    Fruum.views = Fruum.views || {};

    var Marionette = Fruum.libs.Marionette,
        TRANSITION = Fruum.utils.marionette_itemview_transition;

    Fruum.views.ChannelView = TRANSITION(Marionette.View.extend({
      template: '#fruum-template-channel',
      ui: {
        navigate: '.fruum-js-navigate',
        manage: '.fruum-js-manage',
        move: '[data-action="move"]',
        delete: '[data-action="delete"]',
      },
      modelEvents: {
        'change': 'render',
      },
      events: {
        'click @ui.manage': 'onManage',
        'click @ui.navigate': 'onNavigate',
        'click @ui.delete': 'onDelete',
        'click @ui.move': 'onMove',
      },
      initialize: function(options) {
        this.options = options;
      },
      templateContext: function() {
        return {
          online: this.options.online,
        };
      },
      onNavigate: function(event) {
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }
        Fruum.io.trigger('fruum:view', { id: this.model.get('id') });
      },
      onManage: function(event) {
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }
        Fruum.io.trigger('fruum:toggle_manage', this.ui.manage);
      },
      onDelete: function(event) {
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }
        Fruum.io.trigger('fruum:close_manage');
        Fruum.io.trigger('fruum:archive', { id: this.model.get('id') });
      },
      onMove: function(event) {
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }
        Fruum.io.trigger('fruum:close_manage');
        Fruum.io.trigger('fruum:show_move', this.model.toJSON());
      },
    }));

    Fruum.views.ChannelsView = Marionette.CollectionView.extend({
      childView: Fruum.views.ChannelView,
      initialize: function(options) {
        this.ui_state = options.ui_state;
      },
      childViewOptions: function(model, index) {
        return {
          online: this.ui_state.get('online'),
        };
      },
    });
  });
})();
