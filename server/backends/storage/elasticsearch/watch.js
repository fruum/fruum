/******************************************************************************
 Document watchers
*******************************************************************************/

'use strict';

var _ = require('underscore'),
    validators = require('./validator'),
    Utils = require('./util'),
    logger = require('../../../logger');

module.exports = function(options, client, driver) {
  var utils = new Utils(options, client);

  // -------------------------------- WATCH ------------------------------------

  this.watch = function(app_id, document, user, callback) {
    //get latest user
    driver.get_user(app_id, user.get('id'), function(latest_user) {
      if (!latest_user) {
        callback();
      }
      else {
        var watchlist = latest_user.get('watch') || [],
            doc_id = document.get('id');
        if (watchlist.indexOf(doc_id) == -1) {
          watchlist.push(doc_id);
          driver.update_user(app_id, latest_user, { watch: watchlist }, function() {
            callback(document);
          });
        }
        else {
          callback(document);
        }
      }
    });
  }

  // -------------------------------- UNWATCH ----------------------------------

  this.unwatch = function(app_id, document, user, callback) {
    //get latest user
    driver.get_user(app_id, user.get('id'), function(latest_user) {
      if (!latest_user) {
        callback();
      }
      else {
        var watchlist = latest_user.get('watch') || [],
            doc_id = document.get('id');
        if (watchlist.indexOf(doc_id) >= 0) {
          watchlist = _.without(watchlist, doc_id);
          driver.update_user(app_id, latest_user, { watch: watchlist }, function() {
            callback(document);
          });
        }
        else {
          callback(document);
        }
      }
    });
  }
}
