/******************************************************************************
 Document watchers
*******************************************************************************/

'use strict';

var _ = require('underscore'),
    logger = require('../../../logger');

module.exports = function(options, client, self) {
  // -------------------------------- WATCH ------------------------------------

  self.watch = function(app_id, document, user, callback) {
    // get latest user
    self.get_user(app_id, user.get('id'), function(latest_user) {
      if (!latest_user) {
        callback();
      } else {
        var watchlist = latest_user.get('watch') || [],
            doc_id = document.get('id');
        if (watchlist.indexOf(doc_id) == -1) {
          watchlist.push(doc_id);
          user.set('watch', watchlist);
          self.update_user(app_id, latest_user, { watch: watchlist }, function() {
            logger.info(app_id, 'watch:' + doc_id, user);
            callback(document);
          });
        } else {
          callback(document);
        }
      }
    });
  };

  // -------------------------------- UNWATCH ----------------------------------

  self.unwatch = function(app_id, document, user, callback) {
    // get latest user
    self.get_user(app_id, user.get('id'), function(latest_user) {
      if (!latest_user) {
        callback();
      } else {
        var watchlist = latest_user.get('watch') || [],
            doc_id = document.get('id');
        if (watchlist.indexOf(doc_id) >= 0) {
          watchlist = _.without(watchlist, doc_id);
          user.set('watch', watchlist);
          self.update_user(app_id, latest_user, { watch: watchlist }, function() {
            logger.info(app_id, 'unwatch:' + doc_id, user);
            callback(document);
          });
        } else {
          callback(document);
        }
      }
    });
  };
};
