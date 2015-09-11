/******************************************************************************
 Application management
*******************************************************************************/

'use strict';

var _ = require('underscore'),
    validators = require('./validator'),
    Utils = require('./util'),
    logger = require('../../../logger'),
    Models = require('../../../models');

module.exports = function(options, client) {
  var utils = new Utils(options, client);

  // ------------------------------ LIST APPS ----------------------------------

  this.list_apps = function(callback) {
    var values = [];
    client.search({
      index: 'applications',
      type: 'info',
      from: 0,
      size: options.elasticsearch.max_children,
      refresh: true
    }, function(error, response) {
      if (!error && response && response.hits && response.hits.hits) {
        _.each(response.hits.hits, function(hit) {
          if (hit._source) values.push(new Models.Application(hit._source));
        });
      }
      callback(values);
    });
  }

  // -------------------------------- ADD APP ----------------------------------

  this.add_app = function(application, callback) {
    //update creation date
    var app_id = application.get('id');
    client.create({
      index: 'applications',
      type: 'info',
      id: app_id,
      body: application.toJSON()
    }, function(error, response) {
      if (error) {
        logger.error(app_id, 'add_app', error);
        callback();
      }
      else {
        //create index
        client.indices.create({
          index: utils.toIndex(app_id)
        }, function(error, response) {
          if (error) {
            logger.error(app_id, 'add_index', error);
            callback();
          }
          else {
            //add mapping for users
            client.indices.putMapping({
              index: utils.toIndex(app_id),
              type: 'user',
              body: {
                user: {
                  properties: {
                    id: { type: 'string', index: 'not_analyzed' },
                    anonymous: { type: 'boolean' },
                    admin: { type: 'boolean' },
                    username: { type: 'string' },
                    displayname: { type: 'string' },
                    email: { type: 'string', index: 'not_analyzed' },
                    avatar: { type: 'string', index: 'not_analyzed' },
                    created: { type: 'long' },
                    last_login: { type: 'long' },
                    meta: { type: 'object', enabled: false }
                  }
                }
              }
            }, function(error, response) {
              if (error) {
                logger.error(app_id, 'put_mapping', error);
              }
            });
            //add mapping for doc
            client.indices.putMapping({
              index: utils.toIndex(app_id),
              type: 'doc',
              body: {
                doc: {
                  properties: {
                    id: { type: 'string', index: 'not_analyzed' },
                    parent: { type: 'string', index: 'not_analyzed' },
                    parent_type: { type: 'string', index: 'not_analyzed' },
                    type: { type: 'string', index: 'not_analyzed' },
                    created: { type: 'long' },
                    updated: { type: 'long' },
                    initials: { type: 'string', index: 'not_analyzed' },
                    header: { type: 'string' },
                    body: { type: 'string' },
                    sticky: { type: 'boolean' },
                    locked: { type: 'boolean' },
                    visible: { type: 'boolean' },
                    allow_threads: { type: 'boolean' },
                    allow_channels: { type: 'boolean' },
                    inappropriate: { type: 'boolean' },
                    user_id: { type: 'string', index: 'not_analyzed' },
                    user_username: { type: 'string' },
                    user_displayname: { type: 'string' },
                    user_avatar: { type: 'string', index: 'not_analyzed' },
                    order: { type: 'integer' },
                    children_count: { type: 'integer' },
                    archived: { type: 'boolean' },
                    archived_ts: { type: 'long' },
                    meta: { type: 'object', enabled: false }
                  }
                }
              }
            }, function(error, response) {
              if (error) {
                logger.error(app_id, 'put_mapping', error);
                callback();
              }
              else {
                var home_document = (new Models.Document()).toHome();
                client.create({
                  index: utils.toIndex(app_id),
                  type: 'doc',
                  id: home_document.get('id'),
                  body: home_document.toJSON()
                }, function(error, response) {
                  if (error) {
                    logger.info(app_id, 'add_app', error);
                  }
                  callback(application);
                });
              }
            });
          }
        });
      }
    });
  }

  // ------------------------------- UPDATE APP --------------------------------

  this.update_app = function(application, attributes, callback) {
    var app_id = application.get('id');
    client.update({
      index: 'applications',
      type: 'info',
      id: app_id,
      retryOnConflict: options.elasticsearch.retry_on_conflict,
      body: {
        doc: attributes || application.toJSON()
      }
    }, function(error, response) {
      if (error) {
        logger.error(app_id, 'update_app', error);
        callback();
      }
      else {
        if (attributes) application.set(attributes);
        callback(application);
      }
    });
  }

  // ------------------------------- DELETE APP --------------------------------

  this.delete_app = function(application, callback) {
    var app_id = application.get('id');
    client.delete({
      index: 'applications',
      type: 'info',
      id: app_id
    }, function(error, response) {
      if (error) {
        logger.error(app_id, 'delete_app', error);
        callback();
      }
      else {
        callback(application);
        //delete documents and users or index
        client.indices.delete({
          index: utils.toIndex(app_id)
        }, function(error, response) {
          if (error) logger.error(app_id, 'delete_index', error);
        });
      }
    });
  }

  // --------------------------------- GET APP ---------------------------------

  this.get_app = function(app_id, callback) {
    client.get({
      index: 'applications',
      type: 'info',
      id: app_id
    }, function(error, response) {
      if (error) {
        callback();
      }
      else if (response._source){
        callback(new Models.Application(response._source));
      }
    });
  }

  // -------------------------- GET APP FROM API_KEY ---------------------------

  this.get_api_key = function(api_key, callback) {
    client.search({
      index: 'applications',
      type: 'info',
      refresh: true,
      body: {
        from: 0,
        size: options.elasticsearch.max_children,
        query: {
          multi_match: {
            query: api_key,
            fields: ['api_keys']
          }
        }
      }
    }, function(error, response) {
      if (error) {
        logger.error(app_id, 'get_api_key', error);
      }
      else if (response.hits && response.hits.hits && response.hits.hits.length) {
        var application = null;
        _.each(response.hits.hits, function(hit) {
          if (hit._source.api_keys.indexOf(api_key) >= 0)
            application = new Models.Application(hit._source);
        });
        callback(application);
        return;
      }
      callback();
    });
  }
}
