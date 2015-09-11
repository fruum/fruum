/******************************************************************************
  Mandrill email client
*******************************************************************************/

'use strict';

var _ = require('underscore'),
    fs = require('fs'),
    Base = require('./base'),
    logger = require('../../logger'),
    mandrill = require('mandrill-api/mandrill');

function get_template(email) {
  return {
    subject: _.template(fs.readFileSync(__dirname + '/mandrill/' + email + '/subject.txt', { encoding: 'utf8'})),
    html: _.template(fs.readFileSync(__dirname + '/mandrill/' + email + '/body.html', { encoding: 'utf8'})),
    text: _.template(fs.readFileSync(__dirname + '/mandrill/' + email + '/body.txt', { encoding: 'utf8'}))
  }
}

function get_recipients(users) {
  var recipients = [];
  _.each(users, function(user) {
    if (user.get('email')) {
      recipients.push({
        email: user.get('email'),
        name: user.get('displayname') || user.get('username'),
        type: 'to'
      });
    }
  });
  return recipients;
}

//load templates
var templates = {
  inappropriate_notify: get_template('inappropriate_notify')
}

module.exports = function(options) {
  _.extend(this, new Base(options));

  //abort if we do not have an api key
  if (!options.mandrill.api_key) return;

  //create mandrill client
  var mandrill_client = new mandrill.Mandrill(options.mandrill.api_key);

  //send message
  this.send = function(application, user, message, callback) {
    if (user.get('email')) {
      logger.info(application.get('id'), 'sending_email_o', user);
      try {
        mandrill_client.messages.send({
          message: {
            html: message.html,
            text: message.text,
            subject: message.subject,
            from_email: options.mandrill.from_email,
            from_name: options.mandrill.from_name,
            to: [{
              email: user.get('email'),
              name: user.get('displayname') || user.get('username'),
              type: 'to'
            }]
          }
        });
      }
      catch(err) { logger.error(application.get('id'), 'mandrill_client', err); }
    }
    callback();
  }

  //bind email api overrrides
  this.inappropriate_notify = function(application, document, reporter, administrators, callback) {
    var context = {
          document: document.toJSON(),
          reporter: reporter.toJSON()
        },
        recipients = get_recipients(administrators);
    if (!recipients.length) {
      //add failsafe admins
      _.each(options.mandrill.failsafe_admins, function(email) {
        recipients.push({
          email: email
        });
      });
    }
    if (recipients.length) {
      logger.info(application.get('id'), 'sending_email_report_to', recipients);
      try {
        mandrill_client.messages.send({
          message: {
            html: templates.inappropriate_notify.html(context),
            text: templates.inappropriate_notify.text(context),
            subject: templates.inappropriate_notify.subject(context),
            from_email: options.mandrill.from_email,
            from_name: options.mandrill.from_name,
            to: recipients
          }
        });
      }
      catch(err) { logger.error(application.get('id'), 'mandrill_client', err); }
    }
    else logger.error(application.get('id'), 'no_admins_found_for_report_email', administrators);
    callback();
  }
}
