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
        self.fail(payload);
      } else {
        var api_keys = application.get('api_keys') || [];
        var key = payload.using || uuid.v1();
        api_keys.push(key);
        storage.update_app(application, { api_keys: api_keys }, function(updated_application) {
          self.invalidateApplication(application.get('id'));
          if (updated_application) {
            console.log('[BEGIN]');
            console.log(key);
            console.log('[END]');
            self.success(payload);
          } else {
            self.fail(payload);
          }
        });
      }
    });
  };

  // ---------------------------- DELETE API KEY -------------------------------

  self.delete_api_key = function(payload) {
    storage.get_api_key(payload.api_key, function(application) {
      if (!application) {
        logger.error(payload.api_key, 'invalid_api_key');
        self.fail(payload);
      } else {
        var api_keys = application.get('api_keys');
        var index = api_keys.indexOf(payload.api_key);
        if (index >= 0) {
          api_keys.splice(index, 1);
          storage.update_app(application, { api_keys: api_keys }, function(updated_application) {
            self.invalidateApplication(application.get('id'));
            logger.info(updated_application.get('id'), 'delete_api_key', payload.api_key);
            self.success(payload);
          });
        } else {
          self.fail(payload);
        }
      }
    });
  };

  // ---------------------------- LIST API KEYS --------------------------------

  self.list_api_keys = function(payload) {
    storage.get_app(payload.app_id, function(application) {
      if (!application) {
        logger.error(payload.app_id, 'invalid_app_id');
        self.fail(payload);
      } else {
        console.log('[BEGIN]');
        _.each(application.get('api_keys'), function(key) {
          console.log(key);
        });
        console.log('[END]');
        self.success(payload);
      }
    });
  };

  // -------------------------------- LIST APPS --------------------------------

  self.list_apps = function(payload) {
    storage.list_apps(function(list) {
      _.each(list, function(application) {
        console.log(application.toLog(true));
      });
      self.success(payload);
    });
  };

  // --------------------------------- GET APP ---------------------------------

  self.get_app = function(app_id, callback) {
    storage.get_app(app_id, function(application) {
      callback(application);
    });
  };

  // --------------------------------- ADD APP ---------------------------------

  self.add_app = function(payload) {
    var application = new Models.Application({
      id: payload.app_id,
      name: payload.name || '',
      description: payload.description || '',
      url: payload.url || '',
      auth_url: payload.auth_url || '',
      fullpage_url: payload.fullpage_url || '',
      pushstate: payload.pushstate === 'true',
      notifications_email: payload.notifications_email || '',
      contact_email: payload.contact_email || '',
      theme: payload.theme || '',
      private_key: uuid.v1(),
      created: Date.now(),
    });
    storage.add_app(application, function() {
      logger.info(payload.app_id, 'add_app', application);
      self.success(payload);
    });
  };

  // ------------------------------- UPDATE APP --------------------------------

  self.update_app = function(payload) {
    storage.get_app(payload.app_id, function(application) {
      if (!application) {
        logger.error(payload.app_id, 'update_app: Invalid app_id', payload);
        self.fail(payload);
      } else {
        if (payload.name != undefined) application.set('name', payload.name);
        if (payload.description != undefined) application.set('description', payload.description);
        if (payload.url != undefined) application.set('url', payload.url);
        if (payload.auth_url != undefined) application.set('auth_url', payload.auth_url);
        if (payload.fullpage_url != undefined) application.set('fullpage_url', payload.fullpage_url);
        if (payload.pushstate != undefined) application.set('pushstate', payload.pushstate === 'true');
        if (payload.notifications_email != undefined) application.set('notifications_email', payload.notifications_email);
        if (payload.contact_email != undefined) application.set('contact_email', payload.contact_email);
        if (payload.theme != undefined) application.set('theme', payload.theme);
        storage.update_app(application, null, function() {
          self.invalidateApplication(application.get('id'));
          logger.info(payload.app_id, 'update_app', application);
          self.success(payload);
        });
      }
    });
  };

  // ------------------------------- DELETE APP --------------------------------

  self.delete_app = function(payload) {
    storage.get_app(payload.app_id, function(application) {
      if (!application) {
        logger.error(payload.app_id, 'delete_app: Invalid app_id', payload);
        self.fail(payload);
      } else {
        storage.delete_app(application, function() {
          self.invalidateApplication(payload.app_id);
          logger.info(payload.app_id, 'delete_app', application);
          self.success(payload);
        });
      }
    });
  };

  // ------------------------------- RESET USERS -------------------------------

  self.reset_users = function(payload) {
    storage.get_app(payload.app_id, function(application) {
      if (!application) {
        logger.error(payload.app_id, 'reset_users: Invalid app_id', payload);
        self.fail(payload);
      } else {
        storage.reset_users(application, function() {
          logger.info(payload.app_id, 'reset_users', application);
          self.success(payload);
        });
      }
    });
  };

  // ------------------------------- LIST USERS -------------------------------

  self.list_users = function(payload) {
    storage.match_users(payload.app_id, {}, function(list) {
      _.each(list, function(user) {
        console.log(user.toLog(true));
      });
      console.log('Total users: ' + list.length);
      self.success(payload);
    });
  };

  // ------------------------------- SEARCH USERS -------------------------------

  self.search_users = function(payload) {
    storage.search_users(payload.app_id, payload.value, function(list) {
      _.each(list, function(user) {
        console.log(user.toLog(true));
      });
      console.log('Total users: ' + list.length);
      self.success(payload);
    });
  };

  // ------------------------------- DELETE USER -------------------------------

  self.delete_user = function(payload) {
    storage.get_user(payload.app_id, payload.value, function(user) {
      if (user) {
        storage.delete_user(payload.app_id, user, function(deleted_user) {
          if (deleted_user) {
            logger.info(payload.app_id, 'delete_user', deleted_user);
            self.success(payload);
          } else {
            logger.error(payload.app_id, 'delete_user_failed', user);
            self.fail(payload);
          }
        });
      } else {
        logger.error(payload.app_id, 'delete_user_id_not_found', payload.value);
        self.fail(payload);
      }
    });
  };

  // ------------------------------- PROPERTIES -------------------------------

  self.set_app_property = function(payload) {
    storage.set_app_property(payload.app_id, payload.property, payload.value, function(property, value) {
      if (property) {
        logger.info(payload.app_id, 'set_app_property', payload);
        self.success(payload);
      } else {
        logger.error(payload.app_id, 'set_app_property failed', payload);
        self.fail(payload);
      }
    });
  };

  self.get_app_property = function(payload) {
    storage.get_app_property(payload.app_id, payload.property, function(property, value) {
      if (property) {
        console.log('[BEGIN]');
        console.log(value);
        console.log('[END]');
        self.success(payload);
      } else {
        logger.error(payload.app_id, 'get_app_property failed', payload);
        self.fail(payload);
      }
    });
  };
};
