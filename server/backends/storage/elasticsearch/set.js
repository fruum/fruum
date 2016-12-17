/******************************************************************************
 Document setters
*******************************************************************************/

'use strict';

var validators = require('./validator'),
    logger = require('../../../logger');

module.exports = function(options, client, self) {
  // ---------------------------------- ADD ------------------------------------

  self.add = function(app_id, document, callback) {
    self.slugify(app_id, document, function() {
      client.create({
        index: self.toAppIndex(app_id),
        type: 'doc',
        id: document.get('id'),
        body: document.toJSON(),
      }, function(error, response) {
        if (error) {
          logger.error(app_id, 'add', error);
          callback();
        } else {
          logger.info(app_id, 'add', document);
          callback(document);
        }
      });
    });
  };

  // --------------------------------- UPDATE ----------------------------------

  self.update = function(app_id, document, attributes, callback) {
    client.update({
      index: self.toAppIndex(app_id),
      type: 'doc',
      id: document.get('id'),
      retryOnConflict: options.elasticsearch.retry_on_conflict,
      body: {
        doc: attributes || document.toJSON(),
      },
    }, function(error, response) {
      if (error) {
        logger.error(app_id, 'update', error);
        callback();
      } else {
        if (attributes) document.set(attributes);
        logger.info(app_id, 'update', document);
        callback(document);
      }
    });
  };

  // ------------------------ UPDATE DOC AND CHIDREN ---------------------------

  self.update_subtree = function(app_id, document, attributes, callback) {
    self.bulk_update(
      app_id,
      document.get('id'), // q
      ['id', 'parent', 'breadcrumb'], // fields
      attributes, // attributes to change
      validators.id, // validator function
      function() {
        document.set(attributes);
        logger.info(app_id, 'update_subtree', document);
        callback(document);
      }
    );
  };
};
