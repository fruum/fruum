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
      index: 'applications'
    }, function(error, response) {
      if (error) {
        logger.error('applications', 'setup', error);
      }
      else {
        //add mapping
        client.indices.putMapping({
          index: 'applications',
          type: 'info',
          body: {
            info: {
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
                tier: { type: 'string', index: 'not_analyzed' },
                private_key: { type: 'string', index: 'not_analyzed' },
                notifications_email: { type: 'string', index: 'not_analyzed' },
                contact_email: { type: 'string', index: 'not_analyzed' },
                meta: { type: 'object', enabled: false }
              }
            }
          }
        });
      }
    });
  };

  // --------------------------------- MIGRATE ---------------------------------

  self.migrate = function() {
    //SAMPLE MIGRATION, e.g. adding a new mapping after setup

    /*
    client.indices.putMapping({
      index: 'applications',
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
    self.list_apps(function(apps) {
      _.each(apps, function(app) {
        var app_id = app.get('id');
        //add mapping for users
        client.indices.putMapping({
          index: self.toIndex(app_id),
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
        //add mapping for doc
        client.indices.putMapping({
          index: self.toIndex(app_id),
          type: 'doc',
          body: {
            doc: {
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
  }

  // -------------------------------- TEARDOWN ---------------------------------

  self.teardown = function() {
    self.list_apps(function(apps) {
      _.each(apps, function(app) {
        client.indices.delete({
          index: self.toIndex(app.get('id'))
        }, function(error, response) {
          if (error) {
            logger.error(0, 'teardown_app', error);
          }
          else {
            logger.info(app.get('id'), 'teardown_app', app);
          }
        });
      });
      client.indices.delete({
        index: 'applications'
      }, function(error, response) {
        if (error) {
          logger.error(0, 'teardown', error);
        }
        else {
          logger.system('teardown_applications');
        }
      });
    });
  };
}
