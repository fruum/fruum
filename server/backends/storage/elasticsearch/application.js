/******************************************************************************
 Application management
*******************************************************************************/

'use strict';

var _ = require('underscore'),
    validators = require('./validator'),
    logger = require('../../../logger'),
    Models = require('../../../models');

module.exports = function(options, client, self) {

  // ------------------------------ LIST APPS ----------------------------------

  self.list_apps = function(callback) {
    var values = [];
    client.search({
      index: self.toMasterIndex(),
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

  self.add_app = function(application, callback) {
    //update creation date
    var app_id = application.get('id');
    client.create({
      index: self.toMasterIndex(),
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
          index: self.toAppIndex(app_id)
        }, function(error, response) {
          if (error) {
            logger.error(app_id, 'add_index', error);
            callback();
          }
          else {
            //add mapping for users
            client.indices.putMapping({
              index: self.toAppIndex(app_id),
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
                    last_logout: { type: 'long' },
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
              index: self.toAppIndex(app_id),
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
                    inappropriate: { type: 'boolean' },
                    permission: { type: 'integer' },
                    usage: { type: 'integer' },
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
                  index: self.toAppIndex(app_id),
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

  self.update_app = function(application, attributes, callback) {
    var app_id = application.get('id');
    client.update({
      index: self.toMasterIndex(),
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

  self.delete_app = function(application, callback) {
    var app_id = application.get('id');
    client.delete({
      index: self.toMasterIndex(),
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
          index: self.toAppIndex(app_id)
        }, function(error, response) {
          if (error) logger.error(app_id, 'delete_index', error);
        });
      }
    });
  }

  // --------------------------------- GET APP ---------------------------------

  self.get_app = function(app_id, callback) {
    client.get({
      index: self.toMasterIndex(),
      type: 'info',
      id: app_id
    }, function(error, response) {
      if (error) {
        callback();
      }
      else if (response._source) {
        callback(new Models.Application(response._source));
      }
    });
  }

  // -------------------------- GET APP FROM API_KEY ---------------------------

  self.get_api_key = function(api_key, callback) {
    client.search({
      index: self.toMasterIndex(),
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

  // ------------------------------ RESET USERS --------------------------------

  self.reset_users = function(application, callback) {
    var app_id = application.get('id');
    client.deleteByQuery({
      index: self.toAppIndex(app_id),
      type: 'user',
      body: {
        query: {
          bool : {
            must: [{ match_all: {}}]
          }
        }
      }
    }, function(error, response) {
      if (error) {
        logger.error(app_id, 'reset_users', error);
      }
      else {
        logger.info(app_id, 'reset_users', response);
      }
      callback();
    });
  }

  // ------------------------------- PROPERTIES --------------------------------

  self.set_app_property = function(app_id, property, value, callback) {
    var doc = {};
    doc[Models.PROPERTY_PREFIX + property] = value;
    client.update({
      index: self.toMasterIndex(),
      type: 'info',
      id: app_id,
      retryOnConflict: options.elasticsearch.retry_on_conflict,
      body: {
        doc: doc
      }
    }, function(error, response) {
      if (error) {
        logger.error(app_id, 'set_app_property', error);
        callback();
      }
      else {
        callback(property, value);
      }
    });
  }

  self.get_app_property = function(app_id, property, callback) {
    client.get({
      index: self.toMasterIndex(),
      type: 'info',
      id: app_id
    }, function(error, response) {
      if (error) {
        callback();
      }
      else if (response._source && response._source[Models.PROPERTY_PREFIX + property] != undefined) {
        callback(property, response._source[Models.PROPERTY_PREFIX + property]);
      }
      else {
        callback();
      }
    });
  }

}
