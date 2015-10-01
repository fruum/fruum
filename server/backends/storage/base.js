/******************************************************************************
  Root class for storage backends
*******************************************************************************/

'use strict';

module.exports = function(options) {
  //initialize DB
  this.setup = function() {};
  //migrates the database
  this.migrate = function() {};
  //teardown DB
  this.teardown = function() {};
  //register app
  this.add_app = function(application, callback) { callback(application); };
  //update app settings
  this.update_app = function(application, attributes, callback) { callback(application); };
  //remove app
  this.delete_app = function(application, callback) { callback(application); };
  //reset users
  this.reset_users = function(application, callback) { callback(); }
  //get app
  this.get_app = function(app_id, callback) { callback(); }
  //get app from api_key
  this.get_api_key = function(api_key, callback) { callback(); }
  //list all apps
  this.list_apps = function(callback) { callback([]); }

  //get children of document
  this.children = function(app_id, document, callback) { callback([]); }
  //get single document
  this.get = function(app_id, id, callback) { callback(); }
  //get multiple documents, return a hashmap of { id: document }
  this.mget = function(app_id, id_array, callback) { callback({}); }
  //add new document
  this.add = function(app_id, document, callback) { callback(); }
  //update existing document, if attributes is defined then update only those
  //attributes else the whole document
  this.update = function(app_id, document, attributes, callback) { callback(); }
  //update existing document and children on specific attributes
  this.update_subtree = function(app_id, document, attributes, callback) { callback(); }
  //delete document
  this.delete = function(app_id, document, callback) { callback(); }
  //archive document
  this.archive = function(app_id, document, callback) { callback(); }
  //restore archived document
  this.restore = function(app_id, document, callback) { callback(); }
  //search by text
  this.search = function(app_id, q, callback) { callback([]); }
  //search on specific fields
  this.search_attributes = function(app_id, attributes, callback) { callback([]); }
  //count search on specific fields
  this.count_attributes = function(app_id, attributes, callback) { callback(0); }
  //watch document
  this.watch = function(app_id, document, user, callback) { callback(); }
  //un-watch document
  this.unwatch = function(app_id, document, user, callback) { callback(); }

  //register new user
  this.add_user = function(app_id, user, callback) { callback(); }
  //update user details
  this.update_user = function(app_id, user, attributes, callback) { callback(user); }
  //get user
  this.get_user = function(app_id, id, callback) { callback(); }
  //get users based on matching attributes
  this.match_users = function(app_id, attributes, callback) { callback([]); }
  //get users based on matching watches document ids
  this.find_watch_users = function(app_id, watch_list, callback) { callback([]); }

  //delete all archived documents which are older then the UNIX timestamp
  this.gc_archived = function(app_id, timestamp, callback) { callback(); }
  //delete all channel chat documents which are older then the UNIX timestamp
  this.gc_chat = function(app_id, timestamp, callback) { callback(); }
}
