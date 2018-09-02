/******************************************************************************
 Search
*******************************************************************************/

'use strict';

var _ = require('underscore'),
    logger = require('../logger');

module.exports = function(options, instance, self) {
  var storage = self.storage;

  // -------------------------------- SEARCH -----------------------------------

  self.search = function(socket, payload) {
    if (!payload.q) {
      logger.error(socket.app_id, 'Missing search query', payload);
      socket.emit('fruum:search');
      self.fail(payload);
      return;
    }
    var user = socket.fruum_user,
        is_admin = user.get('admin');

    storage.search(socket.app_id, {
      text: payload.q,
      include_hidden: is_admin,
      permission: user.get('permission'),
    }, function(results) {
      var response = [];
      _.each(results, function(document) {
        if (is_admin || document.get('visible')) {
          response.push(document.toJSON());
        }
      });
      socket.emit('fruum:search', {
        q: payload.q,
        results: response,
      });
      self.success(payload);
    }, {
      skipfields: ['attachments'],
    });
  };

  // -------------------------------- AUTOCOMPLETE -----------------------------

  self.autocomplete = function(socket, payload) {
    if (!payload.q) {
      logger.error(socket.app_id, 'Missing autocomplete query', payload);
      socket.emit('fruum:autocomplete');
      self.fail(payload);
      return;
    }
    storage.search_users(socket.app_id, payload.q, function(users) {
      var response = [];
      _.each(users, function(user) {
        // do not autocomplete users without karma
        if (user.get('karma') <= 0) return;
        // add user to response
        response.push({
          username: user.get('username'),
          displayname: user.get('displayname'),
          avatar: user.get('avatar'),
        });
      });
      socket.emit('fruum:autocomplete', {
        q: payload.q,
        results: response,
      });
      self.success(payload);
    });
  };
};
