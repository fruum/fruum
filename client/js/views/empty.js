/******************************************************************************
Handles empty categories
*******************************************************************************/

(function() {
  'use strict';
  window.Fruum.require.push(function () {
    Fruum.views = Fruum.views || {};

    var $ = Fruum.libs.$,
        _ = Fruum.libs._,
        Backbone = Fruum.libs.Backbone,
        Marionette = Fruum.libs.Marionette,
        TRANSITION = Fruum.utils.marionette_itemview_transition;

    Fruum.views.EmptyView = TRANSITION(Marionette.ItemView.extend({
      ui: {
        navigate: '[data-navigate]'
      },
      events: {
        'click @ui.navigate': 'onNavigate'
      },
      modelEvents: {
        'change:viewing change:load_state change:view_req': 'render'
      },
      onNavigate: function(event) {
        if (event) {
          event.preventDefault();
          event.stopPropagation();
          var link = $(event.target).closest('[data-navigate]').data('navigate');
          if (link) {
            Fruum.io.trigger('fruum:view', { id: link });
          }
        }
      },
      getTemplate: function() {
        var load_state = this.model.get('load_state'),
            view_req = this.model.get('view_req'),
            viewing = this.model.get('viewing');
        if (load_state == 'not_found' || viewing.type == 'category') {
          return '#fruum-template-persona-fullpage';
        }
        else {
          return '#fruum-template-persona';
        }
      },
      templateHelpers: function() {
        var viewing = this.model.get('viewing'),
            load_state = this.model.get('load_state'),
            view_req = this.model.get('view_req'),
            action = '',
            permission = 'read';

        //find action
        if (load_state == 'not_found') {
          if (view_req == 'home') action = 'private_forum';
          else action = 'not_found';
        }
        else if (viewing.id === 'home') {
          action = 'empty_home';
        }
        else if (viewing.type == 'category') {
          action = 'empty_category';
          switch(viewing.usage) {
            case 0:
              action += '_thread';
              break;
            case 1:
              action += '_article';
              break;
            case 2:
              action += '_blog';
              break;
            case 3:
              action += '_channel';
              break;
          }
        }
        else {
          action = 'empty_' + viewing.type;
        }

        if (Fruum.user.administrator) {
          //admin has always write permission
          permission = 'write';
        }
        else if (!Fruum.user.anonymous) {
          //logged in
          if (viewing.type == 'category' && (viewing.usage == 0 || viewing.usage == 3))
            permission = 'write';
        }

        return Fruum.utils.personaSays({
          permission: permission,
          action: action,
          categoryname: viewing.header
        });
      }
    }));
  });
})();
