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
            documents: _.map(documents, function(doc) { return doc.toJSON(); }),
            administrator: {}
          };
          _.each(administrators, function(admin) {
            logger.info(application.get('id'), 'monitor_notify', admin);
            context.administrator = admin.toJSON();
            instance.email.send(application, admin, {
              subject: email_template.subject(context),
              html: juice(email_template.html(context))
            }, function() {});
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
