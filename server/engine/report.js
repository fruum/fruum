/******************************************************************************
 Report
*******************************************************************************/

'use strict';

var _ = require('underscore'),
    logger = require('../logger');

module.exports = function(options, instance, self) {
  var storage = self.storage,
      plugins = self.plugins;

  // -------------------------------- REPORT -----------------------------------

  self.report = function(socket, payload) {
    if (!self._validate_payload_id(socket, payload, 'report')) return;
    var app_id = socket.app_id,
        id = payload.id,
        user = socket.fruum_user;

    if (user.get('anonymous')) {
      logger.error(app_id, 'report_anonymous_noperm', user);
      socket.emit('fruum:report');
      return;
    }
    storage.get(app_id, id, function(document) {
      if (!document) {
        logger.error(app_id, 'report_invalid_doc', '' + id);
        socket.emit('fruum:report');
        return;
      }
      //process plugins
      var plugin_payload = {
        app_id: app_id,
        document: document,
        user: user
      };
      plugins.report(plugin_payload, function(err, plugin_payload) {
        document = plugin_payload.document || document;
        socket.emit('fruum:report', document.toJSON());
      });
    });
  }
}
