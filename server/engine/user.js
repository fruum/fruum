/******************************************************************************
 User management
*******************************************************************************/

'use strict';

var logger = require('../logger');

module.exports = function(options, instance, self) {
  var storage = self.storage;

  // ------------------------------- BLOCK/UNBLOCK USER -------------------------------

  self.block_user = function(socket, payload) {
    if (!self.validatePayloadID(socket, payload, 'block_user')) {
      self.fail(payload);
      return;
    }
    var app_id = socket.app_id,
        user = socket.fruum_user;
    if (!user.get('admin')) {
      logger.error(app_id, 'block_user_noperm', user);
      socket.emit('fruum:user:block');
      self.fail(payload);
      return;
    }
    storage.get_user(app_id, payload.id, function(blocked_user) {
      if (blocked_user) {
        blocked_user.set('blocked', true);
        storage.update_user(app_id, blocked_user, { blocked: true }, function(updated_user) {
          if (updated_user) {
            logger.info(app_id, 'block_user', updated_user);
            socket.emit('fruum:user:block', payload);
            self.success(payload);
          } else {
            logger.error(app_id, 'block_user_update_failed', blocked_user);
            socket.emit('fruum:user:block');
            self.fail(payload);
          }
        });
      } else {
        logger.error(app_id, 'block_user_id_not_found', payload.id);
        socket.emit('fruum:user:block');
        self.fail(payload);
      }
    });
  };

  self.unblock_user = function(socket, payload) {
    if (!self.validatePayloadID(socket, payload, 'unblock_user')) {
      self.fail(payload);
      return;
    }
    var app_id = socket.app_id,
        user = socket.fruum_user;
    if (!user.get('admin')) {
      logger.error(app_id, 'unblock_user_noperm', user);
      socket.emit('fruum:user:unblock');
      self.fail(payload);
      return;
    }
    storage.get_user(app_id, payload.id, function(blocked_user) {
      if (blocked_user) {
        blocked_user.set('blocked', false);
        storage.update_user(app_id, blocked_user, { blocked: false }, function(updated_user) {
          if (updated_user) {
            logger.info(app_id, 'unblock_user', updated_user);
            socket.emit('fruum:user:unblock', payload);
            self.success(payload);
          } else {
            logger.error(app_id, 'unblock_user_update_failed', blocked_user);
            socket.emit('fruum:user:unblock');
            self.fail(payload);
          }
        });
      } else {
        logger.error(app_id, 'unblock_user_id_not_found', payload.id);
        socket.emit('fruum:user:unblock');
        self.fail(payload);
      }
    });
  };
};
