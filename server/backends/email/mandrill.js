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

  // abort if we do not have an api key
  if (!options.mandrill.api_key) return;

  // create mandrill client
  var mandrill_client = new mandrill.Mandrill(options.mandrill.api_key);

  // send message
  this.send = function(application, user, message, callback) {
    if (user.get('email')) {
      logger.info(application.get('id'), 'sending_email_to', user.get('email'));
      // get inline images
      var images = [];
      var body = (message.html || '').replace(/src=\"([^\"]*)\"/g, function(match, url) { // eslint-disable-line
        var name;
        if (url.indexOf('data:image/png;base64,') == 0) {
          name = 'image' + images.length;
          images.push({
            type: 'image/png',
            name: name,
            content: url.replace('data:image/png;base64,', ''),
          });
          return match.replace(url, 'cid:' + name);
        } else if (url.indexOf('data:image/jpeg;base64,') == 0) {
          name = 'image' + images.length;
          images.push({
            type: 'image/jpeg',
            name: name,
            content: url.replace('data:image/jpeg;base64,', ''),
          });
          return match.replace(url, 'cid:' + name);
        }
        return match;
      });
      try {
        mandrill_client.messages.send({
          message: {
            html: body,
            subject: message.subject,
            from_email: application.get('notifications_email') || options.notifications.defaults.from.email,
            from_name: application.get('name') || options.notifications.defaults.from.name,
            to: [{
              email: user.get('email'),
              name: user.get('displayname') || user.get('username'),
              type: 'to',
            }],
            images: images,
          },
        });
      } catch (err) {
        logger.error(application.get('id'), 'mandrill_client', err);
      }
    } else {
      logger.error(application.get('id'), 'user has no email', user);
    }
    callback();
  };
};
