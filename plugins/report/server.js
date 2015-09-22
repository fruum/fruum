/******************************************************************************
Report inappropriate content to admins
*******************************************************************************/
'use strict';

var _ = require('underscore'),
    moment = require('moment'),
    juice = require('juice'),
    Models = require('../../server/models'),
    logger = require('../../server/logger');

function Report(options, instance) {

  this.report = function(payload, callback) {
    //get application model
    instance.storage.get_app(payload.app_id, function(application) {
      //find admins
      instance.storage.match_users(payload.app_id, { admin: true }, function(administrators) {
        administrators = instance.email.administrators_or_defaults(administrators);
        if (application && administrators.length) {
          //get email template
          instance.engine.notificationTemplate(application, 'report', function(email_template) {
            var context = {
              date: moment(new Date()).format('D MMM YYYY'),
              application: application.toJSON(),
              document: payload.document.toJSON(),
              reporter: payload.user.toJSON(),
              administrator: {}
            };
            //send email to each admin
            _.each(administrators, function(admin) {
              logger.info(payload.app_id, 'report_notify_admin:' + admin.get('username'), payload.document);
              context.administrator = admin.toJSON();
              instance.email.send(application, admin, {
                subject: email_template.subject(context),
                html: juice(email_template.html(context))
              }, function() {});
            });
          });
        }
        callback(null, payload);
      });
    });
  }
}

module.exports = Report;
