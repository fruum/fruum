/******************************************************************************
  Server main
*******************************************************************************/

'use strict';

// include libraries
var path = require('path'),
    express = require('express'),
    bodyParser = require('body-parser'),
    compress = require('compression'),
    app = express(),
    http = require('http').Server(app),
    sass = require('node-sass'),
    io = require('socket.io')(http),
    fs = require('fs'),
    _ = require('underscore'),
    buildify = require('buildify'),
    logger = require('./logger');

function FruumServer(options, cli_cmd, ready) {
  logger.system("Starting Fruum");
  options = options || {};
  //defaults
  options.static_root = path.resolve(
     __dirname + '/../' + (options.static_root || 'static')
  );
  options.static_prefix = options.static_prefix || '/static';
  options.port = options.port || 3000;
  options.storage_engine = options.storage_engine || 'base';
  options.auth_engine = options.auth_engine || 'base';
  options.email_engine = options.email_engine || 'base';
  options.cache_engine = options.cache_engine || 'memory_cache';
  options.logs = path.resolve(options.logs || './logs');

  options.docs = options.docs || {};
  options.docs.max_category_title_size = Math.max(0, options.docs.max_category_title_size || 0);
  options.docs.max_category_description_size = Math.max(0, options.docs.max_category_description_size || 0);
  options.docs.max_thread_title_size = Math.max(0, options.docs.max_thread_title_size || 0);
  options.docs.max_article_title_size = Math.max(0, options.docs.max_article_title_size || 0);
  options.docs.max_channel_name_size = Math.max(0, options.docs.max_channel_name_size || 0);
  options.docs.max_post_size = Math.max(0, options.docs.max_post_size || 0);

  //client folder absolute path
  var client_root = path.resolve(__dirname + '/../client');
  var loader_root = path.resolve(__dirname + '/../loader');
  var fruum_root = path.resolve(__dirname + '/..');

  //create logs folder
  if (!fs.existsSync(options.logs)) {
    logger.system("Creating logs folder: " + options.logs);
    fs.mkdirSync(options.logs);
  }

  //suppress plugins on CLI
  if (cli_cmd) delete options.plugins;

  // ------------------------------ SERVER SETUP -------------------------------

  //enable CORS
  app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
  });

  //enable compression on express
  app.use(compress());

  //enable body parse (required for POST)
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());

  // ------------------------------ ENGINE START -------------------------------

  //start Engine
  var ENGINE = require('./engine');
  var instance = {
    server: app
  }
  var engine = new ENGINE(options, instance);

  // ----------------------------- COMMAND LINE --------------------------------

  if (cli_cmd) {
    switch (cli_cmd.action) {
      case 'setup':
        engine.setup();
        break;
      case 'migrate':
        engine.migrate();
        break;
      case 'teardown':
        engine.teardown();
        break;
      case 'set_app_property':
        engine.set_app_property(cli_cmd.params);
        break;
      case 'get_app_property':
        engine.get_app_property(cli_cmd.params);
        break;
      case 'create_api_key':
        engine.create_api_key(cli_cmd.params);
        break;
      case 'list_api_keys':
        engine.list_api_keys(cli_cmd.params);
        break;
      case 'delete_api_key':
        engine.delete_api_key(cli_cmd.params);
        break;
      case 'add_app':
        engine.add_app(cli_cmd.params);
        break;
      case 'update_app':
        engine.update_app(cli_cmd.params);
        break;
      case 'delete_app':
        engine.delete_app(cli_cmd.params);
        break;
      case 'list_apps':
        engine.list_apps();
        break;
      case 'reset_users':
        engine.reset_users(cli_cmd.params);
        break;
      case 'gc_app':
        engine.gc(cli_cmd.params.app_id);
        break;
    }
    return;
  }

  // -------------------------------- PLUGINS ----------------------------------

  //load client plugins
  var plugin_templates = [], plugin_js = [];
  if (options.plugins) {
    //loop through plugins, initialize them and put them in the appropriate
    //plugin bucket
    _.each(options.plugins, function(plugin_name) {
      //check if plugin exists
      try {
        var path = __dirname + '/../plugins/' + plugin_name + '/';
        //check for javascript
        var stats = fs.lstatSync(path + 'client.js');
        if (stats.isFile()) {
          plugin_js.push('plugins/' + plugin_name + '/client.js');
          logger.system('Using client plugin: ' + plugin_name);
        }
        //check for template
        stats = fs.lstatSync(path + 'template.html');
        if (stats.isFile()) {
          plugin_templates.push('plugins/' + plugin_name + '/template.html');
          logger.system('Using client template: ' + plugin_name);
        }
      }
      catch(err) {}
    });
  }

  var web_app = [
    'client/js/defs.js',
    'client/js/extensions/easing.js',
    'client/js/extensions/fieldselection.js',
    'client/js/extensions/nanoscroller.js',
    'client/js/emoji.js',
    'client/js/utils.js',
    'client/js/models.js',
    'client/js/collections.js',
    'client/js/views/loading.js',
    'client/js/views/breadcrumb.js',
    'client/js/views/title.js',
    'client/js/views/filters.js',
    'client/js/views/counters.js',
    'client/js/views/categories.js',
    'client/js/views/posts.js',
    'client/js/views/threads.js',
    'client/js/views/articles.js',
    'client/js/views/channels.js',
    'client/js/views/autocomplete.js',
    'client/js/views/emojipanel.js',
    'client/js/views/interactions.js',
    'client/js/views/search.js',
    'client/js/views/notifications.js',
    'client/js/views/share.js',
    'client/js/views/move.js',
    'client/js/views/empty.js'
  ];

  // -------------------------------- HELPERS ----------------------------------

  //Validate api_id in request GET params and returned cached response or
  //hit callback if not cache exists
  function req_api_key(req, res, cache_namespace, callback) {
    var app_id = req.query.app_id;
    if (!app_id) {
      res.status(400).send('GET param app_id is not defined');
      return;
    }
    var cache_entry = engine.CACHE_DEFS[cache_namespace];
    if (!cache_entry) {
      res.status(500).send('Cache namespace error');
      return;
    }
    var cache_key = cache_entry.key.replace('{app_id}', app_id);
    var cache_data = engine.cache.get(cache_entry.queue, cache_key);
    if (cache_data) {
      res.send(cache_data);
      return;
    }
    callback(app_id, cache_key, cache_entry.queue);
  }
  //same as above but return application object as well
  function req_api_key_and_application(req, res, cache_namespace, callback) {
    req_api_key(req, res, cache_namespace, function(app_id, cache_key, cache_queue) {
      engine.get_app(app_id, function(application) {
        if (!application) {
          res.status(404).send('Invalid app_id');
          return;
        }
        callback(application, cache_key, cache_queue);
      });
    });
  }

  // -------------------------------- FRUUM.JS ---------------------------------

  app.get('/fruum.js', function(req, res) {
    req_api_key(req, res, 'fruum.js', function(app_id, cache_key, cache_queue) {
      var benchmark = Date.now();
      var builder = buildify()
        .setDir(fruum_root)
        .concat(_.union(
          [
            //Libraries
            'client/js/libs/preload.js',
            'client/js/libs/jquery.js',
            'client/js/libs/underscore.js',
            'client/js/libs/backbone.js',
            'client/js/libs/marionette.js',
            'client/js/libs/moment.js',
            'client/js/libs/marked.js',
            'client/js/libs/socketio.js',
            'client/js/libs/postload.js'
          ],
          web_app,
          plugin_js,
          ['client/js/main.js']));
      //minimize js only when we are on cache mode
      if (options.compress) builder = builder.uglify();
      //get output
      var cache_data = builder.getContent().replace('__url__', options.url);
      logger.info(
        app_id, 'fruum.js',
        'Time:' + (Date.now() - benchmark) + 'msec Size:' + ((cache_data.length / 1024)|0) + 'kb'
      );
      engine.cache.put(cache_queue, cache_key, cache_data);
      res.type('text/javascript');
      res.send(cache_data);
    });
  });

  // --------------------------- FRUUM_SLIM.JS ---------------------------------

  app.get('/fruum_slim.js', function(req, res) {
    req_api_key(req, res, 'fruum_slim.js', function(app_id, cache_key, cache_queue) {
      var benchmark = Date.now();
      var builder = buildify()
        .setDir(fruum_root)
        .concat(_.union(
          [
            //Libraries
            'client/js/libs/bindlibs.js'
          ],
          web_app,
          plugin_js,
          ['client/js/main.js']));
      //minimize js only when we are on cache mode
      if (options.compress) builder = builder.uglify({mangle: false});
      //get output
      var cache_data = builder.getContent().replace('__url__', options.url);
      logger.info(
        app_id, 'fruum_slim.js',
        'Time:' + (Date.now() - benchmark) + 'msec Size:' + ((cache_data.length / 1024)|0) + 'kb'
      );
      engine.cache.put(cache_queue, cache_key, cache_data);
      res.type('text/javascript');
      res.send(cache_data);
    });
  });

  // ------------------------------- FRUUM.HTML --------------------------------

  app.get('/fruum.html', function(req, res) {
    req_api_key(req, res, 'fruum.html', function(app_id, cache_key, cache_queue) {
      var benchmark = Date.now();
      var cache_data = buildify()
        .setDir(fruum_root)
        .load('client/templates/main.html')
        .concat(_.union([
          'client/templates/breadcrumb.html',
          'client/templates/interactions.html',
          'client/templates/autocomplete.html',
          'client/templates/emojipanel.html',
          'client/templates/search.html',
          'client/templates/notifications.html',
          'client/templates/categories.html',
          'client/templates/loading.html',
          'client/templates/threads.html',
          'client/templates/articles.html',
          'client/templates/channels.html',
          'client/templates/title.html',
          'client/templates/filters.html',
          'client/templates/counters.html',
          'client/templates/move.html',
          'client/templates/posts.html'], plugin_templates))
        .getContent();
      logger.info(
        app_id, 'fruum.html',
        'Time:' + (Date.now() - benchmark) + 'msec Size:' + ((cache_data.length / 1024)|0) + 'kb'
      );
      engine.cache.put(cache_queue, cache_key, cache_data);
      res.type('text/html');
      res.send(cache_data);
    });
  });

  // ------------------------------- FRUUM.CSS ---------------------------------

  app.get('/fruum.css', function(req, res) {
    req_api_key_and_application(req, res, 'fruum.css', function(application, cache_key, cache_queue) {
      var benchmark = Date.now();
      application.getThemeSass(function(overrides) {
        var main_sass = fs.readFileSync(client_root + '/style/fruum.scss', {encoding: 'utf8'});
        main_sass = main_sass.replace('//__APPLICATION_CUSTOM_SASS__', overrides);
        sass.render({
          data: main_sass,
          outputStyle: 'compressed',
          includePaths: [ client_root + '/style/' ],
        }, function(error, result) {
          if (error) {
            var msg = 'Status: ' + error.status + '\n' +
                      'Column: ' + error.column + '\n' +
                      'Message: ' + error.message + '\n' +
                      'Line: ' + error.line + '\n' +
                      main_sass;
            logger.error(application.get('id'), 'sass', msg);
            res.status(500).send(msg);
          }
          else {
            var cache_data = result.css;
            logger.info(
              application.get('id'), 'fruum.css',
              'Time:' + (Date.now() - benchmark) + 'msec Size:' + ((cache_data.length / 1024)|0) + 'kb'
            );
            engine.cache.put(cache_queue, cache_key, cache_data);
            res.type('text/css');
            res.send(cache_data);
          }
        });
      });
    });
  });

  // -------------------------------- LOADER.JS --------------------------------

  app.get('/loader.js', function(req, res) {
    req_api_key_and_application(req, res, 'loader.js', function(application, cache_key, cache_queue) {
      var benchmark = Date.now();
      application.getThemeSass(function(overrides) {
        var main_sass = fs.readFileSync(loader_root + '/style.scss', {encoding: 'utf8'});
        main_sass = main_sass.replace('//__APPLICATION_CUSTOM_SASS__', overrides);
        sass.render({
          data: main_sass,
          outputStyle: 'compressed',
          includePaths: [ loader_root + '/' ],
        }, function(error, result) {
          if (error) {
            var msg = 'Status: ' + error.status + '\n' +
                      'Column: ' + error.column + '\n' +
                      'Message: ' + error.message + '\n' +
                      'Line: ' + error.line + '\n' +
                      main_sass;
            logger.error(application.get('id'), 'sass', msg);
            res.status(500).send(msg);
          }
          else {
            var css = result.css;
            //load templates
            var html = buildify()
              .setDir(fruum_root)
              .load('loader/template.html')
              .getContent();
            //load javascript
            var builder_js = buildify()
              .setDir(fruum_root)
              .concat(['loader/loader.js']);
              //minimize js only when we are on cache mode
            if (options.compress) builder_js = builder_js.uglify();
              //get output
            var js = builder_js.getContent();
            html = html.replace(/\n/g, '');
            css = _.escape(css).replace(/\n/g, '');
            var cache_data = js.replace(/"/g,  "'").replace('__css__', css).
                              replace('__app_id__', application.get('id')).
                              replace('__fullpage_url__', application.get('fullpage_url')).
                              replace('__pushstate__', application.get('pushstate')?'1':'0').
                              replace('__sso__', application.get('auth_url')?'1':'0').
                              replace('__html__', html).
                              replace('__url__', options.url);
            logger.info(
              application.get('id'), 'loader.js',
              'Time:' + (Date.now() - benchmark) + 'msec Size:' + ((cache_data.length / 1024)|0) + 'kb'
            );
            engine.cache.put(cache_queue, cache_key, cache_data);
            res.type('text/javascript');
            res.send(cache_data);
          }
        });
      });
    });
  });

  // ----------------------------------- SEO -----------------------------------

  function get_robot(req, res) {
    var app_id = req.params.app_id,
        doc_id = req.params.doc_id || 'home';

    engine.get_app(app_id, function(application) {
      if (!application) {
        res.status(404).send('Invalid app_id');
        return;
      }
      engine.robot(app_id, doc_id, function(response) {
        //get template
        fs.readFile(__dirname + '/../loader/robot.html', 'utf8', function(err, data) {
          if (err) {
            res.status(500).send('Could not load template');
            return;
          }
          var template = _.template(data || '');
          response.application = application.toJSON();
          response.getShareURL = application.getShareURL.bind(application);
          res.send(template(response));
        });
      });
    });

  }
  app.get('/robot/:app_id/v/:doc_id', get_robot);
  app.get('/robot/:app_id', get_robot);

  // ---------------------------------- STATIC ---------------------------------

  app.use(options.static_prefix, express.static(options.static_root));

  // --------------------------------- CONNECT ---------------------------------

  io.on('connection', function(socket){
    engine.connect(socket);
    socket.on('disconnect', function() {
      engine.disconnect(socket);
    });
    socket.on('fruum:auth', function(payload) {
      //authenticate
      engine.authenticate(socket, payload || {}, function() {
        //bind callbacks on successful auth
        if (socket.fruum_user) {
          socket.on('fruum:view', function(payload) {
            engine.view(socket, payload || {});
          });
          socket.on('fruum:delete', function(payload) {
            engine.delete(socket, payload || {});
          });
          socket.on('fruum:archive', function(payload) {
            engine.archive(socket, payload || {});
          });
          socket.on('fruum:restore', function(payload) {
            engine.restore(socket, payload || {});
          });
          socket.on('fruum:add', function(payload) {
            engine.add(socket, payload || {});
          });
          socket.on('fruum:update', function(payload) {
            engine.update(socket, payload || {});
          });
          socket.on('fruum:field', function(payload) {
            engine.field(socket, payload || {});
          });
          socket.on('fruum:watch', function(payload) {
            engine.watch(socket, payload || {});
          });
          socket.on('fruum:unwatch', function(payload) {
            engine.unwatch(socket, payload || {});
          });
          socket.on('fruum:notifications', function(payload) {
            engine.notifications(socket, payload || {});
          });
          socket.on('fruum:notify', function(payload) {
            engine.notify(socket, payload || {});
          });
          socket.on('fruum:unnotify', function(payload) {
            engine.unnotify(socket, payload || {});
          });
          socket.on('fruum:report', function(payload) {
            engine.report(socket, payload || {});
          });
          socket.on('fruum:react', function(payload) {
            engine.react(socket, payload || {});
          });
          socket.on('fruum:search', function(payload) {
            engine.search(socket, payload || {});
          });
          socket.on('fruum:autocomplete', function(payload) {
            engine.autocomplete(socket, payload || {});
          });
          socket.on('fruum:move', function(payload) {
            engine.move(socket, payload || {});
          });
          socket.on('fruum:categories', function(payload) {
            engine.categories(socket, payload || {});
          });
          socket.on('fruum:typing', function(payload) {
            engine.typing(socket, payload || {});
          });
        }
      });
    });
  });

  // ----------------------------- HTTP SERVER ---------------------------------

  http.listen(process.env.PORT || options.port, function(){
    logger.system("Listening connection on port " + (process.env.PORT || options.port));
    ready && ready();
  });

}
module.exports = FruumServer;
