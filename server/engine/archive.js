/******************************************************************************
 Archive
*******************************************************************************/

'use strict';

var _ = require('underscore'),
    logger = require('../logger');

module.exports = function(options, instance, self) {
  var engine = instance.engine,
      storage = self.storage,
      plugins = self.plugins;

  // -------------------------------- DELETE -----------------------------------

  self.delete = function(socket, payload) {
    if (!self.validatePayloadID(socket, payload, 'delete')) {
      self.fail(payload);
      return;
    }
    var app_id = socket.app_id,
        id = payload.id,
        user = socket.fruum_user;
    if (!user.get('admin')) {
      logger.error(app_id, 'delete_noperm', user);
      socket.emit('fruum:delete');
      self.fail(payload);
      return;
    }
    storage.get(app_id, id, function(document) {
      if (!document) {
        logger.error(app_id, 'delete_invalid_doc', '' + id);
        socket.emit('fruum:delete');
        self.fail(payload);
        return;
      }
      //process plugins
      var plugin_payload = {
        app_id: app_id,
        document: document,
        user: user
      };
      plugins.beforeDelete(plugin_payload, function(err, plugin_payload) {
        document = plugin_payload.document || document;
        if (plugin_payload.storage_noop) {
          socket.emit('fruum:delete', document.toJSON());
          if (!plugin_payload.broadcast_noop) self.broadcast(user, document, 'fruum:delete');
          self.success(payload);
          return;
        }
        storage.delete(app_id, document, function() {
          self.refreshChildrenCount(app_id, document.get('parent'));
          self.invalidateDocument(app_id, document);
          socket.emit('fruum:delete', document.toJSON());
          if (!plugin_payload.broadcast_noop) self.broadcast(user, document, 'fruum:delete');
          plugin_payload.document = document;
          plugins.afterDelete(plugin_payload, function() {
            self.success(payload);
          });
        });
      });
    });
  }

  // -------------------------------- ARCHIVE -----------------------------------

  self.archive = function(socket, payload) {
    if (!self.validatePayloadID(socket, payload, 'archive')) {
      self.fail(payload);
      return;
    }
    var app_id = socket.app_id,
        id = payload.id,
        user = socket.fruum_user;
    if (!user.get('admin')) {
      logger.error(app_id, 'archive_noperm', user);
      socket.emit('fruum:archive');
      self.fail(payload);
      return;
    }
    storage.get(app_id, id, function(document) {
      if (!document) {
        logger.error(app_id, 'archive_invalid_doc', '' + id);
        socket.emit('fruum:archive');
        self.fail(payload);
        return;
      }
      //process plugins
      var plugin_payload = {
        app_id: app_id,
        document: document,
        user: user
      };
      plugins.beforeArchive(plugin_payload, function(err, plugin_payload) {
        document = plugin_payload.document || document;
        if (plugin_payload.storage_noop) {
          socket.emit('fruum:archive', document.toJSON());
          if (!plugin_payload.broadcast_noop) self.broadcast(user, document, 'fruum:archive');
          self.success(payload);
          return;
        }
        storage.archive(app_id, document, function() {
          self.refreshChildrenCount(app_id, document.get('parent'));
          self.invalidateDocument(app_id, document);
          socket.emit('fruum:archive', document.toJSON());
          if (!plugin_payload.broadcast_noop) self.broadcast(user, document, 'fruum:archive');
          plugin_payload.document = document;
          plugins.afterArchive(plugin_payload, function() {
            self.success(payload);
          });
        });
      });
    });
  }

  // ------------------------------- RESTORE -----------------------------------

  self.restore = function(socket, payload) {
    if (!self.validatePayloadID(socket, payload, 'restore')) {
      self.fail(payload);
      return;
    }
    var app_id = socket.app_id,
        id = payload.id,
        user = socket.fruum_user;
    if (!user.get('admin')) {
      logger.error(app_id, 'restore_noperm', user);
      socket.emit('fruum:restore');
      self.fail(payload);
      return;
    }
    storage.get(app_id, id, function(document) {
      if (!document) {
        logger.error(app_id, 'restore_invalid_doc', '' + id);
        socket.emit('fruum:restore');
        self.fail(payload);
        return;
      }
      //process plugins
      var plugin_payload = {
        app_id: app_id,
        document: document,
        user: user
      };
      plugins.beforeRestore(plugin_payload, function(err, plugin_payload) {
        document = plugin_payload.document || document;
        if (plugin_payload.storage_noop) {
          socket.emit('fruum:restore', document.toJSON());
          if (!plugin_payload.broadcast_noop) self.broadcast(user, document, 'fruum:restore');
          self.success(payload);
          return;
        }
        storage.restore(app_id, document, function() {
          self.refreshChildrenCount(app_id, document.get('parent'));
          self.invalidateDocument(app_id, document);
          socket.emit('fruum:restore', document.toJSON());
          if (!plugin_payload.broadcast_noop) self.broadcast(user, document, 'fruum:restore');
          plugin_payload.document = document;
          plugins.afterRestore(plugin_payload, function() {
            self.success(payload);
          });
        });
      });
    });
  }
}
