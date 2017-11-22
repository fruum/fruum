/******************************************************************************
  Server main
*******************************************************************************/

'use strict';

// include libraries
var path = require('path'),
    express = require('express'),
    bodyParser = require('body-parser'),
    compress = require('compression'),
    UglifyJS = require('uglify-js'),
    app = express(),
    http = require('http').Server(app),
    sass = require('node-sass'),
    io = require('socket.io')(http),
    fs = require('fs'),
    mkdirp = require('mkdirp'),
    _ = require('underscore'),
    Raven = require('raven'),
    logger = require('./logger'),
    BUILD_FOLDER = path.join(__dirname, '/../build');

// concatenate an array of files (synchronously)
function concat_files(base_dir, files) {
  var output = '';
  _.each(files, function(file) {
    output += fs.readFileSync(path.join(base_dir, file), 'utf8');
  });
  return output;
}

// minify code
function minify(code) {
  var result = UglifyJS.minify(code, { mangle: false });
  if (result.error) throw result.error;
  return result.code;
}

function FruumServer(options, cli_cmd, ready) {
  logger.system('Starting Fruum');
  options = options || {};

  // start sentry
  if (options.sentry && options.sentry.dsn) {
    logger.system('Sentry is enabled');
    Raven.config(options.sentry.dsn).install();
    Raven.install(function() {
      process.exit(1);
    });
  } else {
    logger.system('Sentry is disabled');
  }

  logger.system('Creating build folder');
  mkdirp.sync(BUILD_FOLDER);

  // defaults
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
  options.docs.max_bookmark_title_size = Math.max(0, options.docs.max_bookmark_title_size || 0);
  options.docs.max_category_title_size = Math.max(0, options.docs.max_category_title_size || 0);
  options.docs.max_category_description_size = Math.max(0, options.docs.max_category_description_size || 0);
  options.docs.max_thread_title_size = Math.max(0, options.docs.max_thread_title_size || 0);
  options.docs.max_article_title_size = Math.max(0, options.docs.max_article_title_size || 0);
  options.docs.max_blog_title_size = Math.max(0, options.docs.max_blog_title_size || 0);
  options.docs.max_channel_name_size = Math.max(0, options.docs.max_channel_name_size || 0);
  options.docs.max_post_size = Math.max(0, options.docs.max_post_size || 0);

  // client folder absolute path
  var client_root = path.resolve(__dirname + '/../client');
  var loader_root = path.resolve(__dirname + '/../loader');
  var fruum_root = path.resolve(__dirname + '/..');

  // create logs folder
  if (!fs.existsSync(options.logs)) {
    logger.system('Creating logs folder: ' + options.logs);
    fs.mkdirSync(options.logs);
  }

  // suppress plugins on CLI
  if (cli_cmd) delete options.plugins;

  // ------------------------------ SERVER SETUP -------------------------------

  if (options.sentry && options.sentry.dsn) {
    app.use(Raven.requestHandler());
  }

  // enable CORS
  app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
  });

  // enable compression on express
  app.use(compress());

  // enable body parse (required for POST)
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());

  // ------------------------------ ENGINE START -------------------------------

  // start Engine
  var ENGINE = require('./engine');
  var instance = {
    server: app,
  };
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
      case 'list_users':
        engine.list_users(cli_cmd.params);
        break;
      case 'gc_app':
        engine.gc(cli_cmd.params.app_id);
        break;
      case 'search_users':
        engine.search_users(cli_cmd.params);
        break;
      case 'delete_user':
        engine.delete_user(cli_cmd.params);
        break;
    }
    return;
  }

  // -------------------------------- PLUGINS ----------------------------------

  // load client plugins
  var plugin_templates = [], plugin_js = [];
  if (options.plugins) {
    // loop through plugins, initialize them and put them in the appropriate
    // plugin bucket
    _.each(options.plugins, function(plugin_name) {
      // check if plugin exists
      try {
        var path = __dirname + '/../plugins/' + plugin_name + '/';
        // check for javascript
        var stats = fs.lstatSync(path + 'client.js');
        if (stats.isFile()) {
          plugin_js.push('plugins/' + plugin_name + '/client.js');
          logger.system('Using client plugin: ' + plugin_name);
        }
        // check for template
        stats = fs.lstatSync(path + 'template.html');
        if (stats.isFile()) {
          plugin_templates.push('plugins/' + plugin_name + '/template.html');
          logger.system('Using client template: ' + plugin_name);
        }
      } catch (err) {}
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
    'client/js/views/profile.js',
    'client/js/views/breadcrumb.js',
    'client/js/views/title.js',
    'client/js/views/filters.js',
    'client/js/views/counters.js',
    'client/js/views/categories.js',
    'client/js/views/posts.js',
    'client/js/views/threads.js',
    'client/js/views/articles.js',
    'client/js/views/blogs.js',
    'client/js/views/channels.js',
    'client/js/views/autocomplete.js',
    'client/js/views/emojipanel.js',
    'client/js/views/attachments.js',
    'client/js/views/interactions.js',
    'client/js/views/search.js',
    'client/js/views/bookmark.js',
    'client/js/views/onboarding.js',
    'client/js/views/share.js',
    'client/js/views/move.js',
    'client/js/views/empty.js'
  ];

  // -------------------------- JAVASCRIPT  ------------------------------------

  var JS_BUILD = {};
  function _get_js(req, res) {
    var app_id = req.params.app_id || req.query.app_id;
    if (!app_id) {
      res.status(400).send('GET param app_id is not defined');
      return;
    }
    // check for already built lib
    if (JS_BUILD[app_id]) {
      res.type('js');
      res.sendFile(JS_BUILD[app_id], function(err) {
        if (err) {
          logger.error(app_id, 'Could not send JS', err);
          res.status(err.status).end();
        } else {
          logger.info(app_id, 'Sent', JS_BUILD[app_id]);
        }
      });
      return;
    }
    // build from scratch
    var benchmark = Date.now();
    // build libs
    var output = concat_files(fruum_root, [
      // Libraries
      'client/js/libs/preload.js',
      'client/js/libs/jquery.js',
      'client/js/libs/underscore.js',
      'client/js/libs/backbone.js',
      'client/js/libs/radio.js',
      'client/js/libs/marionette.js',
      'client/js/libs/moment.js',
      'client/js/libs/remarkable.js',
      'client/js/libs/purify.js',
      'client/js/libs/socketio.js',
      'client/js/libs/to_markdown.js',
      'client/js/libs/postload.js'
    ]);
    var app_build = concat_files(fruum_root,
      _.union(
        web_app,
        plugin_js,
        ['client/js/main.js']
      ));
    // minimize js only when we are on cache mode
    if (options.compress) app_build = minify(app_build);
    // get output
    output += app_build.replace('__url__', options.url);
    logger.info(
      app_id, 'get/js',
      'Time:' + (Date.now() - benchmark) + 'msec Size:' + ((output.length / 1024) | 0) + 'kb'
    );
    var build_path = BUILD_FOLDER + '/' + app_id + '.js.out';
    try {
      fs.writeFileSync(build_path, output);
      JS_BUILD[app_id] = build_path;
      res.type('js');
      res.sendFile(build_path);
    } catch (err) {
      res.status(500).send('Could not build JS file');
    }
  }
  app.get('/_/get/js/:app_id', _get_js);

  // ----------------------------------- HTML ----------------------------------

  var HTML_BUILD = {};
  function _get_html(req, res) {
    var app_id = req.params.app_id || req.query.app_id;
    if (!app_id) {
      res.status(400).send('GET param app_id is not defined');
      return;
    }
    // check for already built html
    if (HTML_BUILD[app_id]) {
      res.type('html');
      res.sendFile(HTML_BUILD[app_id], function(err) {
        if (err) {
          logger.error(app_id, 'Could not send HTML', err);
          res.status(err.status).end();
        } else {
          logger.info(app_id, 'Sent', HTML_BUILD[app_id]);
        }
      });
      return;
    }
    // build from scratch
    var benchmark = Date.now();
    var output = concat_files(fruum_root,
      _.union([
        'client/templates/main.html',
        'client/templates/profile.html',
        'client/templates/persona.html',
        'client/templates/breadcrumb.html',
        'client/templates/interactions.html',
        'client/templates/autocomplete.html',
        'client/templates/emojipanel.html',
        'client/templates/attachments.html',
        'client/templates/search.html',
        'client/templates/bookmark.html',
        'client/templates/onboarding.html',
        'client/templates/categories.html',
        'client/templates/loading.html',
        'client/templates/threads.html',
        'client/templates/articles.html',
        'client/templates/blog.html',
        'client/templates/channels.html',
        'client/templates/title.html',
        'client/templates/filters.html',
        'client/templates/counters.html',
        'client/templates/move.html',
        'client/templates/posts.html'], plugin_templates));

    logger.info(
      app_id, 'get/html',
      'Time:' + (Date.now() - benchmark) + 'msec Size:' + ((output.length / 1024) | 0) + 'kb'
    );
    var build_path = BUILD_FOLDER + '/' + app_id + '.html.out';
    try {
      fs.writeFileSync(build_path, output);
      HTML_BUILD[app_id] = build_path;
      res.type('html');
      res.sendFile(build_path);
    } catch (err) {
      res.status(500).send('Could not build HTML file');
    }
  }
  app.get('/_/get/html/:app_id', _get_html);

  // ---------------------------------- STYLE ----------------------------------

  var STYLE_BUILD = {};
  function _get_style(req, res) {
    var app_id = req.params.app_id || req.query.app_id;
    if (!app_id) {
      res.status(400).send('GET param app_id is not defined');
      return;
    }
    // check for already built style
    if (STYLE_BUILD[app_id]) {
      res.type('css');
      res.sendFile(STYLE_BUILD[app_id], function(err) {
        if (err) {
          logger.error(app_id, 'Could not send CSS', err);
          res.status(err.status).end();
        } else {
          logger.info(app_id, 'Sent', STYLE_BUILD[app_id]);
        }
      });
      return;
    }
    engine.get_app(app_id, function(application) {
      if (!application) {
        res.status(404).send('Invalid app_id');
        return;
      }
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
          } else {
            var output = result.css;
            logger.info(
              application.get('id'), 'get/style',
              'Time:' + (Date.now() - benchmark) + 'msec Size:' + ((output.length / 1024) | 0) + 'kb'
            );
            var build_path = BUILD_FOLDER + '/' + app_id + '.css.out';
            try {
              fs.writeFileSync(build_path, output);
              STYLE_BUILD[app_id] = build_path;
              res.type('css');
              res.sendFile(build_path);
            } catch (err) {
              res.status(500).send('Could not build CSS file');
            }
          }
        });
      });
    });
  }
  app.get('/_/get/style/:app_id', _get_style);

  // --------------------------------- LOADER  ---------------------------------

  var LOADER_BUILD = {};
  function _get_loader(req, res) {
    var app_id = req.params.app_id || req.query.app_id;
    if (!app_id) {
      res.status(400).send('GET param app_id is not defined');
      return;
    }
    // check for already built style
    if (LOADER_BUILD[app_id]) {
      res.type('js');
      res.sendFile(LOADER_BUILD[app_id], function(err) {
        if (err) {
          logger.error(app_id, 'Could not send Loader', err);
          res.status(err.status).end();
        } else {
          logger.info(app_id, 'Sent', LOADER_BUILD[app_id]);
        }
      });
      return;
    }
    engine.get_app(app_id, function(application) {
      if (!application) {
        res.status(404).send('Invalid app_id');
        return;
      }
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
          } else {
            var css = result.css;
            // load templates
            var html = concat_files(fruum_root, [
              'loader/template.html'
            ]);
            // load javascript
            var js = concat_files(fruum_root, [
              'loader/loader.js'
            ]);
            // minimize js only when we are on cache mode
            if (options.compress) js = minify(js);
            // variable replace
            html = html.replace(/\n/g, '');
            css = _.escape(css).replace(/\n/g, '');
            var output = js.replace(/"/g, "'").
              replace('__css__', css).
              replace('__app_id__', application.get('id')).
              replace('__fullpage_url__', application.get('fullpage_url')).
              replace('__pushstate__', application.get('pushstate') ? '1' : '0').
              replace('__sso__', application.get('auth_url') ? '1' : '0').
              replace('__html__', html).
              replace('__url__', options.url);
            logger.info(
              application.get('id'), 'get/loader',
              'Time:' + (Date.now() - benchmark) + 'msec Size:' + ((output.length / 1024) | 0) + 'kb'
            );
            var build_path = BUILD_FOLDER + '/' + app_id + '.loader.out';
            try {
              fs.writeFileSync(build_path, output);
              LOADER_BUILD[app_id] = build_path;
              res.type('js');
              res.sendFile(build_path);
            } catch (err) {
              res.status(500).send('Could not build Loader file');
            }
          }
        });
      });
    });
  }
  app.get('/loader.js', _get_loader); // DEPRECATED
  app.get('/go/:app_id', _get_loader);

  // ----------------------------------- SEO -----------------------------------

  function _get_robot(req, res) {
    var app_id = req.params.app_id,
        doc_id = req.params.doc_id || 'home';
    engine.get_app(app_id, function(application) {
      if (!application) {
        res.status(404).send('Invalid app_id');
        return;
      }
      engine.robot(app_id, doc_id, function(response) {
        // get template
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
  app.get('/_/robot/:app_id/v/:doc_id', _get_robot);
  app.get('/_/robot/:app_id', _get_robot);

  // ---------------------------------- STATIC ---------------------------------

  app.use(options.static_prefix, express.static(options.static_root));

  // --------------------------------- CONNECT ---------------------------------

  io.on('connection', function(socket) {
    engine.connect(socket);
    socket.on('disconnect', function() {
      engine.disconnect(socket);
    });
    socket.on('fruum:auth', function(payload) {
      // authenticate
      engine.authenticate(socket, payload || {}, function() {
        // bind callbacks on successful auth
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
          socket.on('fruum:onboard', function(payload) {
            engine.onboard(socket, payload || {});
          });
          socket.on('fruum:optimize', function(payload) {
            engine.optimize(socket, payload || {});
          });
          socket.on('fruum:profile', function(payload) {
            engine.profile(socket, payload || {});
          });
          socket.on('fruum:user:block', function(payload) {
            engine.block_user(socket, payload || {});
          });
          socket.on('fruum:user:unblock', function(payload) {
            engine.unblock_user(socket, payload || {});
          });
          socket.on('fruum:user:remove', function(payload) {
            engine.remove_user(socket, payload || {});
          });
          socket.on('fruum:user:feed', function(payload) {
            engine.user_feed(socket, payload || {});
          });
          socket.on('fruum:user:list', function(payload) {
            engine.user_list(socket, payload || {});
          });
        }
      });
    });
  });

  if (options.sentry && options.sentry.dsn) {
    app.use(Raven.errorHandler());
  }

  // ----------------------------- HTTP SERVER ---------------------------------

  http.listen(process.env.PORT || options.port, function() {
    logger.system('Base URL is: ' + options.url);
    logger.system('Listening connection on port ' + (process.env.PORT || options.port));
    ready && ready();
  });
}

module.exports = FruumServer;
