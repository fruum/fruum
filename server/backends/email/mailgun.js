/******************************************************************************
  Mailgun email client
*******************************************************************************/

'use strict';

var _ = require('underscore'),
    Mailgun = require('mailgun-js'),
    Base = require('./base'),
    logger = require('../../logger');

module.exports = function(options, storage) {
  _.extend(this, new Base(options, storage));

  // abort if we do not have an api key
  if (!options.mailgun.api_key) return;
  // abort if we do not have a domain
  if (!options.mailgun.domain) return;

  // create mandrill client
  var mailgun_client = new Mailgun({
    apiKey: options.mailgun.api_key,
    domain: options.mailgun.domain,
  });

  // send message
  this.send = function(application, user, message, callback) {
    if (user.get('email')) {
      logger.info(application.get('id'), 'sending_email_to', user.get('email'));
      // get inline images
      var images = [];
      var body = (message.html || '').replace(/src=\"([^\"]*)\"/g, function(match, url) { // eslint-disable-line
        var codec, extension;
        if (url.indexOf('data:image/png;base64,') == 0) {
          codec = 'png';
          extension = '.png';
        } else if (url.indexOf('data:image/jpeg;base64,') == 0) {
          codec = 'jpeg';
          extension = '.jpg';
        }
        if (codec) {
          var name = 'image' + images.length + extension,
              base64 = url.replace('data:image/' + codec + ';base64,', ''),
              buffer = new Buffer(base64, 'base64');
          images.push(new mailgun_client.Attachment({
            contentType: 'image/' + codec,
            filename: name,
            data: buffer,
            knownLength: buffer.length,
          }));
          return match.replace(url, 'cid:' + name);
        }
        return match;
      });
      try {
        // maingun does not send from arbitraty email addresses, so send the email
        // from <appid>@domain
        mailgun_client.messages().send({
          from: application.get('id') + '@' + options.mailgun.domain,
          to: user.get('email'),
          subject: message.subject,
          html: body,
          inline: images,
        }, function(error, body) {
          if (error) {
            logger.error(application.get('id'), 'mailgun_client', error);
          }
          if (body) {
            logger.info(application.get('id'), 'mailgun_client', body);
          }
        });
      } catch (err) {
        logger.error(application.get('id'), 'mailgun_client_exception', err);
      }
    } else {
      logger.error(application.get('id'), 'user has no email', user);
    }
    callback();
  };
};
