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
      socket.disconnect();
      return;
    }
    var app_id = socket.app_id,
        user = socket.fruum_user,
        is_admin = user.get('admin');
    storage.search(socket.app_id, payload.q, function(results) {
      var response = [];
      _.each(results, function(document) {
        if (is_admin || document.get('visible'))
          response.push(document.toJSON());
      });
      socket.emit('fruum:search', {
        q: payload.q,
        results: response
      });
    });
  }
}
