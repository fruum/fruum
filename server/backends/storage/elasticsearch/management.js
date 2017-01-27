/******************************************************************************
 Database management
*******************************************************************************/

'use strict';

var _ = require('underscore'), // eslint-disable-line
    logger = require('../../../logger');

module.exports = function(options, client, self) {
  // -------------------------------- SETUP -- ---------------------------------

  self.setup = function() {
    client.indices.create({
      index: self.toMasterIndex(),
      body: {
        settings: {
          index: {
            number_of_shards: options.elasticsearch.number_of_shards,
            number_of_replicas: options.elasticsearch.number_of_replicas,
          },
        },
      },
    }, function(error, response) {
      if (error) {
        logger.error(0, 'setup', error);
      } else {
        logger.system('Created master index: ' + self.toMasterIndex());
        logger.system('Shards: ' + options.elasticsearch.number_of_shards);
        logger.system('Replicas: ' + options.elasticsearch.number_of_replicas);

        // add mapping for apps repo
        var mapping = {};
        mapping[self.toAppsIndex()] = {
          _all: { enabled: false },
          properties: {
            id: { type: 'string', index: 'not_analyzed' },
            name: { type: 'string' },
            description: { type: 'string' },
            url: { type: 'string', index: 'not_analyzed' },
            auth_url: { type: 'string', index: 'not_analyzed' },
            fullpage_url: { type: 'string', index: 'not_analyzed' },
            pushstate: { type: 'boolean' },
            theme: { type: 'string', index: 'not_analyzed' },
            created: { type: 'long' },
            private_key: { type: 'string', index: 'not_analyzed' },
            notifications_email: { type: 'string', index: 'not_analyzed' },
            contact_email: { type: 'string', index: 'not_analyzed' },
            meta: { type: 'object', enabled: false },
          },
        };
        client.indices.putMapping({
          index: self.toMasterIndex(),
          type: self.toAppsIndex(),
          body: mapping,
        }, function(error, response) {
          if (error) {
            logger.error('applications', 'setup', error);
          } else {
            logger.system('Created master index mapping: ' + self.toAppsIndex());
          }
        });
      }
    });
  };

  // --------------------------------- MIGRATE ---------------------------------

  self.migrate = function() {
    // Here follows a list of migration examples

    // ------------- MASTER SCHEMA MIGRATION -------------

    /*
    var mapping = {};
    mapping[self.toAppsIndex()] = {
      properties: {
        meta: { type: 'object', enabled: false }
      },
    };
    client.indices.putMapping({
      index: self.toMasterIndex(),
      type: self.toAppsIndex(),
      body: mapping,
    }, function(error, response) {
      console.log(error?error:response);
    });
    */

    // ------------- DOCUMENTS SCHEMA MIGRATION -------------

    /*
    self.list_apps(function(apps) {
      _.each(apps, function(app) {
        var app_id = app.get('id');
        // add mapping for doc
        var mapping = {};
        mapping[self.toDocType(app_id)] = {
          properties: {
            thumbnail: { type: 'string', index: 'not_analyzed' },
          },
        };
        client.indices.putMapping({
          index: self.toMasterIndex(),
          type: self.toDocType(app_id),
          body: mapping,
        }, function(error, response) {
          console.log(error ? error : response);
        });
      });
    });
    */

    // ------------- USER SCHEMA MIGRATION -------------

    /*
    self.list_apps(function(apps) {
      _.each(apps, function(app) {
        var app_id = app.get('id');
        //add mapping for users
        var mapping = {};
        mapping[self.toUserType(app_id)] = {
          properties: {
            meta: { type: 'object', enabled: false }
          },
        };
        client.indices.putMapping({
          index: self.toMasterIndex(),
          type: self.toUserType(app_id),
          body: mapping,
        }, function(error, response) {
          console.log(error?error:response);
        });
      });
    });
    */

    // ------------- DOCUMENTS DATA MIGRATION -------------

    /*
    self.list_apps(function(apps) {
      _.each(apps, function(app) {
        var app_id = app.get('id');
        client.search({
          index: toMasterIndex(),
          type: self.toDocType(app_id),
          body: {
            from: 0,
            size: 1000000,
            query: { match_all: {} }
          }
        }, function(error, response) {
          console.log('migrating ' + app_id);
          console.log(response.hits.hits.length);
          var queue = response.hits.hits;
          function proc() {
            var hit = queue.pop();
            if (hit) {
              hit = hit._source;
              var body = {
                permission: 0,
                usage: 0,
                visible: true
              }
              if (hit.type == 'post')
                body.tags = [];
              if (hit.is_blog && hit.type == 'article')
                body.type = 'blog';

              client.update({
                index: self.toMasterIndex(),
                type: self.toDocType(app_id),
                id: hit.id,
                body: {
                  doc: body
                }
              }, function(error, response) {
                if (error) {
                  console.log(error);
                }
                else {
                  console.log('updated ' + hit.id);
                }
                proc();
              });
            }
          }
          proc();
        });
      });
    });
    */
  };

  // -------------------------------- TEARDOWN ---------------------------------

  self.teardown = function() {
    client.indices.delete({
      index: self.toMasterIndex(),
    }, function(error, response) {
      if (error) {
        logger.error(0, 'teardown', error);
      } else {
        logger.system('Deleted master index: ' + self.toMasterIndex());
      }
    });
  };
};
