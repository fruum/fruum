/******************************************************************************
  Mandrill email client
*******************************************************************************/

'use strict';

var _ = require('underscore'),
    Base = require('./base'),
    logger = require('../../logger'),
    mandrill = require('mandrill-api/mandrill');

module.exports = function(options, storage) {
  _.extend(this, new Base(options, storage));

  //abort if we do not have an api key
  if (!options.mandrill.api_key) return;

  //create mandrill client
  var mandrill_client = new mandrill.Mandrill(options.mandrill.api_key);

  //send message
  this.send = function(application, user, message, callback) {
    if (user.get('email')) {
      logger.info(application.get('id'), 'sending_email_to', user.get('email'));
      try {
        mandrill_client.messages.send({
          message: {
            html: message.html,
            subject: message.subject,
            from_email: application.get('notifications_email') || options.notifications.defaults.from.email,
            from_name: application.get('name') || options.notifications.defaults.from.name,
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

}
