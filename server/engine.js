/******************************************************************************
  Handles communication between server and backend engines
*******************************************************************************/

'use strict';

var fs = require('fs'),
    _ = require('underscore'),
    async = require('async'),
    schedule = require('node-schedule'),
    logger = require('./logger');

function Engine(options, instance) {
  //Load storage engine class
  logger.system("Using storage engine: " + options.storage_engine);
  var StorageEngine = require('./backends/storage/' + options.storage_engine);
  //Load authentication engine class
  logger.system("Using auth engine: " + options.auth_engine);
  var AuthEngine = require('./backends/auth/' + options.auth_engine);
  //Load cache engine class
  logger.system("Using cache engine: " + options.cache_engine);
  var CacheEngine = require('./backends/cache/' + options.cache_engine);
  //Load email engine class
  logger.system("Using email engine: " + options.email_engine);
  var EmailEngine = require('./backends/email/' + options.email_engine);

  //Engine instances
  var storage = new StorageEngine(options);
  var auth = new AuthEngine(options, storage);
  var cache = new CacheEngine(options, storage);
  var email = new EmailEngine(options, storage);

  //register backends to instance
  instance.storage = storage;
  instance.auth = auth;
  instance.cache = cache;
  instance.email = email;
  instance.engine = this;

  //Load plugins
  var plugins = {
    beforeAdd: [],
    afterAdd: [],

    beforeUpdate: [],
    afterUpdate: [],

    beforeDelete: [],
    afterDelete: [],

    beforeArchive: [],
    afterArchive: [],

    beforeRestore: [],
    afterRestore: [],

    beforeWatch: [],
    afterWatch: [],

    beforeUnwatch: [],
    afterUnwatch: [],

    beforeReact: [],
    afterReact: [],

    beforeMove: [],
    afterMove: [],

    beforeReport: [],
    afterReport: []
  };

  //schedule cron on plugin
  function cronify(name, plugin, crondef) {
    logger.system('Scheduling cronjob for ' + name + ' at ' + crondef);
    var j = schedule.scheduleJob(crondef, function() {
      logger.system('Running cronjob: ' + name);
      plugin.cron();
    });
  }

  if (options.plugins) {
    //loop through plugins, initialize them and put them in the appropriate
    //plugin bucket
    _.each(options.plugins, function(plugin_name) {
      //check if server plugin exists
      try {
        var path = __dirname + '/../plugins/' + plugin_name + '/';
        var stats = fs.lstatSync(path + 'server.js');
        if (stats.isFile()) {
          try {
            var plugin = require(path + 'server');
            plugin = new plugin(options, instance);
            logger.system('Using server plugin: ' + plugin_name);
            if (plugin.beforeAdd) plugins.beforeAdd.push(plugin.beforeAdd);
            if (plugin.afterAdd) plugins.afterAdd.push(plugin.afterAdd);

            if (plugin.beforeUpdate) plugins.beforeUpdate.push(plugin.beforeUpdate);
            if (plugin.afterUpdate) plugins.afterUpdate.push(plugin.afterUpdate);

            if (plugin.beforeDelete) plugins.beforeDelete.push(plugin.beforeDelete);
            if (plugin.afterDelete) plugins.afterDelete.push(plugin.afterDelete);

            if (plugin.beforeRestore) plugins.beforeRestore.push(plugin.beforeRestore);
            if (plugin.afterRestore) plugins.afterRestore.push(plugin.afterRestore);

            if (plugin.beforeArchive) plugins.beforeArchive.push(plugin.beforeArchive);
            if (plugin.afterArchive) plugins.afterArchive.push(plugin.afterArchive);

            if (plugin.beforeWatch) plugins.beforeWatch.push(plugin.beforeWatch);
            if (plugin.afterWatch) plugins.afterWatch.push(plugin.afterWatch);

            if (plugin.beforeUnwatch) plugins.beforeUnwatch.push(plugin.beforeUnwatch);
            if (plugin.afterUnwatch) plugins.afterUnwatch.push(plugin.afterUnwatch);

            if (plugin.beforeReact) plugins.beforeReact.push(plugin.beforeReact);
            if (plugin.afterReact) plugins.afterReact.push(plugin.afterReact);

            if (plugin.beforeMove) plugins.beforeMove.push(plugin.beforeMove);
            if (plugin.afterMove) plugins.afterMove.push(plugin.afterMove);

            if (plugin.beforeReport) plugins.beforeReport.push(plugin.beforeReport);
            if (plugin.afterReport) plugins.afterReport.push(plugin.afterReport);

            if (plugin.cron && options.cron[plugin_name]) {
              cronify(plugin_name, plugin, options.cron[plugin_name]);
            }
          }
          catch(err) {
            logger.system(err);
          }
        }
      }
      catch(err) {}
    });
  }

  //convert plugins to async composed functions
  plugins.beforeAdd = async.compose.apply(async.compose, plugins.beforeAdd);
  plugins.afterAdd = async.compose.apply(async.compose, plugins.afterAdd);

  plugins.beforeUpdate = async.compose.apply(async.compose, plugins.beforeUpdate);
  plugins.afterUpdate = async.compose.apply(async.compose, plugins.afterUpdate);

  plugins.beforeDelete = async.compose.apply(async.compose, plugins.beforeDelete);
  plugins.afterDelete = async.compose.apply(async.compose, plugins.afterDelete);

  plugins.beforeRestore = async.compose.apply(async.compose, plugins.beforeRestore);
  plugins.afterRestore = async.compose.apply(async.compose, plugins.afterRestore);

  plugins.beforeArchive = async.compose.apply(async.compose, plugins.beforeArchive);
  plugins.afterArchive = async.compose.apply(async.compose, plugins.afterArchive);

  plugins.beforeWatch = async.compose.apply(async.compose, plugins.beforeWatch);
  plugins.afterWatch = async.compose.apply(async.compose, plugins.afterWatch);

  plugins.beforeUnwatch = async.compose.apply(async.compose, plugins.beforeUnwatch);
  plugins.afterUnwatch = async.compose.apply(async.compose, plugins.afterUnwatch);

  plugins.beforeReact = async.compose.apply(async.compose, plugins.beforeReact);
  plugins.afterReact = async.compose.apply(async.compose, plugins.afterReact);

  plugins.beforeMove = async.compose.apply(async.compose, plugins.beforeMove);
  plugins.afterMove = async.compose.apply(async.compose, plugins.afterMove);

  plugins.beforeReport = async.compose.apply(async.compose, plugins.beforeReport);
  plugins.afterReport = async.compose.apply(async.compose, plugins.afterReport);

  //User collection per app
  var app_users = {}, app_applications = {};

  // -------------------------------- BINDINGS ---------------------------------

  this.cache = cache;
  this.storage = storage;
  this.auth = auth;
  this.email = email;
  this.plugins = plugins;
  this.app_users = app_users;
  this.app_applications = app_applications;

  // ---------------------------------- CACHE ----------------------------------

  this.CACHE_DEFS = {
    'get/js/bundle': {
      queue: 'static',
      key: 'get_js_bundle:{app_id}'
    },
    'get/js/compact': {
      queue: 'static',
      key: 'get_js_compact:{app_id}'
    },
    'get/html': {
      queue: 'static',
      key: 'get_html:{app_id}'
    },
    'get/style': {
      queue: 'static',
      key: 'get_style:{app_id}'
    },
    'get/loader': {
      queue: 'static',
      key: 'get_loader:{app_id}'
    }
  }

  // ---------------------------------- API ------------------------------------

  var api_v1 = require('./api_v1');
  new api_v1(options, instance);

  new require('./engine/utils')(options, instance, this);
  new require('./engine/hierarchy')(options, instance, this);
  new require('./engine/management')(options, instance, this);
  new require('./engine/application')(options, instance, this);
  new require('./engine/authentication')(options, instance, this);
  new require('./engine/view')(options, instance, this);
  new require('./engine/upsert')(options, instance, this);
  new require('./engine/archive')(options, instance, this);
  new require('./engine/watch')(options, instance, this);
  new require('./engine/search')(options, instance, this);
  new require('./engine/notifications')(options, instance, this);
  new require('./engine/reactions')(options, instance, this);
  new require('./engine/move')(options, instance, this);
  new require('./engine/report')(options, instance, this);
  new require('./engine/optimize')(options, instance, this);

}
module.exports = Engine;
