/******************************************************************************
  Handles communication between server and backend engines
*******************************************************************************/

'use strict';

var fs = require('fs'),
    _ = require('underscore'),
    Backbone = require('backbone'),
    async = require('async'),
    uuid = require('uuid'),
    Models = require('./models'),
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

  //Engine instances (storage and authentication)
  var storage = new StorageEngine(options);
  var auth = new AuthEngine(options);
  var cache = new CacheEngine(options);
  var email = new EmailEngine(options);

  //register backends to instance
  instance.storage = storage;
  instance.auth = auth;
  instance.cache = cache;
  instance.email = email;

  //Load plugins
  var plugins = {
    add: [],
    update: [],
    delete: [],
    archive: [],
    restore: [],
    watch: [],
    unwatch: [],
    report: []
  };
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
            if (plugin.add) plugins.add.push(plugin.add);
            if (plugin.update) plugins.update.push(plugin.update);
            if (plugin.delete) plugins.delete.push(plugin.delete);
            if (plugin.restore) plugins.restore.push(plugin.restore);
            if (plugin.archive) plugins.archive.push(plugin.archive);
            if (plugin.watch) plugins.watch.push(plugin.watch);
            if (plugin.unwatch) plugins.unwatch.push(plugin.unwatch);
            if (plugin.report) plugins.report.push(plugin.report);
            logger.system('Using server plugin: ' + plugin_name);
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
  plugins.report = async.compose.apply(async.compose, plugins.report);

  //User collection per app
  var App_users = {}, App_applications = {};

  // ---------------------------------- CACHE ----------------------------------

  //expose cache as API
  this.cache = cache;

  // ---------------------------------- API ---------------------------------

  var api_v1 = require('./api_v1');
  new api_v1(options, instance);

  // ---------------------------------- SETUP ----------------------------------

  this.setup = function() {
    logger.system('Setup database');
    auth.setup();
    storage.setup();
  }

  // --------------------------------- MIGRATE ---------------------------------

  this.migrate = function() {
    logger.system('Migrate database');
    auth.migrate();
    storage.migrate();
  }

  // ---------------------------------- TEARDOWN ----------------------------------

  this.teardown = function() {
    logger.system('Teardown database');
    auth.teardown();
    storage.teardown();
  }

  // ----------------------------- GARBAGE COLLECT -----------------------------

  this.gc = function(app_id) {
    logger.system('Delete archived documents');
    storage.gc(app_id, Date.now(), function() {});
  }

  // ---------------------------- CREATE API KEY -------------------------------

  this.create_api_key = function(payload) {
    storage.get_app(payload.app_id, function(application) {
      if (!application) {
        logger.error(payload.app_id, 'invalid_app_id');
      }
      else {
        var api_keys = application.get('api_keys') || [];
        var key = uuid.v1();
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

  this.delete_api_key = function(payload) {
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

  this.list_api_keys = function(payload) {
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

  this.list_apps = function() {
    storage.list_apps(function(list) {
      _.each(list, function(application) {
        console.log(application.toLog());
      });
    });
  }

  // --------------------------------- GET APP ---------------------------------

  this.get_app = function(app_id, callback) {
    storage.get_app(app_id, function(application) {
      callback(application);
    });
  }

  // --------------------------------- ADD APP ---------------------------------

  this.add_app = function(payload) {
    var application = new Models.Application({
      id: payload.app_id,
      name: payload.name || '',
      description: payload.description || '',
      url: payload.url || '',
      auth_url: payload.auth_url || '',
      fullpage_url: payload.fullpage_url || '',
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

  this.update_app = function(payload) {
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
        if (payload.theme != undefined) application.set('theme', payload.theme);
        if (payload.tier != undefined) application.set('tier', payload.tier);
        storage.update_app(application, null, function() {
          logger.info(payload.app_id, 'update_app', application);
        });
      }
    });
  }

  // ------------------------------- DELETE APP --------------------------------

  this.delete_app = function(payload) {
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

  // --------------------------------- CONNECT ---------------------------------

  this.connect = function(socket) {
  }

  // ------------------------------- DISCONNECT --------------------------------

  this.disconnect = function(socket) {
    //unregister user
    var user = socket.fruum_user;
    if (user) {
      var app_id = user.get('app_id'),
          app = App_users[app_id];
      if (!app) {
        logger.error(socket.app_id, 'disconnect: cannot not find app', user);
      }
      else {
        App_users[app_id] = _.without(app, user);
        //remove from channel
        if (user.get('channel_id') && user.get('channel_parent')) {
          var online = {};
          online[user.get('channel_id')] = _countNormalUsers(app_id, user.get('channel_id'));
          _broadcastRaw(
            app_id, user.get('channel_parent'),
            'fruum:online', online
          );
        }
        //if app is empty, then delete it
        if (!App_users[app_id].length) {
          delete App_users[app_id];
          delete App_applications[app_id];
        }
      }
      user.set('socket', null);
      delete socket.fruum_user;
    }
  }

  // ----------------------------- AUTHENTICATE --------------------------------

  this.auth = function(socket, payload, onready) {
    //app_id is a required field
    if (!payload || !payload.app_id) {
      logger.system('auth: Missing app_id from payload');
      socket.emit('fruum:auth');
      socket.disconnect();
      return;
    }
    var that = this,
        app_id = payload.app_id;
    function register_cb(user) {
      var app = App_applications[app_id];
      App_users[app_id] = App_users[app_id] || [];
      App_users[app_id].push(user);
      socket.emit('fruum:auth', {
        user: user.toJSON(),
        application: {
          fullpage_url: app.get('fullpage_url')
        }
      });
      //add additional data
      user.set({
        viewing: 0,
        socket: socket,
        app_id: socket.app_id
      });
      //ready to roll
      onready();
    }
    //get app by app_id
    if (!App_users[app_id]) {
      //app is not cached, query it
      storage.get_app(app_id, function(application) {
        if (!application) {
          logger.error(app_id, 'auth: Invalid app_id');
          socket.emit('fruum:auth');
          socket.disconnect();
        }
        else {
          App_applications[app_id] = application;
          _register_user(socket, payload, register_cb);
        }
      });
    }
    else _register_user(socket, payload, register_cb);
  }

  // --------------------------------- VIEW ------------------------------------

  function _process_view(app_id, user, id, response) {
    user.set('viewing', id);
    user.get('socket').emit('fruum:view', response);
    //store previous values
    var prev_channel_id = user.get('channel_id'),
        prev_channel_parent = user.get('channel_parent');
    //check for viewing channel
    if (!user.get('anonymous') &&
        response.breadcrumb.length > 1 &&
        response.breadcrumb[response.breadcrumb.length - 1].type === 'channel'
      )
    {
      var doc_id = response.breadcrumb[response.breadcrumb.length - 1].id;
      var parent_id = response.breadcrumb[response.breadcrumb.length - 2].id;
      var online = {};
      online[doc_id] = _countNormalUsers(app_id, doc_id);
      _broadcastRaw(
        app_id, parent_id,
        'fruum:online', online
      );
      user.set({
        channel_id: doc_id,
        channel_parent: parent_id
      });
    }
    else {
      user.set({
        channel_id: '',
        channel_parent: ''
      });
    }
    //check for user leaving the channel
    if (prev_channel_id && prev_channel_parent) {
      var online = {};
      online[prev_channel_id] = _countNormalUsers(app_id, prev_channel_id);
      _broadcastRaw(
        app_id, prev_channel_parent,
        'fruum:online', online
      );
    }
  }

  this.view = function(socket, payload) {
    if (!_validate_payload_id(null, payload, 'view')) return;
    var that = this,
        id = payload.id,
        app_id = socket.app_id,
        user = socket.fruum_user;
    if (user) {
      cache.get_cached_response(app_id, user, id,
        //cache hit
        function(data) {
          _process_view(app_id, user, id, data);
        },
        //cache miss
        function() {
          var is_admin = user.get('admin');
          var response = {
            id: id,
            breadcrumb: [],
            documents: [],
            online: {}
          };
          storage.get(app_id, id, function(viewing_doc) {
            if (viewing_doc) {
              //get breadcrumb
              storage.mget(app_id, viewing_doc.get('breadcrumb'), function(breadcrumb) {
                //get children
                storage.children(app_id, viewing_doc, function(children_docs) {
                  _.each(children_docs, function(document) {
                    if (is_admin || document.get('visible')) {
                      if (document.get('inappropriate')) document.set('body', '');
                      response.documents.push(document.toJSON());
                      if (document.get('type') == 'channel') {
                        var doc_id = document.get('id');
                        response.online[doc_id] = _countNormalUsers(app_id, doc_id);
                      }
                    }
                  });
                  //populate breadcrumb
                  var has_private = false;
                  _.each(viewing_doc.get('breadcrumb'), function(key) {
                    if (breadcrumb[key]) {
                      if (!breadcrumb[key].get('visible')) has_private = true;
                      response.breadcrumb.push(breadcrumb[key].toJSON());
                    }
                  });
                  //add self as last entry in the breadcrumb
                  response.breadcrumb.push(viewing_doc.toJSON());
                  //check permissions
                  if (has_private && !is_admin) {
                    //reset response
                    response = {
                      id: id,
                      breadcrumb: [],
                      documents: [],
                      online: {}
                    };
                  }
                  cache.cache_response(app_id, user, id, response);
                  _process_view(app_id, user, id, response);
                });
              });
            }
            else socket.emit('fruum:view');
          });
        }
      );
    }
    else {
      logger.system('view: No user found');
      socket.disconnect();
    }
  }

  // --------------------------------- ADD -------------------------------------

  this.add = function(socket, payload) {
    if (!_validate_payload_id(socket, null, 'add')) return;
    var that = this,
        app_id = socket.app_id,
        user = socket.fruum_user,
        document = new Models.Document(payload);
    document.set({
      user_id: user.get('id'),
      user_username: user.get('username'),
      user_displayname: user.get('displayname'),
      user_avatar: user.get('avatar')
    });
    if (user.get('anonymous')) {
      logger.error(app_id, 'add_anonymous_noperm', user);
      socket.disconnect();
      return;
    }
    if (!document.isValid()) {
      logger.error(app_id, 'add_invalid_doc', document);
      logger.error(app_id, 'validation_error:', document.validationError);
      socket.emit('fruum:add');
      return;
    }
    if (document.get('type') == 'category' && !user.get('admin')) {
      logger.error(app_id, 'add_category_noperm', user);
      socket.disconnect();
      return;
    }
    if (document.get('type') == 'article' && !user.get('admin')) {
      logger.error(app_id, 'add_article_noperm', user);
      socket.disconnect();
      return;
    }
    //get parent
    storage.get(app_id, document.get('parent'), function(parent_doc) {
      if (!parent_doc) {
        logger.error(app_id, 'add_noparent', document);
        socket.emit('fruum:add');
        return;
      }
      //check permissions
      if (document.get('type') == 'thread' && !parent_doc.get('allow_threads') ||
          document.get('type') == 'channel' && !parent_doc.get('allow_channels') ||
          document.get('type') == 'post' && parent_doc.get('locked'))
      {
        logger.error(app_id, 'add_invalid_parent_perm', document);
        socket.emit('fruum:add');
        return;
      }
      //conform to document constraints
      switch (document.get('type')) {
        case 'category':
          document.set({
            header: options.docs.max_category_title_size?document.get('header').substr(0, options.docs.max_category_title_size):document.get('header'),
            body: options.docs.max_category_description_size?document.get('body').substr(0, options.docs.max_category_description_size):document.get('body')
          });
          break;
        case 'article':
          //update fields (denormalization for search)
          document.set({
            initials: parent_doc.get('initials'),
            header: options.docs.max_article_title_size?document.get('header').substr(0, options.docs.max_article_title_size):document.get('header'),
            body: options.docs.max_post_size?document.get('body').substr(0, options.docs.max_post_size):document.get('body')
          });
          break;
        case 'thread':
          //update fields (denormalization for search)
          document.set({
            initials: parent_doc.get('initials'),
            header: options.docs.max_thread_title_size?document.get('header').substr(0, options.docs.max_thread_title_size):document.get('header'),
            body: options.docs.max_post_size?document.get('body').substr(0, options.docs.max_post_size):document.get('body')
          });
          break;
        case 'channel':
          //update fields (denormalization for search)
          document.set({
            initials: parent_doc.get('initials'),
            header: options.docs.max_channel_name_size?document.get('header').substr(0, options.docs.max_channel_name_size):document.get('header')
          });
          break;
        case 'post':
          //update fields (denormalization for search)
          document.set({
            header: parent_doc.get('header'),
            initials: parent_doc.get('initials'),
            body: options.docs.max_post_size?document.get('body').substr(0, options.docs.max_post_size):document.get('body')
          });
          break;
      }
      //update breadcrumb
      var breadcrumb = (parent_doc.get('breadcrumb') || []).slice();
      breadcrumb.push(parent_doc.get('id'));
      //set timestamps
      var now = Date.now();
      document.set({
        breadcrumb: breadcrumb,
        parent_type: parent_doc.get('type'),
        visible: parent_doc.get('visible'),
        created: now,
        updated: now
      });
      //escape document
      document.escape();
      //process plugins
      plugins.add(document, function(err, result) {
        document = result || document;
        var flags = document.extractFlags();
        if (flags.storage_noop) {
          socket.emit('fruum:add', document.toJSON());
          if (!flags.broadcast_noop) _broadcast(user, document);
          return;
        }
        storage.add(app_id, document, function(new_document) {
          if (new_document) {
            //success
            cache.invalidate_document(app_id, new_document);
            cache.invalidate_document(app_id, parent_doc);
            socket.emit('fruum:add', new_document.toJSON());
            if (!flags.broadcast_noop) {
              _broadcast(user, new_document);
              _broadcast(user, parent_doc, 'fruum:notify');
            }
            //update parent counter`
            storage.update(app_id, parent_doc, {
              updated: now,
              children_count: parent_doc.get('children_count')|0 + 1
            }, function() {});
          }
          else {
            //fail
            socket.emit('fruum:add');
          }
        });
      });
    });
  }

  // --------------------------------- UPDATE ----------------------------------

  this.update = function(socket, payload) {
    if (!_validate_payload_id(socket, payload, 'update')) return;
    var that = this,
        app_id = socket.app_id,
        user = socket.fruum_user,
        document = new Models.Document(payload);
    if (user.get('anonymous')) {
      logger.error(app_id, 'update_anonymous_noperm', user);
      socket.disconnect();
      return;
    }
    if (!document.isValid()) {
      logger.error(app_id, 'update_invalid_doc', document);
      logger.error(app_id, 'validation_error:', document.validationError);
      socket.emit('fruum:update');
      return;
    }
    storage.get(app_id, document.get('id'), function(doc_to_update) {
      if (!doc_to_update) {
        logger.error(app_id, 'update_doc_does_not_exist', document);
        socket.emit('fruum:update');
        return;
      }
      if (doc_to_update.get('type') == 'category' && !user.get('admin')) {
        logger.error(app_id, 'update_category_noperm', user);
        socket.disconnect();
        return;
      }
      if (doc_to_update.get('type') == 'article' && !user.get('admin')) {
        logger.error(app_id, 'update_article_noperm', user);
        socket.disconnect();
        return;
      }
      if (!user.get('admin') && doc_to_update.get('user_id') != user.get('id')) {
        logger.error(app_id, 'update_noperm', user);
        socket.disconnect();
        return;
      }
      var now = Date.now();
      doc_to_update.set('updated', now);
      //escape document based on difference with previous
      document.escape(doc_to_update);
      switch(doc_to_update.get('type')) {
        case 'category':
          doc_to_update.set({
            initials: document.get('initials'),
            header: document.get('header'),
            body: document.get('body')
          });
          break;
        case 'article':
        case 'thread':
          doc_to_update.set({
            header: document.get('header'),
            body: document.get('body')
          });
          break;
        case 'channel':
          doc_to_update.set({
            header: document.get('header')
          });
          break;
        case 'post':
          doc_to_update.set({
            body: document.get('body')
          });
          break;
      }
      //process plugins
      plugins.update(doc_to_update, function(err, result) {
        doc_to_update = result || doc_to_update;
        var flags = doc_to_update.extractFlags();
        if (flags.storage_noop) {
          socket.emit('fruum:update', doc_to_update.toJSON());
          if (!flags.broadcast_noop) _broadcast(user, doc_to_update);
          return;
        }
        storage.update(app_id, doc_to_update, null, function(updated_document) {
          if (updated_document) {
            cache.invalidate_document(app_id, updated_document);
            socket.emit('fruum:update', updated_document.toJSON());
            if (!flags.broadcast_noop) _broadcast(user, updated_document);
            //update parent timestamp
            storage.update(
              app_id,
              new Models.Document({ id: updated_document.get('parent') }),
              { updated: now },
              function() {}
            );
          }
          else {
            socket.emit('fruum:update');
          }
        });
      });
    });
  }

  // -------------------------------- DELETE -----------------------------------

  this.delete = function(socket, payload) {
    if (!_validate_payload_id(socket, payload, 'delete')) return;
    var that = this,
        app_id = socket.app_id,
        id = payload.id,
        user = socket.fruum_user;
    if (!user.get('admin')) {
      logger.error(app_id, 'delete_noperm', user);
      socket.emit('fruum:delete');
      return;
    }
    storage.get(app_id, id, function(document) {
      if (!document) {
        logger.error(app_id, 'delete_invalid_doc', '' + id);
        socket.emit('fruum:delete');
        return;
      }
      //process plugins
      plugins.delete(document, function(err, result) {
        document = result || document;
        var flags = document.extractFlags();
        if (flags.storage_noop) {
          socket.emit('fruum:delete', document.toJSON());
          if (!flags.broadcast_noop) _broadcast(user, document, 'fruum:delete');
          return;
        }
        storage.delete(app_id, document, function() {
          cache.invalidate_document(app_id, document);
          socket.emit('fruum:delete', document.toJSON());
          if (!flags.broadcast_noop) _broadcast(user, document, 'fruum:delete');
        });
      });
    });
  }

  // -------------------------------- ARCHIVE -----------------------------------

  this.archive = function(socket, payload) {
    if (!_validate_payload_id(socket, payload, 'archive')) return;
    var that = this,
        app_id = socket.app_id,
        id = payload.id,
        user = socket.fruum_user;
    if (!user.get('admin')) {
      logger.error(app_id, 'archive_noperm', user);
      socket.emit('fruum:archive');
      return;
    }
    storage.get(app_id, id, function(document) {
      if (!document) {
        logger.error(app_id, 'archive_invalid_doc', '' + id);
        socket.emit('fruum:archive');
        return;
      }
      //process plugins
      plugins.archive(document, function(err, result) {
        document = result || document;
        var flags = document.extractFlags();
        if (flags.storage_noop) {
          socket.emit('fruum:archive', document.toJSON());
          if (!flags.broadcast_noop) _broadcast(user, document, 'fruum:archive');
          return;
        }
        storage.archive(app_id, document, function() {
          cache.invalidate_document(app_id, document);
          socket.emit('fruum:archive', document.toJSON());
          if (!flags.broadcast_noop) _broadcast(user, document, 'fruum:archive');
        });
      });
    });
  }

  // ------------------------------- RESTORE -----------------------------------

  this.restore = function(socket, payload) {
    if (!_validate_payload_id(socket, payload, 'restore')) return;
    var that = this,
        app_id = socket.app_id,
        id = payload.id,
        user = socket.fruum_user;
    if (!user.get('admin')) {
      logger.error(app_id, 'restore_noperm', user);
      socket.emit('fruum:restore');
      return;
    }
    storage.get(app_id, id, function(document) {
      if (!document) {
        logger.error(app_id, 'restore_invalid_doc', '' + id);
        socket.emit('fruum:restore');
        return;
      }
      //process plugins
      plugins.restore(document, function(err, result) {
        document = result || document;
        var flags = document.extractFlags();
        if (flags.storage_noop) {
          socket.emit('fruum:restore', document.toJSON());
          if (!flags.broadcast_noop) _broadcast(user, document, 'fruum:restore');
          return;
        }
        storage.restore(app_id, document, function() {
          cache.invalidate_document(app_id, document);
          socket.emit('fruum:restore', document.toJSON());
          if (!flags.broadcast_noop) _broadcast(user, document, 'fruum:restore');
        });
      });
    });
  }

  // --------------------------- UPDATE FIELD ----------------------------------

  this.field = function(socket, payload) {
    if (!_validate_payload_id(socket, payload, 'field')) return;
    var that = this,
        app_id = socket.app_id,
        id = payload.id,
        user = socket.fruum_user;
    if (!user.get('admin')) {
      logger.error(app_id, 'field_category_noperm', user);
      socket.emit('fruum:field');
      return;
    }
    storage.get(app_id, id, function(document) {
      if (!document) {
        logger.error(app_id, 'field_invalid_doc', '' + id);
        socket.emit('fruum:field');
        return;
      }
      if (document.attributes[payload.field] === undefined || payload.value === undefined) {
        logger.error(app_id, 'field_invalid_field', '' + id);
        socket.emit('fruum:field');
        return;
      }
      var attributes = {};
      attributes[payload.field] = payload.value;
      if (payload.field == 'visible') {
        storage.update_subtree(app_id, document, attributes, function(updated_document) {
          if (updated_document) {
            cache.invalidate_document(app_id, updated_document);
            socket.emit('fruum:field', updated_document.toJSON());
            _broadcast(user, updated_document);
          }
          else {
            socket.emit('fruum:field');
          }
        })
      }
      else {
        storage.update(app_id, document, attributes, function(updated_document) {
          if (updated_document) {
            cache.invalidate_document(app_id, updated_document);
            socket.emit('fruum:field', updated_document.toJSON());
            _broadcast(user, updated_document);
          }
          else {
            socket.emit('fruum:field');
          }
        });
      }
    });
  }

  // -------------------------------- WATCH ------------------------------------

  this.watch = function(socket, payload) {
    if (!_validate_payload_id(socket, payload, 'watch')) return;
    var that = this,
        app_id = socket.app_id,
        id = payload.id,
        user = socket.fruum_user;

    if (user.get('anonymous')) {
      logger.error(app_id, 'watch_anonymous_noperm', user);
      socket.disconnect();
      return;
    }
    storage.get(app_id, id, function(document) {
      if (!document) {
        logger.error(app_id, 'watch_invalid_doc', '' + id);
        socket.emit('fruum:watch');
        return;
      }
      //process plugins
      plugins.watch(document, function(err, result) {
        document = result || document;
        var flags = document.extractFlags();
        if (flags.storage_noop) {
          socket.emit('fruum:watch', document.toJSON());
          return;
        }
        storage.watch(app_id, document, user, function() {
          socket.emit('fruum:watch', document.toJSON());
        });
      });
    });
  }

  this.unwatch = function(socket, payload) {
    if (!_validate_payload_id(socket, payload, 'unwatch')) return;
    var that = this,
        app_id = socket.app_id,
        id = payload.id,
        user = socket.fruum_user;

    if (user.get('anonymous')) {
      logger.error(app_id, 'unwatch_anonymous_noperm', user);
      socket.disconnect();
      return;
    }
    storage.get(app_id, id, function(document) {
      if (!document) {
        logger.error(app_id, 'unwatch_invalid_doc', '' + id);
        socket.emit('fruum:unwatch');
        return;
      }
      //process plugins
      plugins.unwatch(document, function(err, result) {
        document = result || document;
        var flags = document.extractFlags();
        if (flags.storage_noop) {
          socket.emit('fruum:unwatch', document.toJSON());
          return;
        }
        storage.unwatch(app_id, document, user, function() {
          socket.emit('fruum:unwatch', document.toJSON());
        });
      });
    });
  }

  // -------------------------------- REPORT ------------------------------------

  this.report = function(socket, payload) {
    if (!_validate_payload_id(socket, payload, 'report')) return;
    var that = this,
        app_id = socket.app_id,
        id = payload.id,
        user = socket.fruum_user;

    if (user.get('anonymous')) {
      logger.error(app_id, 'report_anonymous_noperm', user);
      socket.disconnect();
      return;
    }
    storage.get(app_id, id, function(document) {
      if (!document) {
        logger.error(app_id, 'report_invalid_doc', '' + id);
        socket.emit('fruum:report');
        return;
      }
      //process plugins
      plugins.report(document, function(err, result) {
        document = result || document;
        var flags = document.extractFlags();
        storage.match_users(app_id, { admin: true }, function(administrators) {
          var application = App_applications[app_id];
          if (application && administrators.length) {
            email.inappropriate_notify(application, document, user, administrators, function() {});
          }
          socket.emit('fruum:report', document.toJSON());
        });
      });
    });
  }

  // -------------------------------- SEARCH -----------------------------------

  this.search = function(socket, payload) {
    if (!payload.q) {
      logger.error(socket.app_id, 'Missing search query', payload);
      socket.disconnect();
      return;
    }
    var that = this,
        app_id = socket.app_id,
        user = socket.fruum_user,
        is_admin = user.get('admin');
    storage.search(socket.app_id, payload.q, function(results) {
      var response = [];
      _.each(results, function(document) {
        if (is_admin || document.get('visible'))
          response.push(document.toJSON());
      });
      socket.emit('fruum:search', {
        q: payload.q,
        results: response
      });
    });
  }

  // ------------------------------- PRIVATE -----------------------------------

  function _validate_payload_id(socket, payload, command) {
    if (payload && !_isID(payload.id)) {
      logger.system(command + ': id is not a string or number');
      socket.disconnect();
      return false;
    }
    if (socket && !socket.fruum_user) {
      logger.system(command + ': No user found');
      socket.disconnect();
      return false;
    }
    return true;
  }
  //helper function to check if a document id is valid
  function _isID(obj) {
    return (typeof obj === 'string') || (typeof obj === 'number');
  };
  //emits a signal to all users viewing the same parent, in order to request
  //a refresh
  function _broadcast(by_user, document, action) {
    var app = App_users[by_user.get('app_id')];
    if (!app) return;
    var parent = document.get('parent');
    var id = document.get('id');
    var json = document.toJSON();
    _.each(app, function(user) {
      var viewing = user.get('viewing');
      var socket = user.get('socket');
      if ((viewing == parent || viewing == id) && user != by_user && socket) {
        if (user.get('admin') || document.get('visible'))
          socket.emit(action || 'fruum:dirty', json);
      }
    });
  };
  //count normal users viewing a document
  function _countNormalUsers(app_id, doc_id) {
    var app = App_users[app_id];
    if (!app) return 0;
    var counter = 0;
    _.each(app, function(user) {
      if (!user.get('anonymous') && user.get('viewing') == doc_id) counter++;
    });
    return counter;
  };
  //broadbast to all users viewing a document
  function _broadcastRaw(app_id, doc_id, action, json) {
    var app = App_users[app_id];
    if (!app) return;
    _.each(app, function(user) {
      if (user.get('viewing') == doc_id && user.get('socket'))
        user.get('socket').emit(action, json)
    });
  }
  //register user
  function _register_user(socket, payload, onready) {
    //create a new user and put it in the right collection
    //based on the app_id
    var app_id = payload.app_id,
        user = new Models.User();
    //bind user object to socket for quick access
    socket.fruum_user = user;
    socket.app_id = app_id;
    //if user is defined in the payload try to authenticate using
    //the authentication engine, otherwise consider user to be anonymous
    if (payload.user) {
      //authenticate user
      auth.authenticate(App_applications[app_id], payload.user, function(auth_user) {
        if (auth_user) {
          //update user object with authentication results
          user.set(auth_user.toJSON());
          //check for updating user details
          storage.get_user(app_id, user.get('id'), function(storage_user) {
            var now = Date.now();
            if (!storage_user) {
              //add new user since it does not exist
              user.set({
                created: now,
                last_login: now
              });
              storage.add_user(app_id, user, function() {
                onready(user);
              });
            }
            else {
              user.set({
                watch: storage_user.get('watch'),
                meta: storage_user.get('meta')
              });
              if (storage_user.needsUpdate(user)) {
                //update user details (including posts)
                user.set('last_login', now);
                storage.update_user(app_id, user, null, function(updated_user) {
                  onready(updated_user);
                });
              } // user not modified
              else {
                storage.update_user(app_id, user, { last_login: now }, function(updated_user) {
                  onready(updated_user);
                });
              }
            }
          });
        } //user not authenticated
        else { onready(user); }
      });
    } //no payload user object
    else { onready(user); }
  }
}
module.exports = Engine;
