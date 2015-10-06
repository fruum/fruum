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

  /*
  Summary:
  Send an email

  Parameters:
  - application: Application model
  - user: Receiver user model
  - message: an object describing the message as
    {
        subject: string,
        html: html body message
    }
  - callback: function callback to trigger when done
  */
  this.send = function(application, user, message, callback) {
    logger.system('Sending email to: <' + user.get('username') + '> ' + user.get('email'));
    logger.system('Subject: ' + message.subject);
    logger.system(message.html);
    callback();
  }

}
