/******************************************************************************
Report inappropriate content to admins
*******************************************************************************/
'use strict';

var _ = require('underscore'),
    moment = require('moment'),
    logger = require('../../server/logger');

function Report(options, instance) {
  this.afterReport = function(payload, callback) {
    // get application model
    instance.storage.get_app(payload.app_id, function(application) {
      // find admins
      instance.storage.match_users(payload.app_id, { admin: true }, function(administrators) {
        administrators = instance.engine.administratorsOrDefaults(administrators);
        if (application && administrators.length) {
          // get email template
          instance.engine.notificationTemplate(application, 'report', function(email_template) {
            var context = {
              date: moment(new Date()).format('D MMM YYYY'),
              application: application.toJSON(),
              getShareURL: application.getShareURL.bind(application),
              document: instance.email.prettyJSON(payload.document),
              reporter: payload.user.toJSON(),
              administrator: {},
            };
            // send email to each admin
            _.each(administrators, function(admin) {
              if (admin.get('blocked')) {
                logger.info(application.get('id'), 'report_notify_admin_skip_blocked_user', admin);
              } else {
                logger.info(payload.app_id, 'report_notify_admin:' + admin.get('username'), payload.document);
                context.administrator = admin.toJSON();
                instance.email.send(application, admin, {
                  subject: email_template.subject(context),
                  html: instance.email.inlineCSS(email_template.html(context)),
                }, function() {});
              }
            });
          });
        }
        callback(null, payload);
      });
    });
  };
}

module.exports = Report;
