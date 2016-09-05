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
    user.set({
      viewing: id,
      viewing_path: _.map(response.breadcrumb, function(path) {
        return path.id;
      }),
    });
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
          var is_admin = user.get('admin'),
              user_perm = user.get('permission');
          var response = {
            id: id,
            breadcrumb: [],
            documents: [],
            online: {}
          };
          storage.get(app_id, id, function(viewing_doc) {
            if (viewing_doc &&
                !viewing_doc.get('archived') &&
                (viewing_doc.get('visible') || is_admin) &&
                viewing_doc.get('permission') <= user_perm)
            {
              //get breadcrumb
              storage.mget(app_id, viewing_doc.get('breadcrumb'), function(breadcrumb) {
                function process_children(children_docs) {
                  _.each(children_docs, function(document) {
                    if ((is_admin || document.get('visible')) &&
                        document.get('permission') <= user_perm)
                    {
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
                    var entry = breadcrumb[key];
                    if (entry) {
                      if (!entry.get('visible') || entry.get('permission') > user_perm)
                        has_private = true;
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
                  //do not cache response on bookmarks
                  if (viewing_doc.get('type') != 'bookmark')
                    self.cacheResponse(app_id, user, id, response);
                  process_view(app_id, user, id, response);
                }
                //get children
                if (viewing_doc.get('type') == 'bookmark') {
                  storage.search(app_id, {
                    text: 'highlight:0 ' + viewing_doc.get('body'),
                    include_hidden: is_admin,
                    permission: user.get('permission')
                  }, process_children, { skipfields: ['attachments'] });
                }
                else {
                  //decide which fields to skip based on parent type
                  var params;
                  switch(viewing_doc.get('type')) {
                    case 'category':
                      params = { skipfields: ['attachments'] };
                      break;
                    case 'thread':
                    case 'article':
                    case 'blog':
                    case 'channel':
                      params = { skipfields: ['header', 'tags'] };
                      break;
                  }
                  storage.children(app_id, viewing_doc, process_children, params);
                }
              }, { skipfields: ['attachments', 'body', 'tags' ] });
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
