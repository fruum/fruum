/******************************************************************************
  Root class for authentication backends
*******************************************************************************/

'use strict';

module.exports = function(options, storage) {
  /*
  Summary:
  Setup the backend

  Description:
  This is called only once, when the "node index.js --setup" command is called
  */
  this.setup = function() {};

  /*
  Summary:
  Migrates the backend

  Description:
  This is called when the "node index.js --migrate" command is called
  */
  this.migrate = function() {};

  /*
  Summary:
  Destroy the backend

  Description:
  This is called when the "node index.js --teardown" command is called
  */
  this.teardown = function() {};

  /*
  Summary:
  User authentication

  Description:
  Authenticates the user based on a payload received by the client.

  Parameters:
  - application: The model instance of an application
  - user_payload: An object with a user payload
  - callback: Response callback function, passes a "User" model as parameter.
    If no model is passed, then assume anonymous access.
  */
  this.authenticate = function(application, user_payload, callback) {
    callback();
  }
}
