/******************************************************************************
 Document deletion/archive/restore
*******************************************************************************/

'use strict';

var _ = require('underscore'),
    validators = require('./validator'),
    Utils = require('./util'),
    logger = require('../../../logger');

module.exports = function(options, client) {
  var utils = new Utils(options, client);

  // --------------------------------- DELETE ----------------------------------

  this.delete = function(app_id, document, callback) {
    utils.bulk_delete(
      app_id,
      document.get('id'), //q
      ['id', 'parent', 'breadcrumb'], //fields
      validators.id, //validator function
      function() {
        logger.info(app_id, 'delete', document);
        callback(document);
      }
    );
  }

  // --------------------------------- ARCHIVE ----------------------------------

  this.archive = function(app_id, document, callback) {
    utils.bulk_update(
      app_id,
      document.get('id'), //q
      ['id', 'parent', 'breadcrumb'], //fields
      { archived: true, archived_ts: Date.now() }, //attributes to change
      validators.id, //validator function
      function() {
        logger.info(app_id, 'archive', document);
        callback(document);
      }
    );
  }

  // -------------------------------- RESTORE ----------------------------------

  this.restore = function(app_id, document, callback) {
    utils.bulk_update(
      app_id,
      document.get('id'), //q
      ['id', 'parent', 'breadcrumb'], //fields
      { archived: false }, //attributes to change
      validators.id, //validator function
      function() {
        logger.info(app_id, 'restore', document);
        callback(document);
      }
    );
  }
}
