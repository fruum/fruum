/******************************************************************************
 Notifications
*******************************************************************************/

'use strict';

var _ = require('underscore'),
    sass = require('node-sass'),
    fs = require('fs'),
    logger = require('../logger');

module.exports = function(options, instance, self) {
  var storage = self.storage,
      app_users = self.app_users;

  // -----------------------------NOTIFICATIONS --------------------------------

  self.notifications = function(socket, payload) {
    var app_id = socket.app_id,
        user = socket.fruum_user,
        is_admin = user.get('admin');

    if (user.get('anonymous')) {
      logger.error(app_id, 'notifications_anonymous_noperm', user);
      socket.emit('fruum:notifications');
      self.fail(payload);
      return;
    }
    if (payload.ids && payload.ids.length) {
      storage.mget(app_id, payload.ids, function(documents) {
        var response = [];
        _.each(documents, function(document) {
          if ((is_admin || document.get('visible')) && !document.get('archived')) {
            response.push(document.toJSON());
          }
        });
        socket.emit('fruum:notifications', {
          notifications: response,
        });
        self.success(payload);
      }, { skipfields: ['attachments'] });
    }
  };

  self.notify = function(socket, payload) {
    // noop
    self.success(payload);
  };

  self.unnotify = function(socket, payload) {
    if (!self.validatePayloadID(socket, payload, 'unnotify')) {
      self.fail(payload);
      return;
    }
    var app_id = socket.app_id,
        user = socket.fruum_user;

    if (user.get('anonymous')) {
      logger.error(app_id, 'unnotify_anonymous_noperm', user);
      socket.emit('fruum:unnotify');
      self.fail(payload);
      return;
    }
    if ((user.get('notifications') || []).indexOf(payload.id) != -1) {
      // get latest user
      storage.get_user(app_id, user.get('id'), function(storage_user) {
        if (storage_user) {
          var notifications = _.without(storage_user.get('notifications') || [], payload.id);
          user.set('notifications', notifications);
          storage.update_user(app_id, user, { notifications: notifications }, function(updated_user) {
          });
        }
      });
    }
    socket.emit('fruum:unnotify', { id: payload.id });
    self.success(payload);
  };

  self.typing = function(socket, payload) {
    if (!self.validatePayloadID(socket, null, 'typing')) {
      self.fail(payload);
      return;
    }
    var app_id = socket.app_id,
        app = app_users[app_id],
        user = socket.fruum_user,
        doc_id = user.get('viewing');

    if (user.get('anonymous') || !app) {
      logger.error(app_id, 'typing_anonymous_noperm', user);
      self.fail(payload);
      return;
    }

    _.each(app, function(app_user) {
      if (user != app_user &&
          app_user.get('viewing') == doc_id &&
          app_user.get('socket')
      ) {
        app_user.get('socket').emit('fruum:typing', user.get('username'));
      }
    });
    self.success(payload);
  };

  self.onboard = function(socket, payload) {
    if (!self.validatePayloadID(socket, null, 'onboard')) {
      self.fail(payload);
      return;
    }
    var app_id = socket.app_id,
        onboard = payload.onboard | 0,
        user = socket.fruum_user;

    if (user.get('anonymous')) {
      logger.error(app_id, 'onboard_anonymous_noperm', user);
      socket.emit('fruum:onboard');
      self.fail(payload);
      return;
    }

    // get latest user
    storage.get_user(app_id, user.get('id'), function(storage_user) {
      if (storage_user) {
        user.set('onboard', onboard);
        storage.update_user(app_id, user, { onboard: onboard }, function(updated_user) {
          if (updated_user) {
            socket.emit('fruum:onboard', payload);
            self.success(payload);
          } else {
            socket.emit('fruum:onboard');
            self.fail(payload);
          }
        });
      }
    });
  };

  // ------------------------------- TEMPLATES ---------------------------------

  self.notificationTemplate = function(application, template, success, fail) {
    var email = {};
    // read subject
    fs.readFile(__dirname + '/../../notifications/' + template + '/subject.txt', 'utf8', function(err, data) {
      if (err) { fail && fail(application, template); return; }
      email.subject = data || '';
      // read html
      fs.readFile(__dirname + '/../../notifications/' + template + '/body.html', 'utf8', function(err, data) {
        if (err) { fail && fail(application, template); return; }
        email.html = data || '';
        // read application sass
        application.getThemeSass(function(overrides) {
          // read main sass
          fs.readFile(__dirname + '/../../notifications/style.scss', 'utf8', function(err, data) {
            if (err) { fail && fail(application, template); return; }
            var style = data || '';
            style = style.replace('//__APPLICATION_CUSTOM_SASS__', overrides);
            // build css
            sass.render({
              data: style,
              outputStyle: 'compressed',
              includePaths: [ __dirname + '/../../notifications/' ],
            }, function(error, result) {
              if (error) {
                var msg = 'Status: ' + error.status + '\n' +
                          'Column: ' + error.column + '\n' +
                          'Message: ' + error.message + '\n' +
                          'Line: ' + error.line + '\n' +
                          style;
                logger.error(application.get('id'), 'sass', msg);
                fail && fail(application, template);
              } else {
                email.html = email.html.replace('<!--STYLE.SCSS-->', '<style>' + result.css + '</style>');
                success && success({
                  subject: _.template(email.subject),
                  html: _.template(email.html),
                });
              }
            });
          });
        });
      });
    });
  };
};
