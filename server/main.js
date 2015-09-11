/******************************************************************************
  Server main
*******************************************************************************/

'use strict';

// include libraries
var path = require('path'),
    express = require('express'),
    bodyParser = require('body-parser'),
    compress = require('compression'),
    request = require('request'),
    app = express(),
    http = require('http').Server(app),
    sass = require('node-sass'),
    io = require('socket.io')(http),
    fs = require('fs'),
    _ = require('underscore'),
    buildify = require('buildify'),
    logger = require('./logger');

function FruumServer(options) {
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

  //start Engine
  var ENGINE = require('./engine');
  var engine = new ENGINE(options, {
    server: app
  });

  // ----------------------------- COMMAND LINE --------------------------------

  if (options.setup) {
    //database setup
    engine.setup();
    return;
  }
  if (options.migrate) {
    //database migrate
    engine.migrate();
    return;
  }
  if (options.teardown) {
    //database teardown
    engine.teardown();
    return;
  }
  if (options.app) {
    //register new app
    switch (options.app.action) {
      case 'list':
        engine.list_apps();
        break;
      case 'gc':
        engine.gc(options.app.app_id);
        break;
      case 'add':
        engine.add_app(options.app);
        break;
      case 'update':
        engine.update_app(options.app);
        break;
      case 'delete':
        engine.delete_app(options.app);
        break;
      case 'create_api_key':
        engine.create_api_key(options.app);
        break;
      case 'delete_api_key':
        engine.delete_api_key(options.app);
        break;
      case 'list_api_keys':
        engine.list_api_keys(options.app);
        break;
    }
    return;
  }

  // ------------------------------ SERVER MODE --------------------------------

  // -------------------------------- PLUGINS ----------------------------------

  //load client plugins
  var plugin_templates = [], plugin_js = [];
  if (options.plugins) {
    //loop through plugins, initialize them and put them in the appropriate
    //plugin bucket
    _.each(options.plugins, function(plugin_name) {
      //check if server plugin exists
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
    'client/js/views/interactions.js',
    'client/js/views/search.js',
    'client/js/views/share.js',
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
    var cache_key = cache_namespace + ':' + app_id;
    var cache_data = engine.cache.get('static', cache_key);
    if (cache_data) {
      res.send(cache_data);
      return;
    }
    callback(app_id, cache_key);
  }
  //same as above but return application object as well
  function req_api_key_and_application(req, res, cache_namespace, callback) {
    req_api_key(req, res, cache_namespace, function(app_id, cache_key) {
      engine.get_app(app_id, function(application) {
        if (!application) {
          res.status(404).send('Invalid app_id');
          return;
        }
        callback(application, cache_key);
      });
    });
  }
  //get sass override text from theme path
  function get_sass_override(theme, callback) {
    //no theme
    if (!theme) {
      callback('');
    }
    //local theme
    else if (theme.indexOf('theme:') == 0) {
      theme = theme.replace('theme:', '');
      fs.readFile(fruum_root + '/themes/' + theme + '.scss', {encoding: 'utf8'}, function(err, data) {
        callback(data || '');
      });
    }
    //remote sass
    else if (theme.indexOf('http://') == 0 || theme.indexOf('https://') == 0) {
      request(theme, function(error, response, body) {
        if (!error && response.statusCode == 200) {
          callback(body);
        }
      });
    }
    //inline sass
    else {
      callback(theme);
    }
  }

  // -------------------------------- FRUUM.JS ---------------------------------

  app.get('/fruum.js', function(req, res) {
    req_api_key(req, res, 'fruum.js', function(app_id, cache_key) {
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
      engine.cache.put('static', cache_key, cache_data);
      res.type('text/javascript');
      res.send(cache_data);
    });
  });

  // --------------------------- FRUUM_SLIM.JS ---------------------------------

  app.get('/fruum_slim.js', function(req, res) {
    req_api_key(req, res, 'fruum_slim.js', function(app_id, cache_key) {
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
      engine.cache.put('static', cache_key, cache_data);
      res.type('text/javascript');
      res.send(cache_data);
    });
  });

  // ------------------------------- FRUUM.HTML --------------------------------

  app.get('/fruum.html', function(req, res) {
    req_api_key(req, res, 'fruum.html', function(app_id, cache_key) {
      var benchmark = Date.now();
      var cache_data = buildify()
        .setDir(fruum_root)
        .load('client/templates/main.html')
        .concat(_.union([
          'client/templates/breadcrumb.html',
          'client/templates/interactions.html',
          'client/templates/search.html',
          'client/templates/categories.html',
          'client/templates/loading.html',
          'client/templates/threads.html',
          'client/templates/articles.html',
          'client/templates/channels.html',
          'client/templates/title.html',
          'client/templates/filters.html',
          'client/templates/counters.html',
          'client/templates/posts.html'], plugin_templates))
        .getContent();
      logger.info(
        app_id, 'fruum.html',
        'Time:' + (Date.now() - benchmark) + 'msec Size:' + ((cache_data.length / 1024)|0) + 'kb'
      );
      engine.cache.put('static', cache_key, cache_data);
      res.type('text/html');
      res.send(cache_data);
    });
  });

  // ------------------------------- FRUUM.CSS ---------------------------------

  app.get('/fruum.css', function(req, res) {
    req_api_key_and_application(req, res, 'fruum.css', function(application, cache_key) {
      var benchmark = Date.now();
      get_sass_override(application.get('theme'), function(overrides) {
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
            engine.cache.put('static', cache_key, cache_data);
            res.type('text/css');
            res.send(cache_data);
          }
        });
      });
    });
  });

  // -------------------------------- LOADER.JS --------------------------------

  app.get('/loader.js', function(req, res) {
    req_api_key_and_application(req, res, 'loader.js', function(application, cache_key) {
      var benchmark = Date.now();
      get_sass_override(application.get('theme'), function(overrides) {
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
                              replace('__html__', html).
                              replace('__url__', options.url);
            logger.info(
              application.get('id'), 'loader.js',
              'Time:' + (Date.now() - benchmark) + 'msec Size:' + ((cache_data.length / 1024)|0) + 'kb'
            );
            engine.cache.put('static', cache_key, cache_data);
            res.type('text/javascript');
            res.send(cache_data);
          }
        });
      });
    });
  });

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
      engine.auth(socket, payload || {}, function() {
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
          socket.on('fruum:report', function(payload) {
            engine.report(socket, payload || {});
          });
          socket.on('fruum:search', function(payload) {
            engine.search(socket, payload || {});
          });
        }
      });
    });
  });

  // ----------------------------- HTTP SERVER ---------------------------------

  http.listen(process.env.PORT || options.port, function(){
    logger.system("Listening connection on port " + (process.env.PORT || options.port));
  });
}
module.exports = FruumServer;
