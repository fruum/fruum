/******************************************************************************
  Reference plugin that demonstrates the server plugin API
*******************************************************************************/

/*
  The plugin can define the flow of the server by setting some additional attributes
  to the response payload:
    'storage_noop': Do not add/update/delete document in the database
    'broadcast_noop': Do not broadcast document to other users

  Note that the document will still be sent back to the client that
  initiated the request. This is imporant since the client is always waiting
  for a reply.

  For example:
  payload.storage_noop = true;

  The plugin takes as arguments the options as set on config.json.
  The instance parameter is an object to the server instance and contains the
  following:
  {
    server: <node.js express app>,
    storage: <backend storage instance>,
    auth: <backend auth instance>
  }
*/

function ReferencePlugin(options, instance) {
  //processes the document before it is added in the database
  //payload: { app_id: app_id, user: User, document: Document }
  this.add = function(payload, callback) {
    callback(null, payload);
  }
  //processes the document before it is updated in the database
  //payload: { app_id: app_id, user: User, document: Document }
  this.update = function(payload, callback) {
    callback(null, payload);
  }
  //processes the document before it is deleted from the database
  //payload: { app_id: app_id, user: User, document: Document }
  this.delete = function(payload, callback) {
    callback(null, payload);
  }
  //processes the document before it is archived in the database
  //payload: { app_id: app_id, user: User, document: Document }
  this.archive = function(payload, callback) {
    callback(null, payload);
  }
  //processes the document before it is restored from the database
  //payload: { app_id: app_id, user: User, document: Document }
  this.restore = function(payload, callback) {
    callback(null, payload);
  }
  //process a document before it is been watched
  //payload: { app_id: app_id, user: User, document: Document }
  this.watch = function(payload, callback) {
    callback(null, payload);
  }
  //process a document before it is been unwatched
  //payload: { app_id: app_id, user: User, document: Document }
  this.unwatch = function(payload, callback) {
    callback(null, payload);
  }
  //process a document before it is been reported as inappropriate
  //payload: { app_id: app_id, user: User, document: Document }
  this.report = function(payload, callback) {
    callback(null, payload);
  }
  //process a document before a user reaction is registered
  //payload: { app_id: app_id, user: User, reaction: type, document: Document }
  this.react = function(payload, callback) {
    callback(null, payload);
  }
  //process a document before it moved under a new category
  //payload:
  //{
  //  app_id: app_id,
  //  document: Document,
  //  category: Document,
  //  children: [Document],
  //  user: User
  //}
  this.move = function(payload, callback) {
    callback(null, payload);
  }
  //triggered if plugin name is defined as a cron entry in the config.json
  this.cron = function() {}
}

module.exports = ReferencePlugin;
