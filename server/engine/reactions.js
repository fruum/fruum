/******************************************************************************
 User reactions (e.g. like, unlike)
*******************************************************************************/

'use strict';

var _ = require('underscore'),
    logger = require('../logger'),
    valid_reactions = ['up', 'down'];

module.exports = function(options, instance, self) {
  var storage = self.storage,
      plugins = self.plugins;

  // -------------------------------- REPORT -----------------------------------

  self.react = function(socket, payload) {
    if (!self.validatePayloadID(socket, payload, 'react')) {
      self.fail(payload);
      return;
    }
    var app_id = socket.app_id,
        id = payload.id,
        reaction = payload.reaction || '',
        user = socket.fruum_user;

    if (user.get('anonymous')) {
      logger.error(app_id, 'react_anonymous_noperm', user);
      socket.emit('fruum:react');
      self.fail(payload);
      return;
    }
    storage.get(app_id, id, function(document) {
      if (!document) {
        logger.error(app_id, 'react_invalid_doc', '' + id);
        socket.emit('fruum:react');
        self.fail(payload);
        return;
      }
      //process plugins
      var plugin_payload = {
        app_id: app_id,
        document: document,
        reaction: reaction,
        user: user
      };
      plugins.beforeReact(plugin_payload, function(err, plugin_payload) {
        document = plugin_payload.document || document;
        if (plugin_payload.storage_noop) {
          socket.emit('fruum:react', document.toJSON());
          self.success(payload);
          return;
        }
        logger.info(app_id, 'update_reaction_' + reaction + ':' + document.get('id'), user);
        //success
        var username = user.get('username'),
            attributes = {},
            reaction_list = document.get('react_' + reaction),
            has_reaction = false,
            balance = 0;

        if (reaction_list && reaction_list.indexOf(username) >= 0) {
          has_reaction = true;
        }
        //remove from previous reactions
        _.each(valid_reactions, function(entry) {
          var field = 'react_' + entry,
              list = document.get(field);
          if (!list) return;
          var len = list.length;
          list = _.without(list, username);
          if (len != list.length) balance--;
          if (entry === reaction && !has_reaction) {
            list.push(username);
            balance++;
          }
          document.set(field, list);
          attributes[field] = list;
        });
        storage.update(app_id, document, attributes, function(updated_doc) {
          if (updated_doc) {
            self.invalidateDocument(app_id, updated_doc);
            socket.emit('fruum:react', updated_doc.toJSON());
            self.broadcast(user, updated_doc);
            plugin_payload.document = updated_doc;
            plugin_payload.balance = balance;
            plugins.afterReact(plugin_payload, function() {
              self.success(payload);
            });
          }
          else {
            socket.emit('fruum:react');
            self.fail(payload);
          }
        });
      });
    });
  }
}
