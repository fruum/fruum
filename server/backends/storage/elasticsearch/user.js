/******************************************************************************
 User management
*******************************************************************************/

'use strict';

var _ = require('underscore'),
    validators = require('./validator'),
    logger = require('../../../logger'),
    Models = require('../../../models');

module.exports = function(options, client, self) {

  // ------------------------------- ADD USER ----------------------------------

  self.add_user = function(app_id, user, callback) {
    client.create({
      index: self.toIndex(app_id),
      type: 'user',
      id: user.get('id'),
      body: user.toJSON()
    }, function(error, response) {
      if (error) {
        logger.error(app_id, 'add_user', error);
      }
      else {
        logger.info(app_id, 'add_user', user);
      }
      callback(user);
    });
  }

  // ---------------------------- UPDATE USER ----------------------------------

  self.update_user = function(app_id, user, attributes, callback) {
    var user_id = user.get('id');
    client.update({
      index: self.toIndex(app_id),
      type: 'user',
      id: user_id,
      retryOnConflict: options.elasticsearch.retry_on_conflict,
      body: {
        doc: attributes || user.toJSON()
      }
    }, function(error, response) {
      if (error) {
        logger.error(app_id, 'update_user', error);
      }
      else {
        if (attributes) {
          user.set(attributes);
          logger.info(app_id, 'update_user_attributes: ' + user.get('username'), attributes);
        }
        else {
          logger.info(app_id, 'update_user', user);
        }
        if (!attributes ||
            (attributes && (attributes.username || attributes.displayname || attributes.avatar)))
        {
          self.bulk_update(
            app_id,
            user_id, //q
            ['user_id'], //fields
            {
              user_username: user.get('username'),
              user_displayname: user.get('displayname'),
              user_avatar: user.get('avatar')
            }, //attributes to change
            validators.user_id, //validator function
            function() {}
          );
        }
      }
      callback(user);
    });
  }

  // ------------------------------- GET USER ----------------------------------

  self.get_user = function(app_id, id, callback) {
    client.get({
      index: self.toIndex(app_id),
      type: 'user',
      id: id,
      refresh: true
    }, function(error, response) {
      if (error) {
        callback();
      }
      else if (response._source){
        callback(new Models.User(response._source));
      }
    });
  }

  // ------------------------------- MATCH USERS -------------------------------

  self.match_users = function(app_id, attributes, callback) {
    var matches = [];
    for (var key in attributes) {
      var entry = {};
      entry[key] = attributes[key];
      matches.push({
        term: entry
      });
    }
    client.search({
      index: self.toIndex(app_id),
      type: 'user',
      refresh: true,
      body: {
        from: 0,
        size: options.elasticsearch.max_children,
        query: {
          filtered: {
            filter: {
              bool: {
                must: matches
              }
            }
          }
        }
      }
    }, function(error, response) {
      var results = [];
      if (!error && response && response.hits && response.hits.hits) {
        _.each(response.hits.hits, function(hit) {
          if (validators.match_users(hit._source, attributes)) {
            results.push(new Models.User(hit._source));
          }
        });
      }
      callback(results);
    });
  }

  // ---------------------FIND USERS THAT ARE WATCHING -------------------------

  self.find_watch_users = function(app_id, watch_list, callback) {
    client.search({
      index: self.toIndex(app_id),
      type: 'user',
      refresh: true,
      body: {
        from: 0,
        size: options.elasticsearch.max_children,
        query: {
          multi_match: {
            query: watch_list,
            fields: ['watch']
          }
        }
      }
    }, function(error, response) {
      var results = [];
      if (!error && response && response.hits && response.hits.hits) {
        _.each(response.hits.hits, function(hit) {
          if (validators.find_watch_users(hit._source, watch_list)) {
            results.push(new Models.User(hit._source));
          }
        });
      }
      callback(results);
    });
  }

  // --------------------------------- SEARCH ----------------------------------

  self.search_users = function(app_id, q, callback) {
    client.search({
      index: self.toIndex(app_id),
      type: 'user',
      refresh: true,
      body: {
        from: 0,
        size: 20,
        query: {
          match_phrase_prefix: {
            username: {
              query: q
            }
          }
        }
      }
    }, function(error, response) {
      var results = [];
      if (!error && response && response.hits && response.hits.hits) {
        _.each(response.hits.hits, function(hit) {
          results.push(new Models.User(hit._source));
        });
      }
      callback(results);
    });
  }
}
