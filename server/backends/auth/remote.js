/******************************************************************************
Remote authentication engine using HTTP request
Takes as option the user payload and the application's registered url,
performs a request to the remote and accepts a JSON with the user details.

On fail, it continues as anonymous.
*******************************************************************************/

'use strict';

var _ = require('underscore'),
    request = require('request'),
    Base = require('./base'),
    logger = require('../../logger'),
    Models = require('../../models');

function RemoteAuth(options, storage) {
  _.extend(this, new Base(options, storage));
  this.authenticate = function(application, user_payload, callback) {
    logger.info(application.get('id'), 'remote_auth_request', user_payload);
    if (!application.get('auth_url')) {
      //try to match the payload in the storage
      if (user_payload && user_payload.id) {
        storage.get_user(application.get('id'), user_payload.id, function(user) {
          if (user) {
            //verify user payload
            for (var key in user_payload) {
              if (user.get(key) != user_payload[key]) {
                callback(new Models.User());
                return;
              }
            }
            //we found our user
            callback(user);
          }
          else callback(new Models.User());
        });
      }
      else callback(new Models.User());
    }
    else {
      //continue with Single Sign On
      request({
        method: 'POST',
        url: application.get('auth_url'),
        json: true,
        body: user_payload
      }, function(err, res, body) {
        if (!err) {
          try {
            logger.info(application.get('id'), 'remote_auth_response', body);
            callback(new Models.User(body || {}));
            return;
          }
          catch(e) {
            logger.error(application.get('id'), 'remote_auth_response', e);
          }
        }
        else {
          logger.error(application.get('id'), 'remote_auth_response', err);
        }
        //continue as anonymous
        callback(new Models.User());
      });
    }
  }
}
module.exports = RemoteAuth;
