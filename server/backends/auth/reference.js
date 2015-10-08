/******************************************************************************
Example authentication engine
*******************************************************************************/

'use strict';

var _ = require('underscore'),
    Base = require('./base'),
    Models = require('../../models');

function ReferenceAuth(options) {
  _.extend(this, new Base(options));
  this.authenticate = function(application, user_payload, callback) {
    user_payload = user_payload || {};
    user_payload.id = user_payload.id || '' + _.random(1, 1000)
    callback(new Models.User(user_payload));
  }
}
module.exports = ReferenceAuth;
