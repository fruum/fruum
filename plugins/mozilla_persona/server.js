/******************************************************************************
Persona backend authentication engine
*******************************************************************************/

'use strict';

var request = require('request'),
    md5 = require('md5'),
    Models = require('../../server/models');

function MozillaPersonaPlugin(options, instance) {
  var admin_re = new RegExp(options.mozilla_persona.admins);

  instance.server.post('/persona/login', function(req, res) {
    //verify payload
    if (!req.body ||
        !req.body.assertion ||
        !req.body.protocol ||
        !req.body.hostname ||
        !req.body.app_id)
    {
      res.status(400).send('Invalid POST data');
      return;
    }
    var app_id = req.body.app_id;
    //verify app_id
    instance.storage.get_app(app_id, function(application) {
      if (!application) {
        res.status(404).send('Invalid app_id');
        return;
      }
      else if (application.get('auth_url')) {
        res.status(400).send('Application has SSO enabled');
        return;
      }
      //proceed with persona verification
      var assertion = req.body.assertion;
      var audience = req.body.protocol + '//' + req.body.hostname + ':';
      if (req.body.port) audience += '' + req.body.port;
      else if (req.body.protocol === 'http') audience += '80';
      else audience += '443';
      request({
        method: 'POST',
        url: 'https://verifier.login.persona.org/verify',
        json: true,
        body: {
          assertion: assertion,
          audience: audience
        }
      }, function(p_err, p_res, p_body) {
        if (!p_err && p_body && p_body.email) {
          var email = p_body.email,
              username = email.split('@')[0],
              user_id = 'mozp_' + md5(username),
              admin = admin_re.test(email);

          var user_payload = {
            id: user_id,
            username: username,
            email: email
          };

          //register in database
          instance.storage.get_user(app_id, user_id, function(user) {
            if (user) {
              if (admin != user.get('admin')) {
                //update admin
                instance.storage.update_user(app_id, user, { admin: admin }, function() {
                  res.json(user_payload);
                });
              }
              else {
                //already registered
                res.json(user_payload);
              }
            }
            else {
              //register user
              var user = new Models.User({
                id: user_id,
                anonymous: false,
                admin: admin,
                username: username,
                displayname: username,
                email: email
              });
              instance.storage.add_user(app_id, user, function(user) {
                if (user) res.json(user_payload);
                else res.json({});
              });
            }
          });
        }
        else res.json({});
      });
    });
  });
}

module.exports = MozillaPersonaPlugin;
