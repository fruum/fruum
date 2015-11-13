/******************************************************************************
Sends digest emails to users based no watched documents
*******************************************************************************/
'use strict';

var _ = require('underscore'),
    moment = require('moment'),
    juice = require('juice'),
    Models = require('../../server/models'),
    logger = require('../../server/logger');

function Digest(options, instance) {

  function report(application, user, email_template, documents) {
    if (!user.get('email')) return;
    //find docs related to that user
    var hash_map = {}, total_replies = 0;
    _.each(documents, function(document) {
      var pid = document.get('parent');
      if (document.get('user_id') !== user.get('id') && _.contains(user.get('watch'), pid)) {
        if (!hash_map[pid]) hash_map[pid] = {
          replies: 0,
          document: document.toJSON()
        }
        else hash_map[pid].replies++;
        total_replies++;
      }
    });
    if (_.keys(hash_map).length) {
      var context = {
        total_replies: total_replies,
        date: moment(new Date()).format('D MMM YYYY'),
        application: application.toJSON(),
        getShareURL: application.getShareURL.bind(application),
        user: user.toJSON(),
        streams: hash_map
      }
      instance.email.send(application, user, {
        subject: email_template.subject(context),
        html: juice(email_template.html(context))
      }, function() {});
    }
  }

  function process_app(application) {
    if (!application.get('fullpage_url')) return;
    var meta = application.get('meta') || {},
        last_digest_ts = meta.last_digest_ts || 0,
        now = Date.now();

    //update last report timestamp
    meta.last_digest_ts = now;
    instance.storage.update_app(application, { meta: meta }, function() {});

    //fetch the documents that were updated in the interval
    instance.storage.search_attributes(
      application.get('id'),
      {
        archived: false,
        updated__gte: last_digest_ts,
        updated__lt: now,
        parent_type__not: 'channel',
        type: 'post'
      },
      function(documents) {
        if (documents.length) {
          //create an array of ids
          var ids = _.unique(_.map(documents, function(document) { return document.get('parent'); }));
          //find users watching those ids
          instance.storage.find_watch_users(application.get('id'), ids, function(users) {
            if (users.length) {
              //get template
              instance.engine.notificationTemplate(application, 'digest', function(email_template) {
                _.each(users, function(user) {
                  report(application, user, email_template, documents);
                });
              });
            }
          });
        }
      }
    );
  }

  this.cron = function() {
    //get all applications
    instance.storage.list_apps(function(apps) {
      _.each(apps, process_app);
    });
  }
}

module.exports = Digest;
