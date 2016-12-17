/******************************************************************************
  Root class for email backends
*******************************************************************************/

'use strict';

var Remarkable = require('remarkable'),
    remarkable = new Remarkable({
      html: true,
      breaks: true,
      linkify: true,
    }),
    _ = require('underscore'),
    juice = require('juice'),
    declassify = require('declassify'),
    logger = require('../../logger');

// custom validator
if (remarkable.inline && remarkable.inline.validateLink) {
  remarkable.inline.__validateLink = remarkable.inline.validateLink;
  remarkable.inline.validateLink = function(url) {
    if (!remarkable.inline.__validateLink(url)) {
      // allow inline images
      return url.indexOf('data:image') == 0;
    }
    return true;
  };
}

function escape_regex(re) {
  return re.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&'); // eslint-disable-line
}

function is_link(url) {
  url = (url || '').trim().toLowerCase();
  return url.indexOf('http://') == 0 || url.indexOf('https://') == 0;
}

function get_initials(name) {
  name = (name || '').toUpperCase().split(' ');
  var response = '';
  for (var i = 0; i < name.length; ++i) {
    if (name[i]) response += name[i][0];
  }
  return response;
}

module.exports = function(options, storage) {
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
  };

  /*
  Helper function to process a document, apply attachments and return a
  JSON object of the document
  */
  this.prettyJSON = function(document) {
    var json = document.toJSON(),
        body = json.body || '',
        attachments = json.attachments || [];
    // remove escaping of > and ` used by markdown
    body = body.replace(/&gt;/g, '>').replace(/&#x60;/g, '`');
    // attachments processing
    if (attachments.length) {
      _.each(attachments, function(attachment) {
        if (attachment.type == 'image') {
          body = body.replace(
            new RegExp(escape_regex('[[' + attachment.type + ':' + attachment.name + ']]'), 'g'),
            '![' + attachment.name + '](' + attachment.data + ')'
          );
        }
      });
    }
    body = remarkable.render(body);
    json.body = body;
    // process user
    json.image_url = is_link(json.user_avatar) ? json.user_avatar : null;
    json.image_initials = get_initials(json.user_displayname || json.user_username);
    return json;
  };

  /*
  Helper function that inlines css in an HTML email
  */
  this.inlineCSS = function(html) {
    return declassify.process(juice(html));
  };
};
