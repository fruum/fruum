/******************************************************************************
  Root class for authentication backends
*******************************************************************************/

'use strict';

module.exports = function(options) {
  //setups the database
  this.setup = function() {};
  //migrates the database
  this.migrate = function() {};
  //teardown the database
  this.teardown = function() {};
  //authenticates a user based on a payload, authenticates the user and calls
  //the callback with a User model as parameter, or undefined on fail
  this.authenticate = function(application, user_payload, callback) {
    callback();
  }
}
