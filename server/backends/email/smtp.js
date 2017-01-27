/******************************************************************************
  SMTP email client
*******************************************************************************/

'use strict';

var _ = require('underscore'),
    nodemailer = require('nodemailer'),
    Base = require('./base'),
    logger = require('../../logger');

module.exports = function(options, storage) {
  _.extend(this, new Base(options, storage));

  // abort if we do not have smpt
  if (!options.smtp) return;

  var transporter = nodemailer.createTransport(options.smtp);

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
          images.push({
            contentType: 'image/' + codec,
            filename: name,
            data: buffer,
          });
          return match.replace(url, 'cid:' + name);
        }
        return match;
      });
      try {
        var from_email = application.get('notifications_email') || options.notifications.defaults.from.email,
            from_name = application.get('name') || options.notifications.defaults.from.name;

        var payload = {
          from: from_name + '<' + from_email + '>',
          to: user.get('email'),
          subject: message.subject,
          html: body,
          attachments: [],
        };

        _.each(images, function(image) {
          payload.attachments.push({
            contentType: image.contentType,
            filename: image.filename,
            cid: image.filename,
            content: image.data,
          });
        });

        transporter.sendMail(payload, function(error, info) {
          if (error) {
            logger.error(application.get('id'), 'smtp', error);
          } else if (info) {
            logger.info(application.get('id'), 'smtp', payload.subject);
          }
        });
      } catch (err) {
        logger.error(application.get('id'), 'smtp_exception', err);
      }
    } else {
      logger.error(application.get('id'), 'user has no email', user);
    }
    callback();
  };
};
