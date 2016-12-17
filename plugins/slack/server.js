/******************************************************************************
Slack integration
*******************************************************************************/
'use strict';

var _ = require('underscore'),
    request = require('request'),
    logger = require('../../server/logger');

var fruum_username = 'Fruum',
    // fruum_icon_emoji = ':racing_car:',
    fruum_icon_url = 'https://fruum.github.io/static/slack.png';

function Slack(options, instance) {
  // ---------------------------------- COMMANDS -------------------------------

  // respond to /fruum slack command
  instance.server.post('/slack/:app_id', function(req, res) {
    var app_id = req.params.app_id,
        text = req.body.text,
        token = req.body.token;

    // get app
    instance.storage.get_app(app_id, function(application) {
      if (!application) {
        res.send('*Fruum:* Invalid app_id, check your slack integration');
        return;
      }
      var app_token = application.getProperty('slack:command_token');
      if (app_token && app_token != token) {
        res.send('*Fruum:* Permission denied, check your slack integration');
        logger.error(app_id, 'slack_command_token_failed', {
          server_token: token,
          app_token: app_token,
        });
        return;
      }
      if (!text) {
        var fullpage_url = application.get('fullpage_url');
        if (!fullpage_url) {
          res.send('Setup a <https://fruum.github.io/#v/setting-up-full-page-forums|full page fruum> to enable all features');
        } else {
          res.send('Click <' + fullpage_url + '|here> to open Fruum and share your thoughts');
        }
      } else {
        // perform search
        instance.storage.search(app_id, { text: text, permission: 1 }, function(results) {
          if (!results.length) {
            res.send('*Fruum:* No search results');
            return;
          }
          var response = 'Fruum search results for: *' + text + '*\n';
          _.each(results, function(document) {
            var link = '';
            if (document.get('type') == 'post') {
              link = application.getShareURL(document.get('parent'));
            } else {
              link = application.getShareURL(document.get('id'));
            }
            response += '<' + link + '|' + document.get('header') + '>\n';
          });
          res.send(response);
        }, {
          skipfields: ['attachments', 'body'],
        });
      }
    });
  });

  // ---------------------------------- WEBHOOKS ------------------------------

  // Report to slack when a new document has been added
  this.afterAdd = function(payload, callback) {
    // do not block operation
    callback(null, payload);
    // check if we have an outgoing webhook registered in the app
    var document = payload.document,
        app_id = payload.app_id;
    // skip chat messages
    if (document.get('parent_type') == 'channel') return;
    // get application instance
    instance.storage.get_app(app_id, function(application) {
      if (!application) return;
      var webhook = application.getProperty('slack:incoming_webhook');
      if (!webhook) return;
      var pretext = document.get('user_displayname') || document.get('user_username'),
          link = '';
      if (document.get('type') == 'post') {
        link = application.getShareURL(document.get('parent'));
        pretext += ' replied to ' + document.get('parent_type');
      } else {
        link = application.getShareURL(document.get('id'));
        pretext += ' created new ' + document.get('type');
      }
      request({
        url: webhook,
        method: 'POST',
        json: {
          username: fruum_username,
          // icon_emoji: fruum_icon_emoji,
          icon_url: fruum_icon_url,
          attachments: [{
            pretext: pretext,
            title: document.get('header'),
            title_link: link,
            text: document.get('body'),
            mrkdwn_in: ['text', 'pretext'],
          }],
        },
      }, function(error, response, body) {
        if (error) logger.error(app_id, 'slack_incoming_webhook_failed', error);
      });
    });
  };
}

module.exports = Slack;
