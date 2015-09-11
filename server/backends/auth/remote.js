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
    Models = require('../../models');

function RemoteAuth(options) {
  _.extend(this, new Base(options));
  this.authenticate = function(application, user_payload, callback) {
    request({
      method: 'POST',
      url: application.get('auth_url'),
      json: true,
      body: user_payload
    }, function(err, res, body) {
      if (!err) {
        try {
          callback(new Models.User(body || {}));
          return;
        }
        catch(e) {}
      }
      //continue as anonymous
      callback(new Models.User());
    });
  }
}
module.exports = RemoteAuth;
