/******************************************************************************
Sends notification emails to users based on watched documents
*******************************************************************************/
'use strict';

var _ = require('underscore'),
    moment = require('moment'),
    juice = require('juice'),
    marked = require('marked'),
    logger = require('../../server/logger');

function Notify(options, instance) {

  function notify(application, user, email_template, document) {
    var context = {
      date: moment(new Date()).format('D MMM YYYY'),
      application: application.toJSON(),
      user: user.toJSON(),
      document: document.toJSON()
    }
    //add markdown on body
    if (context.document.body) {
      context.document.body = marked(
        (context.document.body || '').replace(/&gt;/g, '>').replace(/&#x60;/g, '`')
      );
    }
    instance.email.send(application, user, {
      subject: email_template.subject(context),
      html: juice(email_template.html(context))
    }, function() {});
  }

  this.add = function(payload, callback) {
    //proceed without locking
    callback(null, payload);

    var document = payload.document;
    //skip channels
    if (document.get('parent_type') === 'channel') {
      return;
    }
    //get parent
    var watch_id = document.get('parent');
    //find users who are watching
    instance.storage.find_watch_users(payload.app_id, [watch_id], function(users) {
      var online_users = {};
      _.each(instance.engine.app_users[payload.app_id], function(user) {
        online_users[user.get('id')] = true;
      });
      //find a list of users who are not online
      users = _.filter(users, function(user) {
        return online_users[user.get('id')] !== true &&
                user.get('id') != document.get('user_id') &&
                (user.get('admin') || document.get('visible'));
      });
      if (users.length) {
        //find application
        instance.storage.get_app(payload.app_id, function(application) {
          if (!application) return;
          //construct email
          instance.engine.notificationTemplate(application, 'notify', function(email_template) {
            _.each(users, function(user) {
              notify(application, user, email_template, document);
            });
          });
        });
      }
    });
  }
}

module.exports = Notify;
