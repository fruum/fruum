/******************************************************************************
  Reference plugin that demonstrates the server plugin API
*******************************************************************************/

/*
  The plugin can define the flow of the server by setting some additional attributes
  to the document:
    'storage_noop': Do not add/update/delete document in the database
    'broadcast_noop': Do not broadcast document to other users

  Note that the document will still be sent back to the client that
  initiated the request. This is imporant since the client is always waiting
  for a reply.

  For example:
  document.set('storage_noop', true)

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
  this.add = function(document, callback) {
    callback(null, document);
  }
  //processes the document before it is updated in the database
  this.update = function(document, callback) {
    callback(null, document);
  }
  //processes the document before it is deleted from the database
  this.delete = function(document, callback) {
    callback(null, document);
  }
  //processes the document before it is archived in the database
  this.archive = function(document, callback) {
    callback(null, document);
  }
  //processes the document before it is restored from the database
  this.restore = function(document, callback) {
    callback(null, document);
  }
  //process a document before it is been watched
  this.watch = function(document, callback) {
    callback(null, document);
  }
  //process a document before it is been unwatched
  this.unwatch = function(document, callback) {
    callback(null, document);
  }
  //process a document before it is been reported as inappropriate
  this.report = function(document, callback) {
    callback(null, document);
  }
}

module.exports = ReferencePlugin;
