/******************************************************************************
 Archive
*******************************************************************************/

'use strict';

var _ = require('underscore'),
    logger = require('../logger');

module.exports = function(options, instance, self) {
  var cache = self.cache,
      storage = self.storage,
      plugins = self.plugins;

  // -------------------------------- DELETE -----------------------------------

  self.delete = function(socket, payload) {
    if (!self._validate_payload_id(socket, payload, 'delete')) return;
    var app_id = socket.app_id,
        id = payload.id,
        user = socket.fruum_user;
    if (!user.get('admin')) {
      logger.error(app_id, 'delete_noperm', user);
      socket.emit('fruum:delete');
      return;
    }
    storage.get(app_id, id, function(document) {
      if (!document) {
        logger.error(app_id, 'delete_invalid_doc', '' + id);
        socket.emit('fruum:delete');
        return;
      }
      //process plugins
      var plugin_payload = {
        app_id: app_id,
        document: document,
        user: user
      };
      plugins.delete(plugin_payload, function(err, plugin_payload) {
        document = plugin_payload.document || document;
        if (plugin_payload.storage_noop) {
          socket.emit('fruum:delete', document.toJSON());
          if (!plugin_payload.broadcast_noop) self._broadcast(user, document, 'fruum:delete');
          return;
        }
        storage.delete(app_id, document, function() {
          cache.invalidate_document(app_id, document);
          socket.emit('fruum:delete', document.toJSON());
          if (!plugin_payload.broadcast_noop) self._broadcast(user, document, 'fruum:delete');
        });
      });
    });
  }

  // -------------------------------- ARCHIVE -----------------------------------

  self.archive = function(socket, payload) {
    if (!self._validate_payload_id(socket, payload, 'archive')) return;
    var app_id = socket.app_id,
        id = payload.id,
        user = socket.fruum_user;
    if (!user.get('admin')) {
      logger.error(app_id, 'archive_noperm', user);
      socket.emit('fruum:archive');
      return;
    }
    storage.get(app_id, id, function(document) {
      if (!document) {
        logger.error(app_id, 'archive_invalid_doc', '' + id);
        socket.emit('fruum:archive');
        return;
      }
      //process plugins
      var plugin_payload = {
        app_id: app_id,
        document: document,
        user: user
      };
      plugins.archive(plugin_payload, function(err, plugin_payload) {
        document = plugin_payload.document || document;
        if (plugin_payload.storage_noop) {
          socket.emit('fruum:archive', document.toJSON());
          if (!plugin_payload.broadcast_noop) self._broadcast(user, document, 'fruum:archive');
          return;
        }
        storage.archive(app_id, document, function() {
          cache.invalidate_document(app_id, document);
          socket.emit('fruum:archive', document.toJSON());
          if (!plugin_payload.broadcast_noop) self._broadcast(user, document, 'fruum:archive');
        });
      });
    });
  }

  // ------------------------------- RESTORE -----------------------------------

  self.restore = function(socket, payload) {
    if (!self._validate_payload_id(socket, payload, 'restore')) return;
    var app_id = socket.app_id,
        id = payload.id,
        user = socket.fruum_user;
    if (!user.get('admin')) {
      logger.error(app_id, 'restore_noperm', user);
      socket.emit('fruum:restore');
      return;
    }
    storage.get(app_id, id, function(document) {
      if (!document) {
        logger.error(app_id, 'restore_invalid_doc', '' + id);
        socket.emit('fruum:restore');
        return;
      }
      //process plugins
      var plugin_payload = {
        app_id: app_id,
        document: document,
        user: user
      };
      plugins.restore(plugin_payload, function(err, plugin_payload) {
        document = plugin_payload.document || document;
        if (plugin_payload.storage_noop) {
          socket.emit('fruum:restore', document.toJSON());
          if (!plugin_payload.broadcast_noop) self._broadcast(user, document, 'fruum:restore');
          return;
        }
        storage.restore(app_id, document, function() {
          cache.invalidate_document(app_id, document);
          socket.emit('fruum:restore', document.toJSON());
          if (!plugin_payload.broadcast_noop) self._broadcast(user, document, 'fruum:restore');
        });
      });
    });
  }
}
