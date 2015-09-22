/******************************************************************************
email preview mode
*******************************************************************************/

'use strict';

function EmailPreview(options, instance) {
  instance.server.get('/email/:template/:app_id', function(req, res) {
    var template = req.params.template,
        app_id = req.params.app_id;

    instance.storage.get_app(app_id, function(application) {
      if (application) {
        instance.engine.notificationTemplate(application, template, function(data) {
          res.send(data.html());
        });
      }
    });
  });
}

module.exports = EmailPreview;
