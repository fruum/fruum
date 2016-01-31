/******************************************************************************
 Watch
*******************************************************************************/

'use strict';

var _ = require('underscore'),
    logger = require('../logger');

module.exports = function(options, instance, self) {
  var storage = self.storage,
      plugins = self.plugins;

  // -------------------------------- WATCH ------------------------------------

  self.watch = function(socket, payload) {
    if (!self.validatePayloadID(socket, payload, 'watch')) {
      self.fail(payload);
      return;
    }
    var app_id = socket.app_id,
        id = payload.id,
        user = socket.fruum_user;

    if (user.get('anonymous')) {
      logger.error(app_id, 'watch_anonymous_noperm', user);
      socket.emit('fruum:watch');
      self.fail(payload);
      return;
    }
    storage.get(app_id, id, function(document) {
      if (!document) {
        logger.error(app_id, 'watch_invalid_doc', '' + id);
        socket.emit('fruum:watch');
        self.fail(payload);
        return;
      }
      //process plugins
      var plugin_payload = {
        app_id: app_id,
        document: document,
        user: user
      };
      plugins.beforeWatch(plugin_payload, function(err, plugin_payload) {
        document = plugin_payload.document || document;
        if (plugin_payload.storage_noop) {
          socket.emit('fruum:watch', document.toJSON());
          self.success(payload);
          return;
        }
        storage.watch(app_id, document, user, function() {
          socket.emit('fruum:watch', document.toJSON());
          plugin_payload.document = document;
          plugins.afterWatch(plugin_payload, function() {
            self.success(payload);
          });
        });
      });
    });
  }

  self.unwatch = function(socket, payload) {
    if (!self.validatePayloadID(socket, payload, 'unwatch')) {
      self.fail(payload);
      return;
    }
    var app_id = socket.app_id,
        id = payload.id,
        user = socket.fruum_user;

    if (user.get('anonymous')) {
      logger.error(app_id, 'unwatch_anonymous_noperm', user);
      socket.emit('fruum:unwatch');
      self.fail(payload);
      return;
    }
    storage.get(app_id, id, function(document) {
      if (!document) {
        logger.error(app_id, 'unwatch_invalid_doc', '' + id);
        socket.emit('fruum:unwatch');
        self.fail(payload);
        return;
      }
      //process plugins
      var plugin_payload = {
        app_id: app_id,
        document: document,
        user: user
      };
      plugins.beforeUnwatch(plugin_payload, function(err, plugin_payload) {
        document = plugin_payload.document || document;
        if (plugin_payload.storage_noop) {
          socket.emit('fruum:unwatch', document.toJSON());
          self.success(payload);
          return;
        }
        storage.unwatch(app_id, document, user, function() {
          socket.emit('fruum:unwatch', document.toJSON());
          plugin_payload.document = document;
          plugins.afterUnwatch(plugin_payload, function() {
            self.success(payload);
          });
        });
      });
    });
  }
}
