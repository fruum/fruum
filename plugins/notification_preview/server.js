/******************************************************************************
email preview mode
*******************************************************************************/

'use strict';

var moment = require('moment'),
    Models = require('../../server/models');

function EmailPreview(options, instance) {
  instance.server.get('/email/:template/:app_id', function(req, res) {
    var template = req.params.template,
        app_id = req.params.app_id;

    var markdown = '# Header1\n\n';
    markdown += '## Header2\n\n';
    markdown += '### Header3\n\n';
    markdown += '**bold** *italics*\n\n';
    markdown += '```inline code block```\n\n';
    markdown += '```code block\ncode block\ncode block```\n\n';
    markdown += '- list1\n- list2\n\n';
    markdown += '1. list1\n2. list2\n\n';
    markdown += '---\n\n';
    markdown += '> note\n\n';
    markdown += '| Option | Description |\n';
    markdown += '| ------ | ----------- |\n';
    markdown += '| data   | path to data files to supply the data that will be passed into templates. |\n';
    markdown += '| engine | engine to be used for processing templates. Handlebars is the default. |\n';
    markdown += '| ext    | extension to be used for dest files. |    \n\n';
    markdown += '[link](https://fruum.github.io)\n\n'
    markdown += '![image](https://fruum.github.io/style/images/bg-track.jpg)'

    instance.storage.get_app(app_id, function(application) {
      if (application) {
        instance.engine.notificationTemplate(application, template, function(data) {
          res.send(instance.email.inlineCSS(data.html({
            date: moment(new Date()).format('D MMM YYYY'),
            application: {
              name: 'MyAwesomeApp'
            },
            getShareURL: function() { return ''; },
            user: {
              username: 'username',
              displayname: 'displayname'
            },
            reporter: {
              username: 'reporter_username',
              displayname: 'reporter_displayname'
            },
            reaction_user: {
              username: 'reaction_user_username',
              displayname: 'reaction_user_displayname'
            },
            administrator: {
              username: 'administrator_username',
              displayname: 'administrator_displayname'
            },
            total: 3,
            digest: '2 new threads',
            reaction: '+1',
            document: instance.email.prettyJSON(new Models.Document({
              header: 'Document header1',
              body: markdown,
              user_username: 'user1',
              user_displayname: 'first1 last1'
            })),
            documents: [
              instance.email.prettyJSON(new Models.Document({
                header: 'Document header1',
                body: markdown,
                user_username: 'user1',
                user_displayname: 'first1 last1'
              })),
              instance.email.prettyJSON(new Models.Document({
                header: 'Document header2',
                body: 'Small text here',
                user_username: 'user2',
                user_displayname: 'first2 last2'
              }))
            ]
          })));
        });
      }
    });
  });
}

module.exports = EmailPreview;
