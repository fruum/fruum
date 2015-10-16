/******************************************************************************
Posts view
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
        Messages = Fruum.messages,
        TRANSITION = Fruum.utils.marionette_itemview_transition;
    //View
    Fruum.views.PostView = TRANSITION(Marionette.ItemView.extend({
      ui: {
        edit: '[data-action="edit"]',
        report: '[data-action="report"]',
        inappropriate: '[data-action="inappropriate"]',
        links: 'a[href]'
      },
      modelEvents: {
        'change': 'render'
      },
      events: {
        'click @ui.edit': 'onEdit',
        'click @ui.report': 'onReport',
        'click @ui.inappropriate': 'onInappropriate',
        'click @ui.links': 'onLink'
      },
      initialize: function(options) {
        this.template_helpers = options;
      },
      templateHelpers: function() {
        return this.template_helpers;
      },
      getTemplate: function() {
        if (this.template_helpers.viewing.type == 'channel') {
          return '#fruum-template-post-channel';
        }
        if (this.template_helpers.child_index == 0) {
          return '#fruum-template-post-master';
        }
        return '#fruum-template-post';
      },
      onEdit: function(event) {
        Fruum.io.trigger('fruum:edit', this.model.toJSON());
      },
      onInappropriate: function(event) {
        event.preventDefault();
        Fruum.io.trigger('fruum:field', {
          id: this.model.get('id'),
          field: 'inappropriate',
          value: !this.model.get('inappropriate')
        });
      },
      onReport: function(event) {
        event.preventDefault();
        if (confirm(Messages.report))
          Fruum.io.trigger('fruum:report', { id: this.model.get('id') });
      },
      onLink: function(event) {
        var href = $(event.target).attr('href') || '';
        if (href.indexOf('#fruum:') == 0) {
          event && event.preventDefault();
          href = href.replace('#fruum:', '');
          Fruum.api.open(href);
        }
        else if (href.toLowerCase().indexOf('http://') == 0 ||
                 href.toLowerCase().indexOf('https://') == 0)
       {
         event && event.preventDefault();
         window.open(href, '_blank');
       }
      }
    }));
    Fruum.views.PostEmptyView = TRANSITION(Marionette.ItemView.extend({
      initialize: function(options) {
        this.viewing = options.viewing;
        if (this.viewing.type == 'channel')
          this.__delay_transition = 1000;
      },
      getTemplate: function() {
        return '#fruum-template-post-empty-' + (this.viewing.type || 'default');
      },
      templateHelpers: function() {
        return {
          viewing: this.viewing
        }
      }
    }));
    Fruum.views.PostsView = Marionette.CollectionView.extend({
      childView: Fruum.views.PostView,
      emptyView: Fruum.views.PostEmptyView,
      initialize: function(options) {
        this.ui_state = options.ui_state;
      },
      childViewOptions: function(model, index) {
        if (index > 0) {
          var prev_model = model.collection.at(index - 1);
          return {
            child_index: index,
            viewing: this.ui_state.get('viewing'),
            previous_user_id: prev_model.get('user_id'),
            previous_created: prev_model.get('created')
          }
        }
        else {
          return {
            child_index: index,
            viewing: this.ui_state.get('viewing'),
            previous_user_id: '',
            previous_created: 0
          }
        }
      }
    });
  });
})();
