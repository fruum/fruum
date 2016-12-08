/******************************************************************************
 Database management
*******************************************************************************/

'use strict';

var _ = require('underscore'),
    logger = require('../../../logger');

module.exports = function(options, client, self) {
  // -------------------------------- SETUP -- ---------------------------------

  self.setup = function() {
    client.indices.create({
      index: self.toMasterIndex(),
    }, function(error, response) {
      if (error) {
        logger.error('applications', 'setup', error);
      } else {
        // add mapping
        client.indices.putMapping({
          index: self.toMasterIndex(),
          type: 'info',
          body: {
            info: {
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
            },
          },
        });
      }
    });
  };

  // --------------------------------- MIGRATE ---------------------------------

  self.migrate = function() {
    // Here follows a list of migration examples

    // ------------- MASTER SCHEMA MIGRATION -------------

    /*
    client.indices.putMapping({
      index: self.toMasterIndex(),
      type: 'info',
      body: {
        info: {
          properties: {
            meta: { type: 'object', enabled: false }
          }
        }
      }
    }, function(error, response) {
      console.log(error?error:response);
    });
    */

    // ------------- DOCUMENTS SCHEMA MIGRATION -------------

    /*
    self.list_apps(function(apps) {
      _.each(apps, function(app) {
        var app_id = app.get('id');
        //add mapping for doc
        client.indices.putMapping({
          index: self.toAppIndex(app_id),
          type: 'doc',
          body: {
            doc: {
              properties: {
                permission: { type: 'integer' },
                usage: { type: 'integer' },
              }
            }
          }
        }, function(error, response) {
          console.log(error?error:response);
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
        client.indices.putMapping({
          index: self.toAppIndex(app_id),
          type: 'user',
          body: {
            user: {
              properties: {
                meta: { type: 'object', enabled: false }
              }
            }
          }
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
          index: self.toAppIndex(app_id),
          type: 'doc',
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
                index: self.toAppIndex(app_id),
                type: 'doc',
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
    self.list_apps(function(apps) {
      _.each(apps, function(app) {
        client.indices.delete({
          index: self.toAppIndex(app.get('id')),
        }, function(error, response) {
          if (error) {
            logger.error(0, 'teardown_app', error);
          } else {
            logger.info(app.get('id'), 'teardown_app', app);
          }
        });
      });
      client.indices.delete({
        index: self.toMasterIndex(),
      }, function(error, response) {
        if (error) {
          logger.error(0, 'teardown', error);
        } else {
          logger.system('teardown_applications');
        }
      });
    });
  };
};
