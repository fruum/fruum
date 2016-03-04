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
  this.beforeAdd = function(payload, callback) {
    callback(null, payload);
  }
  //processes the document after it is added in the database
  //payload: { app_id: app_id, user: User, document: Document }
  this.afterAdd = function(payload, callback) {
    callback(null, payload);
  }

  //processes the document before it is updated in the database
  //payload: { app_id: app_id, user: User, document: Document }
  this.beforeUpdate = function(payload, callback) {
    callback(null, payload);
  }
  //processes the document after it is updated in the database
  //payload: { app_id: app_id, user: User, document: Document }
  this.afterUpdate = function(payload, callback) {
    callback(null, payload);
  }

  //processes the document before it is deleted from the database
  //payload: { app_id: app_id, user: User, document: Document }
  this.beforeDelete = function(payload, callback) {
    callback(null, payload);
  }
  //processes the document after it is deleted from the database
  //payload: { app_id: app_id, user: User, document: Document }
  this.afterDelete = function(payload, callback) {
    callback(null, payload);
  }

  //processes the document before it is archived in the database
  //payload: { app_id: app_id, user: User, document: Document }
  this.beforeArchive = function(payload, callback) {
    callback(null, payload);
  }
  //processes the document after it is archived in the database
  //payload: { app_id: app_id, user: User, document: Document }
  this.afterArchive = function(payload, callback) {
    callback(null, payload);
  }

  //processes the document before it is restored from the database
  //payload: { app_id: app_id, user: User, document: Document }
  this.beforeRestore = function(payload, callback) {
    callback(null, payload);
  }
  //processes the document after it is restored from the database
  //payload: { app_id: app_id, user: User, document: Document }
  this.afterRestore = function(payload, callback) {
    callback(null, payload);
  }

  //process a document before it is been watched
  //payload: { app_id: app_id, user: User, document: Document }
  this.beforeWatch = function(payload, callback) {
    callback(null, payload);
  }
  //process a document after it is been watched
  //payload: { app_id: app_id, user: User, document: Document }
  this.afterWatch = function(payload, callback) {
    callback(null, payload);
  }

  //process a document before it is been unwatched
  //payload: { app_id: app_id, user: User, document: Document }
  this.beforeUnwatch = function(payload, callback) {
    callback(null, payload);
  }
  //process a document after it is been unwatched
  //payload: { app_id: app_id, user: User, document: Document }
  this.afterUnwatch = function(payload, callback) {
    callback(null, payload);
  }

  //process a document before it is been reported as inappropriate
  //payload: { app_id: app_id, user: User, document: Document }
  this.beforeReport = function(payload, callback) {
    callback(null, payload);
  }
  //process a document after it is been reported as inappropriate
  //payload: { app_id: app_id, user: User, document: Document }
  this.afterReport = function(payload, callback) {
    callback(null, payload);
  }

  //process a document before a field is set
  //payload: { app_id: app_id, user: User, document: Document, field: field, value: value }
  this.beforeField = function(payload, callback) {
    callback(null, payload);
  }
  //process a document after a field is set
  //payload: { app_id: app_id, user: User, document: Document, field: field, value: value }
  this.afterField = function(payload, callback) {
    callback(null, payload);
  }

  //process a document before a user reaction is registered
  //payload: { app_id: app_id, user: User, reaction: type, document: Document }
  this.beforeReact = function(payload, callback) {
    callback(null, payload);
  }
  //process a document after a user reaction is registered
  //payload: { app_id: app_id, user: User, reaction: type, document: Document }
  this.afterReact = function(payload, callback) {
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
  this.beforeMove = function(payload, callback) {
    callback(null, payload);
  }
  //process a document after it moved under a new category
  //payload:
  //{
  //  app_id: app_id,
  //  document: Document,
  //  category: Document,
  //  children: [Document],
  //  user: User
  //}
  this.afterMove = function(payload, callback) {
    callback(null, payload);
  }

  //triggered if plugin name is defined as a cron entry in the config.json
  this.cron = function() {}
}

module.exports = ReferencePlugin;
