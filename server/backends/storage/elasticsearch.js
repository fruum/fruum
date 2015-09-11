/******************************************************************************
Elastic search stogage engine
*******************************************************************************/

'use strict';

var _ = require('underscore'),
    elasticsearch = require('elasticsearch'),
    Base = require('./base'),
    Models = require('../../models'),
    logger = require('../../logger'),
    validators = require('./elasticsearch/validator'),
    Utils = require('./elasticsearch/util'),
    Applications = require('./elasticsearch/application'),
    Deleters = require('./elasticsearch/deletion'),
    Getters = require('./elasticsearch/get'),
    Management = require('./elasticsearch/management'),
    Search = require('./elasticsearch/search'),
    Setters = require('./elasticsearch/set'),
    Watchers = require('./elasticsearch/watch'),
    Users = require('./elasticsearch/user'),
    GarbageCollect = require('./elasticsearch/gc');

function ElasticSearch(options) {
  _.extend(this, new Base(options));
  options.elasticsearch = options.elasticsearch || {};
  options.elasticsearch.host = options.elasticsearch.host || 'localhost:9200';
  options.elasticsearch.max_children = options.elasticsearch.max_children || 1000;
  options.elasticsearch.retry_on_conflict = options.elasticsearch.retry_on_conflict || 0;
  var client = new elasticsearch.Client({
    host: options.elasticsearch.host
  });

  // ------------------------------- LIBRARIES ---------------------------------

  var utils = new Utils(options, client, this),
      garbage_collect = new GarbageCollect(options, client, this),
      applications = new Applications(options, client, this),
      deleters = new Deleters(options, client, this),
      getters = new Getters(options, client, this),
      management = new Management(options, client, this),
      search = new Search(options, client, this),
      setters = new Setters(options, client, this),
      watchers = new Watchers(options, client, this),
      users = new Users(options, client, this);

  this.gc = garbage_collect.gc;

  this.setup = management.setup;
  this.teardown = management.teardown;
  this.migrate = management.migrate;

  this.get = getters.get;
  this.mget = getters.mget;
  this.children = getters.children;

  this.add = setters.add;
  this.update = setters.update;
  this.update_subtree = setters.update_subtree;

  this.delete = deleters.delete;
  this.archive = deleters.archive;
  this.restore = deleters.restore;

  this.watch = watchers.watch;
  this.unwatch = watchers.unwatch;

  this.search = search.search;
  this.search_attributes = search.search_attributes;

  this.add_user = users.add_user;
  this.get_user = users.get_user;
  this.update_user = users.update_user;
  this.match_users = users.match_users;

  this.list_apps = applications.list_apps;
  this.add_app = applications.add_app;
  this.get_app = applications.get_app;
  this.update_app = applications.update_app;
  this.delete_app = applications.delete_app;
  this.get_api_key = applications.get_api_key;
}
module.exports = ElasticSearch;
