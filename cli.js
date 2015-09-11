/******************************************************************************
  Node CLI interface
*******************************************************************************/

'use strict';

var config = require('./settings'),
    FruumServer = require('./server/main.js'),
    _ = require('underscore');

module.exports = {
  setup: function() {
    new FruumServer(_.extend(config, {
      setup: true
    }));
  },
  migrate: function() {
    new FruumServer(_.extend(config, {
      migrate: true
    }));
  },
  teardown: function() {
    new FruumServer(_.extend(config, {
      teardown: true
    }));
  },
  create_api_key: function(app_id) {
    new FruumServer(_.extend(config, {
      app: { action: 'create_api_key', app_id: app_id }
    }));
  },
  list_api_keys: function(app_id) {
    new FruumServer(_.extend(config, {
      app: { action: 'list_api_keys', app_id: app_id }
    }));
  },
  delete_api_key: function(api_key) {
    new FruumServer(_.extend(config, {
      app: { action: 'delete_api_key', api_key: api_key }
    }));
  },
  add_app: function(api_id, name, description, url, auth_url) {
    new FruumServer(_.extend(config, {
      app: {
        action: 'add',
        app_id: api_id,
        name: name || '',
        description: description || '',
        url: url || '',
        auth_url: auth_url || ''
      }
    }));
  },
  update_app: function(api_id, name, description, url, auth_url) {
    new FruumServer(_.extend(config, {
      app: {
        action: 'update',
        app_id: api_id,
        name: name || '',
        description: description || '',
        url: url || '',
        auth_url: auth_url || ''
      }
    }));
  },
  delete_app: function(api_id) {
    new FruumServer(_.extend(config, {
      app: {
        action: 'delete',
        app_id: api_id
      }
    }));
  },
  list_apps: function() {
    new FruumServer(_.extend(config, {
      app: { action: 'list' }
    }));
  },
  gc_app: function(app_id) {
    new FruumServer(_.extend(config, {
      app: { action: 'gc', app_id: app_id }
    }));
  }
}
