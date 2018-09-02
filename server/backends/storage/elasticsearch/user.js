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
      index: self.toMasterIndex(),
      type: self.toUserType(app_id),
      id: user.get('id'),
      body: user.toJSON(),
    }, function(error, response) {
      if (error) {
        logger.error(app_id, 'add_user', error);
      } else {
        logger.info(app_id, 'add_user', user);
      }
      callback(user);
    });
  };

  // ---------------------------- UPDATE USER ----------------------------------

  self.update_user = function(app_id, user, attributes, callback) {
    var user_id = user.get('id');
    client.update({
      index: self.toMasterIndex(),
      type: self.toUserType(app_id),
      id: user_id,
      retryOnConflict: options.elasticsearch.retry_on_conflict,
      body: {
        doc: attributes || user.toJSON(),
      },
    }, function(error, response) {
      if (error) {
        logger.error(app_id, 'update_user', error);
      } else {
        if (attributes) {
          user.set(attributes);
          logger.info(app_id, 'update_user_attributes: ' + user.get('username'), attributes);
        } else {
          logger.info(app_id, 'update_user', user);
        }
        if (!attributes ||
            (attributes && (attributes.username || attributes.displayname || attributes.avatar))
        ) {
          self.bulk_update(
            app_id,
            user_id, // q
            ['user_id'], // fields
            {
              user_username: user.get('username'),
              user_displayname: user.get('displayname'),
              user_avatar: user.get('avatar'),
            }, // attributes to change
            validators.user_id, // validator function
            function() {}
          );
        }
      }
      callback(user);
    });
  };

  // ---------------------------- DELETE USER ----------------------------------

  self.delete_user = function(app_id, user, callback, options) {
    client.delete({
      index: self.toMasterIndex(),
      type: self.toUserType(app_id),
      id: user.get('id'),
    }, function(error, response) {
      if (error) {
        logger.error(app_id, 'delete_user', error);
        callback();
      } else {
        if (options && (options.anonymize || options.purge)) {
          var data = {
            user_username: '',
            user_displayname: 'deleted account',
            user_avatar: '',
          };
          if (options.purge) {
            data = _.extend(data, {
              header: 'Undisclosed topic',
              body: '*This content is no longer available*',
              thumbnail: '',
              tags: [],
              attachments: [],
              meta: {},
            });
          }
          self.bulk_update(
            app_id,
            user.get('id'), // q
            ['user_id'], // fields
            data, // attributes to change
            validators.user_id, // validator function
            function() {}
          );
        }
        callback(user);
      }
    });
  };

  // ------------------------------- GET USER ----------------------------------

  self.get_user = function(app_id, id, callback) {
    client.get({
      index: self.toMasterIndex(),
      type: self.toUserType(app_id),
      id: id,
      refresh: true,
    }, function(error, response) {
      if (error) {
        logger.error(app_id, 'get_user', error);
        callback();
      } else if (response._source) {
        callback(new Models.User(response._source));
      }
    });
  };

  // ------------------------------- MATCH USERS -------------------------------

  self.match_users = function(app_id, attributes, callback, params) {
    var matches = [];
    for (var key in attributes) {
      var entry = {};
      entry[key] = attributes[key];
      matches.push({
        term: entry,
      });
    }
    var body = {
      from: 0,
      size: options.elasticsearch.max_children,
      query: {
        filtered: {
          filter: {
            bool: {
              must: matches,
            },
          },
        },
      },
    };
    if (params) {
      if (params.from > 0) body.from = params.from;
      if (params.size > 0) body.size = params.size;
      if (params.skipfields && params.skipfields.length) {
        body._source = {
          exclude: params.skipfields,
        };
      }
      if (params.sort && params.sort.length) {
        body.sort = params.sort;
      }
    }
    client.search({
      index: self.toMasterIndex(),
      type: self.toUserType(app_id),
      refresh: true,
      body: body,
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
  };

  // ------------------------------- COUNT USERS -------------------------------

  self.count_users = function(app_id, attributes, callback) {
    var matches = [];
    for (var key in attributes) {
      var entry = {};
      entry[key] = attributes[key];
      matches.push({
        term: entry,
      });
    }
    client.count({
      index: self.toMasterIndex(),
      type: self.toUserType(app_id),
      refresh: true,
      body: {
        query: {
          filtered: {
            filter: {
              bool: {
                must: matches,
              },
            },
          },
        },
      },
    }, function(error, response) {
      if (error) {
        logger.error(app_id, 'count_users', error);
        callback(0);
        return;
      } else {
        callback(response.count || 0);
      }
    });
  };

  // ---------------------FIND USERS THAT ARE WATCHING -------------------------

  self.find_watch_users = function(app_id, watch_list, callback) {
    client.search({
      index: self.toMasterIndex(),
      type: self.toUserType(app_id),
      refresh: true,
      body: {
        from: 0,
        size: options.elasticsearch.max_children,
        query: {
          multi_match: {
            query: watch_list,
            fields: ['watch'],
          },
        },
      },
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
  };

  // --------------------------------- SEARCH ----------------------------------

  self.search_users = function(app_id, q, callback) {
    q = '*' + (q || '').replace('@', '') + '*';
    client.search({
      index: self.toMasterIndex(),
      type: self.toUserType(app_id),
      refresh: true,
      body: {
        from: 0,
        size: 20,
        query: {
          query_string: {
            query: q,
            fields: ['username', 'displayname'],
          },
        },
      },
    }, function(error, response) {
      var results = [];
      if (!error && response && response.hits && response.hits.hits) {
        _.each(response.hits.hits, function(hit) {
          results.push(new Models.User(hit._source));
        });
      }
      callback(results);
    });
  };
};
