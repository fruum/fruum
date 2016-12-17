/******************************************************************************
 Document deletion/archive/restore
*******************************************************************************/

'use strict';

var validators = require('./validator'),
    logger = require('../../../logger');

module.exports = function(options, client, self) {
  // --------------------------------- DELETE ----------------------------------

  self.delete = function(app_id, document, callback) {
    self.bulk_delete(
      app_id,
      document.get('id'), // q
      ['id', 'parent', 'breadcrumb'], // fields
      validators.id, // validator function
      function() {
        logger.info(app_id, 'delete', document);
        callback(document);
      }
    );
  };

  // --------------------------------- ARCHIVE ----------------------------------

  self.archive = function(app_id, document, callback) {
    self.bulk_update(
      app_id,
      document.get('id'), // q
      ['id', 'parent', 'breadcrumb'], // fields
      { archived: true, archived_ts: Date.now() }, // attributes to change
      validators.id, // validator function
      function() {
        logger.info(app_id, 'archive', document);
        callback(document);
      }
    );
  };

  // -------------------------------- RESTORE ----------------------------------

  self.restore = function(app_id, document, callback) {
    self.bulk_update(
      app_id,
      document.get('id'), // q
      ['id', 'parent', 'breadcrumb'], // fields
      { archived: false }, // attributes to change
      validators.id, // validator function
      function() {
        logger.info(app_id, 'restore', document);
        callback(document);
      }
    );
  };
};
