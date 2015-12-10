/******************************************************************************
 User reactions (e.g. like, unlike)
*******************************************************************************/

'use strict';

var _ = require('underscore'),
    logger = require('../logger');

module.exports = function(options, instance, self) {
  var storage = self.storage,
      plugins = self.plugins;

  // -------------------------------- REPORT -----------------------------------

  self.react = function(socket, payload) {
    if (!self.validatePayloadID(socket, payload, 'react')) return;
    var app_id = socket.app_id,
        id = payload.id,
        reaction = payload.reaction || '',
        user = socket.fruum_user;

    if (user.get('anonymous')) {
      logger.error(app_id, 'react_anonymous_noperm', user);
      socket.emit('fruum:react');
      return;
    }
    storage.get(app_id, id, function(document) {
      if (!document) {
        logger.error(app_id, 'react_invalid_doc', '' + id);
        socket.emit('fruum:react');
        return;
      }
      //process plugins
      var plugin_payload = {
        app_id: app_id,
        document: document,
        reaction: reaction,
        user: user
      };
      plugins.react(plugin_payload, function(err, plugin_payload) {
        document = plugin_payload.document || document;
        if (plugin_payload.storage_noop) {
          socket.emit('fruum:react', document.toJSON());
          return;
        }
        //success
        self.invalidateDocument(app_id, document);
        storage.react(app_id, document, user, reaction, function() {
          socket.emit('fruum:react', document.toJSON());
          self.broadcast(user, document);
        });
      });
    });
  }
}
