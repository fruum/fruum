/******************************************************************************
 View
*******************************************************************************/

'use strict';

var _ = require('underscore'),
    logger = require('../logger');

module.exports = function(options, instance, self) {
  var cache = self.cache,
      storage = self.storage;

  // --------------------------------- VIEW ------------------------------------

  function process_view(app_id, user, id, response) {
    if (!user.get('socket')) return;
    user.set('viewing', id);
    user.get('socket').emit('fruum:view', response);
    //store previous values
    var prev_channel_id = user.get('channel_id'),
        prev_channel_parent = user.get('channel_parent');
    //check for viewing channel
    if (!user.get('anonymous') &&
        response.breadcrumb.length > 1 &&
        response.breadcrumb[response.breadcrumb.length - 1].type === 'channel'
      )
    {
      var doc_id = response.breadcrumb[response.breadcrumb.length - 1].id;
      var parent_id = response.breadcrumb[response.breadcrumb.length - 2].id;
      var online = {};
      online[doc_id] = self.countNormalUsers(app_id, doc_id);
      self.broadcastRaw(
        app_id, parent_id,
        'fruum:online', online
      );
      user.set({
        channel_id: doc_id,
        channel_parent: parent_id
      });
    }
    else {
      user.set({
        channel_id: '',
        channel_parent: ''
      });
    }
    //check for user leaving the channel
    if (prev_channel_id && prev_channel_parent) {
      var online = {};
      online[prev_channel_id] = self.countNormalUsers(app_id, prev_channel_id);
      self.broadcastRaw(
        app_id, prev_channel_parent,
        'fruum:online', online
      );
    }
  }

  self.robot = function(app_id, doc_id, callback) {
    var response = {
      parent: {},
      documents: []
    };
    storage.get(app_id, doc_id, function(viewing_doc) {
      if (viewing_doc && viewing_doc.isSearchable() && viewing_doc.get('type') != 'post') {
        response.parent = viewing_doc.toRobot();
        //get children
        storage.children(app_id, viewing_doc, function(children_docs) {
          _.each(children_docs, function(document) {
            if (document.isSearchable())
            {
              response.documents.push(document.toRobot());
            }
          });
          callback(response);
        });
      }
      else {
        callback(response);
      }
    });
  }

  self.view = function(socket, payload) {
    if (!self.validatePayloadID(null, payload, 'view')) return;
    var id = payload.id,
        app_id = socket.app_id,
        user = socket.fruum_user;
    if (user) {
      self.getCachedResponse(app_id, user, id,
        //cache hit
        function(data) {
          process_view(app_id, user, id, data);
        },
        //cache miss
        function() {
          var is_admin = user.get('admin');
          var response = {
            id: id,
            breadcrumb: [],
            documents: [],
            online: {}
          };
          storage.get(app_id, id, function(viewing_doc) {
            if (viewing_doc && !viewing_doc.get('archived')) {
              //get breadcrumb
              storage.mget(app_id, viewing_doc.get('breadcrumb'), function(breadcrumb) {
                //get children
                storage.children(app_id, viewing_doc, function(children_docs) {
                  _.each(children_docs, function(document) {
                    if (is_admin || document.get('visible')) {
                      if (document.get('inappropriate')) document.set('body', '');
                      response.documents.push(document.toJSON());
                      if (document.get('type') == 'channel') {
                        var doc_id = document.get('id');
                        response.online[doc_id] = self.countNormalUsers(app_id, doc_id);
                      }
                    }
                  });
                  //populate breadcrumb
                  var has_private = false;
                  _.each(viewing_doc.get('breadcrumb'), function(key) {
                    if (breadcrumb[key]) {
                      if (!breadcrumb[key].get('visible')) has_private = true;
                      response.breadcrumb.push(breadcrumb[key].toJSON());
                    }
                  });
                  //add self as last entry in the breadcrumb
                  response.breadcrumb.push(viewing_doc.toJSON());
                  //check permissions
                  if (has_private && !is_admin) {
                    //reset response
                    response = {
                      id: id,
                      breadcrumb: [],
                      documents: [],
                      online: {}
                    };
                  }
                  self.cacheResponse(app_id, user, id, response);
                  process_view(app_id, user, id, response);
                });
              });
            }
            else socket.emit('fruum:view');
          });
        }
      );
    }
    else {
      logger.system('view: No user found');
      socket.disconnect();
    }
  }
}
