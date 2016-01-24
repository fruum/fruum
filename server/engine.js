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
    add: [],
    update: [],
    delete: [],
    archive: [],
    restore: [],
    watch: [],
    unwatch: [],
    react: [],
    move: [],
    report: []
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
            if (plugin.add) plugins.add.push(plugin.add);
            if (plugin.update) plugins.update.push(plugin.update);
            if (plugin.delete) plugins.delete.push(plugin.delete);
            if (plugin.restore) plugins.restore.push(plugin.restore);
            if (plugin.archive) plugins.archive.push(plugin.archive);
            if (plugin.watch) plugins.watch.push(plugin.watch);
            if (plugin.unwatch) plugins.unwatch.push(plugin.unwatch);
            if (plugin.react) plugins.react.push(plugin.react);
            if (plugin.move) plugins.move.push(plugin.move);
            if (plugin.report) plugins.report.push(plugin.report);
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
  plugins.add = async.compose.apply(async.compose, plugins.add);
  plugins.update = async.compose.apply(async.compose, plugins.update);
  plugins.delete = async.compose.apply(async.compose, plugins.delete);
  plugins.restore = async.compose.apply(async.compose, plugins.restore);
  plugins.archive = async.compose.apply(async.compose, plugins.archive);
  plugins.watch = async.compose.apply(async.compose, plugins.watch);
  plugins.unwatch = async.compose.apply(async.compose, plugins.unwatch);
  plugins.react = async.compose.apply(async.compose, plugins.react);
  plugins.move = async.compose.apply(async.compose, plugins.move);
  plugins.report = async.compose.apply(async.compose, plugins.report);

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
