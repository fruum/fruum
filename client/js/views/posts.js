/******************************************************************************
Posts view
*******************************************************************************/

/* globals Fruum */

(function() {
  'use strict';
  window.Fruum.require.push(function() {
    Fruum.views = Fruum.views || {};

    var $ = Fruum.libs.$,
        Marionette = Fruum.libs.Marionette,
        Messages = Fruum.messages,
        TRANSITION = Fruum.utils.marionette_itemview_transition;

    Fruum.views.PostView = TRANSITION(Marionette.ItemView.extend({
      ui: {
        react: '[data-action="react"]',
        edit: '[data-action="edit"]',
        report: '[data-action="report"]',
        inappropriate: '[data-action="inappropriate"]',
        delete: '[data-action="delete"]',
        share: '[data-action="share"]',
        more_source: '.fruum-js-more-source',
        more_target: '.fruum-js-more-target',
        profile: '.fruum-js-profile',
        links: 'a[href]',
      },
      modelEvents: {
        'change': 'render',
      },
      events: {
        'click @ui.more_source': 'onMore',
        'click @ui.react': 'onReact',
        'click @ui.edit': 'onEdit',
        'click @ui.report': 'onReport',
        'click @ui.inappropriate': 'onInappropriate',
        'click @ui.delete': 'onDelete',
        'click @ui.share': 'onShare',
        'click @ui.profile': 'onProfile',
        'click @ui.links': 'onLink',
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
      onProfile: function(event) {
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }
        Fruum.io.trigger('fruum:profile', {
          id: this.model.get('user_id'),
          username: this.model.get('user_username'),
        });
      },
      onMore: function(event) {
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }
        this.ui.more_source.addClass('fruum-nodisplay');
        this.ui.more_target.removeClass('fruum-nodisplay');
      },
      onEdit: function(event) {
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }
        Fruum.io.trigger('fruum:edit', this.model.toJSON());
      },
      onReact: function(event) {
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }
        var reaction = $(event.target).closest('[data-reaction]').data('reaction');
        if (Fruum.user.anonymous || !reaction) return;
        Fruum.io.trigger('fruum:react', { id: this.model.get('id'), reaction: reaction });
      },
      onInappropriate: function(event) {
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }
        Fruum.io.trigger('fruum:field', {
          id: this.model.get('id'),
          field: 'inappropriate',
          value: !this.model.get('inappropriate'),
        });
      },
      onShare: function(event) {
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }
        var post_index = this.model.collection.models.indexOf(this.model) + 1;
        Fruum.io.trigger('fruum:share', $(event.target), post_index);
      },
      onDelete: function(event) {
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }
        Fruum.io.trigger('fruum:archive', { id: this.model.get('id') });
      },
      onReport: function(event) {
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }
        if (confirm(Messages.report)) {
          Fruum.io.trigger('fruum:report', { id: this.model.get('id') });
        }
      },
      onLink: function(event) {
        var href = $(event.target).attr('href') || '';
        // relative link
        if (href.indexOf('#fruum:') == 0) {
          event.preventDefault();
          event.stopPropagation();
          href = href.replace('#fruum:', '');
          Fruum.api.open(href);
        } else if (href.indexOf(Fruum.utils.permaLink('')) == 0) {
          // absolute forum link
          Fruum.api.open(href.replace(Fruum.utils.permaLink(''), ''));
        } else if (href.toLowerCase().indexOf('http://') == 0 ||
                   href.toLowerCase().indexOf('https://') == 0
        ) {
          // external link
          event.preventDefault();
          event.stopPropagation();
          window.open(href, '_blank');
        }
      },
    }));

    Fruum.views.PostEmptyView = TRANSITION(Marionette.ItemView.extend({
      template: '#fruum-template-persona',
      initialize: function(options) {
        this.viewing = options.viewing;
        if (this.viewing.type == 'channel') {
          this.__delay_transition = 1000;
        }
      },
      templateHelpers: function() {
        return Fruum.utils.personaSays({
          permission: Fruum.user.anonymous ? 'read' : 'write',
          action: 'empty_' + this.viewing.type,
          categoryname: this.viewing.header,
        });
      },
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
            previous_created: prev_model.get('created'),
          };
        } else {
          return {
            child_index: index,
            viewing: this.ui_state.get('viewing'),
            previous_user_id: '',
            previous_created: 0,
          };
        }
      },
    });
  });
})();
