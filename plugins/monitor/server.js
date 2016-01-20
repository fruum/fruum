/******************************************************************************
Monitors activity and send a digest to administrators
*******************************************************************************/
'use strict';

var _ = require('underscore'),
    moment = require('moment'),
    juice = require('juice'),
    Models = require('../../server/models'),
    logger = require('../../server/logger');

function Monitor(options, instance) {

  function report(application, documents) {
    //get admins
    instance.storage.match_users(application.get('id'), { admin: true }, function(administrators) {
      administrators = instance.engine.administratorsOrDefaults(administrators);
      if (administrators.length) {
        instance.engine.notificationTemplate(application, 'monitor', function(email_template) {
          var context = {
            date: moment(new Date()).format('D MMM YYYY'),
            application: application.toJSON(),
            getShareURL: application.getShareURL.bind(application),
            documents: []
          };
          var stats = {
            channels: [],
            threads: [],
            articles: [],
            categories: [],
            blogs: [],
            replies: []
          };
          _.each(documents, function(doc) {
            switch(doc.get('type')) {
              case 'channel':
                stats.channels.push(doc);
                break;
              case 'thread':
                stats.threads.push(doc);
                break;
              case 'article':
                stats.articles.push(doc);
                break;
              case 'category':
                stats.categories.push(doc);
                break;
              case 'blog':
                stats.blogs.push(doc);
                break;
              case 'post':
                if (doc.get('parent_type') != 'channel') {
                  stats.replies.push(doc);
                }
                break;
            }
          }, this);
          context.documents = _.map(
            stats.threads.concat(
              stats.blogs,
              stats.articles,
              stats.channels,
              stats.categories,
              stats.replies
            ).slice(0, 6),
            function(doc) {
              return instance.email.prettyJSON(doc);
            }
          );
          context.digest = '';
          _.each(stats, function(value, key) {
            if (value.length) {
              context.digest += ' ' + value.length + ' new ' + key + ',';
            }
          }, this);
          //remove trailing comma
          context.digest = context.digest.slice(0, -1).trim();
          var email = {
            subject: email_template.subject(context),
            html: juice(email_template.html(context))
          };
          _.each(administrators, function(admin) {
            logger.info(application.get('id'), 'monitor_notify', admin);
            instance.email.send(application, admin, email, function() {});
          });
        });
      }
    });
  }

  function process_app(application) {
    var meta = application.get('meta') || {},
        last_monitor_ts = meta.last_monitor_ts || 0,
        now = Date.now();

    //update last report timestamp
    meta.last_monitor_ts = now;
    instance.storage.update_app(application, { meta: meta }, function() {});

    //fetch the documents that were updated in the interval
    instance.storage.search_attributes(
      application.get('id'),
      {
        archived: false,
        created__gte: last_monitor_ts,
        created__lt: now
      },
      function(documents) {
        if (documents.length) {
          report(application, documents);
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

module.exports = Monitor;
