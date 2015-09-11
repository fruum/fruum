/******************************************************************************
Example authentication engine
*******************************************************************************/

'use strict';

var _ = require('underscore'),
    Base = require('./base'),
    Models = require('../../models');

function FileAuth(options) {
  _.extend(this, new Base(options));
  this.authenticate = function(application, user_payload, callback) {
    var user_id = user_payload.id || _.random(1, 1000);
    callback(new Models.User({
      id: '' + user_id,
      anonymous: false,
      admin: true,
      username: 'user' + user_id,
      displayname: 'First Last' + user_id,
      avatar: '',
      email: ''
    }));
  }
}
module.exports = FileAuth;
