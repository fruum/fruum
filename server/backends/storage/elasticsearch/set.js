/******************************************************************************
 Document setters
*******************************************************************************/

'use strict';

var _ = require('underscore'),
    validators = require('./validator'),
    Utils = require('./util'),
    logger = require('../../../logger');

module.exports = function(options, client) {
  var utils = new Utils(options, client);

  // ---------------------------------- ADD ------------------------------------

  this.add = function(app_id, document, callback) {
    utils.slugify(app_id, document, function() {
      var parent_id = document.get('parent');
      client.create({
        index: utils.toIndex(app_id),
        type: 'doc',
        id: document.get('id'),
        body: document.toJSON()
      }, function(error, response) {
        if (error) {
          logger.error(app_id, 'add', error);
          callback();
        }
        else {
          logger.info(app_id, 'add', document);
          callback(document);
        }
      });
    });
  }

  // --------------------------------- UPDATE ----------------------------------

  this.update = function(app_id, document, attributes, callback) {
    client.update({
      index: utils.toIndex(app_id),
      type: 'doc',
      id: document.get('id'),
      retryOnConflict: options.elasticsearch.retry_on_conflict,
      body: {
        doc: attributes || document.toJSON()
      }
    }, function(error, response) {
      if (error) {
        logger.error(app_id, 'update', error);
        callback();
      }
      else {
        if (attributes) document.set(attributes);
        logger.info(app_id, 'update', document);
        callback(document);
      }
    });
  }

  // ------------------------ UPDATE DOC AND CHIDREN ---------------------------

  this.update_subtree = function(app_id, document, attributes, callback) {
    utils.bulk_update(
      app_id,
      document.get('id'), //q
      ['id', 'parent', 'breadcrumb'], //fields
      attributes, //attributes to change
      validators.id, //validator function
      function() {
        document.set(attributes);
        logger.info(app_id, 'update_subtree', document);
        callback(document);
      }
    );
  }

}
