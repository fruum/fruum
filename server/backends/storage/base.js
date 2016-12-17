/******************************************************************************
  Root class for storage backends
*******************************************************************************/

'use strict';

module.exports = function(options) {
  // ------------------------------ MANAGEMENT ---------------------------------

  /*
  Summary:
  Setup the backend

  Description:
  This is called only once, when the "node index.js --setup" command is called
  */
  this.setup = function() {};

  /*
  Summary:
  Migrate the backend

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

  // ------------------------------ APPLICATION -------------------------------

  /*
  Summary:
  Register new forum (application)

  Parameters:
  - application: Application model
  - callback: done function callback, passing application model as parameter
  */
  this.add_app = function(application, callback) { callback(application); };

  /*
  Summary:
  Update an application

  Description:
  Updates the properties of an application. If attributes are defined, then
  updates only the specified attributes, the whole model otherwise.

  Parameters:
  - application: Application model
  - attributes (optional): an object with attributes, e.g. { name: 'foo '}
  - callback: done function callback, passing application model as parameter
  */
  this.update_app = function(application, attributes, callback) { callback(application); };

  /*
  Summary:
  Delete an application

  Description:
  Removes an application from the backend

  Parameters:
  - application: Application model
  - callback: done function callback, passing the deleted application model
    as parameter
  */
  this.delete_app = function(application, callback) { callback(application); };

  /*
  Summary:
  Reset application users

  Description:
  Removes all the registered users from the backend. DOES NOT DELETE THE DOCUMENTS.

  Parameters:
  - application: Application model
  - callback: done function callback
  */
  this.reset_users = function(application, callback) { callback(); };

  /*
  Summary:
  Get an application model by id. The model should also contain all the
  properties assigned using "set_app_property" call.

  Parameters:
  - app_id: Application id
  - callback: function callback, passing the application model or undefined if
    app_id is invalid
  */
  this.get_app = function(app_id, callback) { callback(); };

  /*
  Summary:
  Get an application model from api key

  Parameters:
  - api_key: API key
  - callback: function callback, passing the application model or undefined if
    api_key is invalid
  */
  this.get_api_key = function(api_key, callback) { callback(); };

  /*
  Summary:
  Set an application property

  Parameters:
  - app_id: Application id
  - property: string defining property name
  - value: a value of the property
  - callback: function callback, passing property and value
    on success
  */
  this.set_app_property = function(app_id, property, value, callback) { callback(); };

  /*
  Summary:
  Get an application property

  Parameters:
  - app_id: Application id
  - property: string defining property name
  - callback: function callback, passing property and value on success
  */
  this.get_app_property = function(app_id, property, callback) { callback(); };

  /*
  Summary:
  List registered apps

  Parameters:
  - callback: function callback, passing an array of application models that
    are registered in the backend
  */
  this.list_apps = function(callback) { callback([]); };

  // ---------------------------------- DOCUMENT ---------------------------------

  /*
  Summary:
  Get children of document

  Parameters:
  - app_id: the application id
  - document: parent Document model
  - callback: function callback, passing an array of chidren document models
  - params: (optional)
    {
      skipfields: ['attachments', 'body', ...] //skip document fields
    }
  */
  this.children = function(app_id, document, callback, params) { callback([]); };

  /*
  Summary:
  Get document by document id

  Parameters:
  - app_id: the application id
  - id: document id
  - callback: function callback, passing a document model or undefined if the
    id or app_id are invalid
  - params: (optional)
    {
      skipfields: ['attachments', 'body', ...] //skip document fields
    }
  */
  this.get = function(app_id, id, callback, params) { callback(); };

  /*
  Summary:
  Multiple get document by document ids

  Parameters:
  - app_id: the application id
  - id_array: an array of document ids
  - callback: function callback, passing an object of {id: document model} based
    on matches found
  - params: (optional)
    {
      skipfields: ['attachments', 'body', ...] //skip document fields
    }
  */
  this.mget = function(app_id, id_array, callback, params) { callback({}); };

  /*
  Summary:
  Add a new document

  Description:
  Registers a new document in the backend. If no id is defined in the model, the
  id is automatically generated based on the document type.

  Parameters:
  - app_id: the application id
  - document: Document model to add
  - callback: function callback, passing the document model as parameter or
    undefined if add operation failed
  */
  this.add = function(app_id, document, callback) { callback(); };

  /*
  Summary:
  Updates an existing document

  Description:
  Updates a document in the backend. if attributes is defined, then update only
  the specified fields

  Parameters:
  - app_id: the application id
  - document: Document model to update
  - attributes (optional): Specific fields to update, e.g. { header: 'foo' }
  - callback: function callback, passing the document model as parameter or
    undefined if add operation failed
  */
  this.update = function(app_id, document, attributes, callback) { callback(); };

  /*
  Summary:
  Updates an existing document and all its children (recursively)

  Parameters:
  - app_id: the application id
  - document: Document model to update
  - attributes (optional): Specific fields to update, e.g. { header: 'foo' }
  - callback: function callback, passing the document model as parameter or
    undefined if add operation failed
  */
  this.update_subtree = function(app_id, document, attributes, callback) { callback(); };

  // ---------------------------------- ARCHIVE --------------------------------

  /*
  Summary:
  Permanently delete a document

  Parameters:
  - app_id: the application id
  - document: Document model to delete
  - callback: function callback, passing the document model as parameter or
    undefined if delete operation failed
  */
  this.delete = function(app_id, document, callback) { callback(); };

  /*
  Summary:
  Archive a document

  Parameters:
  - app_id: the application id
  - document: Document model to delete
  - callback: function callback, passing the document model as parameter or
    undefined if archive operation failed
  */
  this.archive = function(app_id, document, callback) { callback(); };

  /*
  Summary:
  Restore an archived document

  Parameters:
  - app_id: the application id
  - document: Document model to delete
  - callback: function callback, passing the document model as parameter or
    undefined if restore operation failed
  */
  this.restore = function(app_id, document, callback) { callback(); };

  // ---------------------------------- SEARCH ---------------------------------

  /*
  Summary:
  Fuzzy search in forum, excluding channels and category names.
  Text should be able to handle special directives such as:

  #tag (must include tag)
  -#tag (must not include tag)
  +#tag (may include tag)

  @username (must include username)
  -@username (must not include username)
  +@username (may include username)

  type:<article|thread|blog|post> (must be of document type)
  -type:<article|thread|blog|post> (must not be of document type)
  +type:<article|thread|blog|post> (may be of document type)

  parent:<slug> (must have parent)
  -parent:<slug> (must not have parent)
  +parent:<slug> (may have parent)

  maxresults:<number> (maximum number of results)
  highlight:<true|yes|1> (highlight results)
  sort:<created|created_desc|updated|updated_desc|user|user_asc|user_desc> (sort by)

  Parameters:
  - app_id: the application id
  - payload: Object defining search. Contains at least a text field,
    {
      text: 'foo', //string to search for
      include_archived: true, // (optional) add archived documents as well
      include_hidden: true, // (optional) add hidden documents as well
      include_inappropriate: true, //(optional) add inappropriate posts as well
      permission: 0|1|2, //(optional) document permission level must be less-equal to this
                         //default should be 0
    }
  - callback: function callback, passing an array of document model that match
    the search query string
  - params: (optional)
    {
      skipfields: ['attachments', 'body', ...], //skip document fields
    }
  */
  this.search = function(app_id, payload, callback, params) { callback([]); };

  /*
  Summary:
  Search on fields

  Parameters:
  - app_id: the application id
  - attributes: an object of fields to search, e.g. { header: 'foo', body: 'bar' }
  - callback: function callback, passing an array of document model that match
    the search
  - params: (optional)
    {
      skipfields: ['attachments', 'body', ...], //skip document fields
      from: 0, //pagination start index
      size: 100, //max results to fetch
      sort: [{ <field> : {order : 'asc|desc'} }]
    }
  */
  this.search_attributes = function(app_id, attributes, callback, params) { callback([]); };

  /*
  Summary:
  Count search results

  Parameters:
  - app_id: the application id
  - attributes: an object of fields to search, e.g. { header: 'foo', body: 'bar' }
  - callback: function callback, passing an integer counter of search results
  */
  this.count_attributes = function(app_id, attributes, callback) { callback(0); };

  // ---------------------------------- WATCH ----------------------------------

  /*
  Summary:
  Watch document for changes in top-level children

  Parameters:
  - app_id: the application id
  - document: Document model to watch
  - user: User model who is watching the document
  - callback: function callback, passing the document as parameter on success,
    undefined on error
  */
  this.watch = function(app_id, document, user, callback) { callback(); };

  /*
  Summary:
  Unwatch document

  Parameters:
  - app_id: the application id
  - document: Document model to unwatch
  - user: User model who is unwatching the document
  - callback: function callback, passing the document as parameter on success,
    undefined on error
  */
  this.unwatch = function(app_id, document, user, callback) { callback(); };

  // ---------------------------------- USERS ----------------------------------

  /*
  Summary:
  Add a new user in the application

  Parameters:
  - app_id: the application id
  - user: User model
  - callback: function callback, passing the user as parameter on success,
    undefined on error
  */
  this.add_user = function(app_id, user, callback) { callback(); };

  /*
  Summary:
  Update user

  Parameters:
  - app_id: the application id
  - user: User model
  - attributes (optional): optional attributes to update, otherwise update the
    whole model
  - callback: function callback, passing the user as parameter on success,
    undefined on error
  */
  this.update_user = function(app_id, user, attributes, callback) { callback(user); };

  /*
  Summary:
  Delete user

  Parameters:
  - app_id: the application id
  - user: User model
  - callback: function callback, passing the user as parameter on success,
    undefined on error
  */
  this.delete_user = function(app_id, user, callback) { callback(user); };

  /*
  Summary:
  Get user by user id

  Parameters:
  - app_id: the application id
  - id: user id
  - callback: function callback, passing the user as parameter on success,
    undefined if user id or app_id is invalid
  */
  this.get_user = function(app_id, id, callback) { callback(); };

  /*
  Summary:
  Get a list of users matching attributes

  Parameters:
  - app_id: the application id
  - attributes: an object with fields to match, e.g. { username: 'foo' }
  - callback: function callback, passing a list of user models that match the
    specified attributes
  - params: (optional)
    {
      skipfields: ['tags', 'meta', ...] //skip user fields
      from: 0, //pagination start index
      size: 100, //max results to fetch
      sort: [{ <field> : {order : 'asc|desc'} }]
    }
  */
  this.match_users = function(app_id, attributes, callback, params) { callback([]); };

  /*
  Summary:
  Count users matching attributes

  Parameters:
  - app_id: the application id
  - attributes: an object with fields to match, e.g. { username: 'foo' }
  - callback: function callback, passing the number of users that match the
    specified attributes
  */
  this.count_users = function(app_id, attributes, callback) { callback(0); };

  /*
  Summary:
  Find users who are watching specific documents

  Parameters:
  - app_id: the application id
  - watch_list: an array of documents ids
  - callback: function callback, passing a list of user models that watch at
    at least one document id in the watch_list array
  */
  this.find_watch_users = function(app_id, watch_list, callback) { callback([]); };

  /*
  Summary:
  Search users matching q

  Parameters:
  - app_id: the application id
  - q: query to search
  - callback: function callback, passing a list of user models that match q
  */
  this.search_users = function(app_id, q, callback) { callback([]); };

  // ---------------------------------- GC -------------------------------------

  /*
  Summary:
  Garbage collect archived documents

  Description:
  Delete all documents who are archived and are older than the a specific
  unix timestamp

  Parameters:
  - app_id: the application id
  - timestamp: a unix timestamp
  - callback: done function callback
  */
  this.gc_archived = function(app_id, timestamp, callback) { callback(); };

  /*
  Summary:
  Garbage collect chat channels

  Description:
  Delete all chat documents who are older than the a specific
  unix timestamp

  Parameters:
  - app_id: the application id
  - timestamp: a unix timestamp
  - callback: done function callback
  */
  this.gc_chat = function(app_id, timestamp, callback) { callback(); };

  /*
  Summary:
  Garbage collect inactive users

  Description:
  Delete all inactive users who have logged in less than the a specific
  unix timestamp

  Parameters:
  - app_id: the application id
  - timestamp: a unix timestamp
  - callback: done function callback
  */
  this.gc_users = function(app_id, timestamp, callback) { callback(); };

  /*
  Summary:
  Reset onboarding for inactive users

  Description:
  Reset onboarding for all inactive users who have logged in less than the a specific
  unix timestamp

  Parameters:
  - app_id: the application id
  - timestamp: a unix timestamp
  - callback: done function callback
  */
  this.gc_onboard = function(app_id, timestamp, callback) { callback(); };
};
