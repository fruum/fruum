/******************************************************************************
 Garbage collector
*******************************************************************************/

'use strict';

var _ = require('underscore'),
    validators = require('./validator'),
    Utils = require('./util'),
    logger = require('../../../logger');

module.exports = function(options, client) {
  var utils = new Utils(options, client);
  this.gc = function(app_id, timestamp, callback) {
    client.search({
      index: utils.toIndex(app_id),
      type: 'doc',
      refresh: true,
      body: {
        from: 0,
        size: options.elasticsearch.max_children,
        query: {
          filtered: {
            filter: {
              bool: {
                must: [
                  { range: { archived_ts: { lte: timestamp } } },
                  { term: { archived: true } }
                ]
              }
            }
          }
        }
      }
    }, function(error, response) {
      if (error) {
        logger.error(app_id, 'gc', error);
      }
      else if (response.hits && response.hits.hits && response.hits.hits.length) {
        if (options.elasticsearch.use_bulk) {
          var body = [];
          _.each(response.hits.hits, function(hit) {
            if (validators.delete(hit._source, timestamp)) {
              body.push({ delete: {
                _index: hit._index,
                _type: 'doc',
                _id: hit._source.id
              }});
            }
          });
          client.bulk({
            refresh: true,
            body: body
          }, function(error, response) {
            if (error) {
              logger.error('_all', 'delete_bulk', error);
            }
            else {
              logger.info('_all', 'delete_bulk', body.length + ' deleted for timestamp ' + timestamp);
            }
            callback();
          });
        }
        else {
          var body = [];
          _.each(response.hits.hits, function(hit) {
            if (validators.delete(hit._source, timestamp)) {
              body.push({
                index: utils.toIndex(app_id),
                type: 'doc',
                id: hit._source.id
              });
            }
          });
          var counter = body.length;
          _.each(body, function(entry) {
            client.delete(entry, function(error, response) {
              counter--;
              if (error) logger.error(app_id, 'delete_bulk', error);
              else logger.info(app_id, 'delete_bulk', entry.id);
              if (!counter) callback();
            });
          });
        }
        return;
      }
      callback();
    });
  }
}
