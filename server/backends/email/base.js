/******************************************************************************
  Root class for email backends
*******************************************************************************/

'use strict';

var sass = require('node-sass'),
    fs = require('fs'),
    _ = require('underscore'),
    logger = require('../../logger'),
    Models = require('../../models');

module.exports = function(options) {

  // ---------------------------------- SEND -----------------------------------

  //message is { subject: '', html: '' }
  this.send = function(application, user, message, callback) {
    logger.system('Sending email to: <' + user.get('username') + '> ' + user.get('email'));
    logger.system('Subject: ' + message.subject);
    logger.system(message.html);
    callback();
  }

  // ---------------------------------- UTILS ----------------------------------

  //exlude users with no email address
  this.filter_users_with_email = function(users) {
    var recipients = [];
    _.each(users, function(user) {
      if (user.get('email')) {
        recipients.push(user);
      }
    });
    return recipients;
  }

  //get a list of administrators or admins defaults as defined on config.json
  this.administrators_or_defaults = function(administrators) {
    administrators = this.filter_users_with_email(administrators);
    if (!administrators.length) {
      //add failsafe admins
      _.each(options.notifications.defaults.administrators, function(email) {
        administrators.push(new Models.User({
          username: 'admin',
          displayname: 'Administrator',
          email: email
        }));
      });
    }
    return administrators;
  }

}
