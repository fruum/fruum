/******************************************************************************
 Hierarchy tools
*******************************************************************************/

'use strict';

var _ = require('underscore'),
    logger = require('../logger');

module.exports = function(options, instance, self) {
  var storage = self.storage;

  self.refreshChildrenCount = function(app_id, doc_id, done) {
    setTimeout(function() {
      storage.get(app_id, doc_id, function(document) {
        if (!document) {
          done && done();
          return;
        }
        storage.count_attributes(app_id, {
          parent: doc_id,
          archived: false,
          type__not: 'category'
        }, function(total) {
          storage.update(app_id, document, {
            children_count: total
          }, function(updated_doc) {
            if (updated_doc) {
              self.invalidateDocument(app_id, updated_doc);
              logger.info(app_id, 'refresh_children_count', updated_doc.get('id') + ': ' + total);
            }
            done && done();
          });
        });
      });
    }, 2000);
  }

  self.refreshUpdateTS = function(app_id, doc_id, now, user) {
    storage.get(app_id, doc_id, function(document) {
      if (!document) {
        return;
      }
      storage.update(app_id, document, {
        updated: now
      }, function(updated_doc) {
        if (updated_doc) {
          self.invalidateDocument(app_id, updated_doc);
          logger.info(app_id, 'refresh_updated_ts', updated_doc.get('id') + ': ' + now);
          if (user) {
            self.broadcastInfo(user, updated_doc);
          }
          if (updated_doc.get('parent')) {
            self.refreshUpdateTS(app_id, updated_doc.get('parent'), now, user);
          }
        }
      });
    });
  }

}
