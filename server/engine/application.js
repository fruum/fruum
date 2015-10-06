/******************************************************************************
 Application
*******************************************************************************/

'use strict';

var _ = require('underscore'),
    uuid = require('uuid'),
    Models = require('../models'),
    logger = require('../logger');

module.exports = function(options, instance, self) {
  var storage = self.storage;

  // ---------------------------- CREATE API KEY -------------------------------

  self.create_api_key = function(payload) {
    storage.get_app(payload.app_id, function(application) {
      if (!application) {
        logger.error(payload.app_id, 'invalid_app_id');
      }
      else {
        var api_keys = application.get('api_keys') || [];
        var key = payload.using || uuid.v1();
        api_keys.push(key);
        storage.update_app(application, { api_keys: api_keys }, function(updated_application) {
          if (updated_application) {
            console.log('[BEGIN]');
            console.log(key);
            console.log('[END]');
          }
        });
      }
    });
  }

  // ---------------------------- DELETE API KEY -------------------------------

  self.delete_api_key = function(payload) {
    storage.get_api_key(payload.api_key, function(application) {
      if (!application) {
        logger.error(payload.api_key, 'invalid_api_key');
      }
      else {
        var api_keys = application.get('api_keys');
        var index = api_keys.indexOf(payload.api_key);
        if (index >= 0) {
          api_keys.splice(index, 1);
          storage.update_app(application, { api_keys: api_keys }, function(updated_application) {
            logger.info(updated_application.get('id'), 'delete_api_key', payload.api_key);
          });
        }
      }
    });
  }

  // ---------------------------- LIST API KEYS --------------------------------

  self.list_api_keys = function(payload) {
    storage.get_app(payload.app_id, function(application) {
      if (!application) {
        logger.error(payload.app_id, 'invalid_app_id');
      }
      else {
        console.log('[BEGIN]');
        _.each(application.get('api_keys'), function(key) {
          console.log(key);
        });
        console.log('[END]');
      }
    });
  }

  // -------------------------------- LIST APPS --------------------------------

  self.list_apps = function() {
    storage.list_apps(function(list) {
      _.each(list, function(application) {
        console.log(application.toLog());
      });
    });
  }

  // --------------------------------- GET APP ---------------------------------

  self.get_app = function(app_id, callback) {
    storage.get_app(app_id, function(application) {
      callback(application);
    });
  }

  // --------------------------------- ADD APP ---------------------------------

  self.add_app = function(payload) {
    var application = new Models.Application({
      id: payload.app_id,
      name: payload.name || '',
      description: payload.description || '',
      url: payload.url || '',
      auth_url: payload.auth_url || '',
      fullpage_url: payload.fullpage_url || '',
      notifications_email: payload.notifications_email || '',
      contact_email: payload.contact_email || '',
      theme: payload.theme || '',
      tier: payload.tier || '',
      private_key: uuid.v1(),
      created: Date.now()
    });
    storage.add_app(application, function() {
      logger.info(payload.app_id, 'add_app', application);
    });
  }

  // ------------------------------- UPDATE APP --------------------------------

  self.update_app = function(payload) {
    storage.get_app(payload.app_id, function(application) {
      if (!application) {
        logger.error(payload.app_id, 'update_app: Invalid app_id', payload);
      }
      else {
        if (payload.name != undefined) application.set('name', payload.name);
        if (payload.description != undefined) application.set('description', payload.description);
        if (payload.url != undefined) application.set('url', payload.url);
        if (payload.auth_url != undefined) application.set('auth_url', payload.auth_url);
        if (payload.fullpage_url != undefined) application.set('fullpage_url', payload.fullpage_url);
        if (payload.notifications_email != undefined) application.set('notifications_email', payload.notifications_email);
        if (payload.contact_email != undefined) application.set('contact_email', payload.contact_email);
        if (payload.theme != undefined) application.set('theme', payload.theme);
        if (payload.tier != undefined) application.set('tier', payload.tier);
        storage.update_app(application, null, function() {
          logger.info(payload.app_id, 'update_app', application);
        });
      }
    });
  }

  // ------------------------------- DELETE APP --------------------------------

  self.delete_app = function(payload) {
    storage.get_app(payload.app_id, function(application) {
      if (!application) {
        logger.error(payload.app_id, 'delete_app: Invalid app_id', payload);
      }
      else {
        storage.delete_app(application, function() {
          logger.info(payload.app_id, 'delete_app', application);
        });
      }
    });
  }

  // ------------------------------- RESET USERS -------------------------------

  self.reset_users = function(payload) {
    storage.get_app(payload.app_id, function(application) {
      if (!application) {
        logger.error(payload.app_id, 'reset_users: Invalid app_id', payload);
      }
      else {
        storage.reset_users(application, function() {
          logger.info(payload.app_id, 'reset_users', application);
        });
      }
    });
  }
}
