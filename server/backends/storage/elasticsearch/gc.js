/******************************************************************************
 Garbage collector
*******************************************************************************/

'use strict';

var _ = require('underscore'),
    validators = require('./validator'),
    logger = require('../../../logger');

module.exports = function(options, client, self) {

  self._purgeArray = function(app_id, type_index, timestamp, hits, validator, callback) {
    if (options.elasticsearch.use_bulk) {
      var body = [];
      _.each(hits, function(hit) {
        if (validator(hit._source, timestamp)) {
          body.push({ delete: {
            _index: hit._index,
            _type: type_index,
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
      _.each(hits, function(hit) {
        if (validator(hit._source, timestamp)) {
          body.push({
            index: self.toAppIndex(app_id),
            type: type_index,
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
  }

  self._updateArray = function(app_id, type_index, timestamp, hits, validator, attributes, callback) {
    if (options.elasticsearch.use_bulk) {
      var body = [];
      _.each(hits, function(hit) {
        if (validator(hit._source, timestamp)) {
          body.push({ update: {
            _index: hit._index,
            _type: type_index,
            _id: hit._source.id,
            doc: attributes
          }});
        }
      });
      client.bulk({
        refresh: true,
        body: body
      }, function(error, response) {
        if (error) {
          logger.error('_all', 'update_bulk', error);
        }
        else {
          logger.info('_all', 'update_bulk', body.length + ' updated for timestamp ' + timestamp);
        }
        callback();
      });
    }
    else {
      var body = [];
      _.each(hits, function(hit) {
        if (validator(hit._source, timestamp)) {
          body.push({
            index: self.toAppIndex(app_id),
            type: type_index,
            id: hit._source.id,
            body: { doc: attributes }
          });
        }
      });
      var counter = body.length;
      _.each(body, function(entry) {
        client.update(entry, function(error, response) {
          counter--;
          if (error) logger.error(app_id, 'update_bulk', error);
          else logger.info(app_id, 'update_bulk', entry.id);
          if (!counter) callback();
        });
      });
    }
  }

  self.gc_archived = function(app_id, timestamp, callback) {
    client.search({
      index: self.toAppIndex(app_id),
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
        logger.error(app_id, 'gc_archived', error);
      }
      else if (response.hits && response.hits.hits && response.hits.hits.length) {
        self._purgeArray(app_id, 'doc', timestamp, response.hits.hits, validators.gc_archived, callback);
        return;
      }
      callback();
    });
  }

  self.gc_chat = function(app_id, timestamp, callback) {
    client.search({
      index: self.toAppIndex(app_id),
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
                  { range: { updated: { lte: timestamp } } },
                  { term: { type: 'post' } },
                  { term: { parent_type: 'channel' } }
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
        self._purgeArray(app_id, 'doc', timestamp, response.hits.hits, validators.gc_chat, callback);
        return;
      }
      callback();
    });
  }

  self.gc_users = function(app_id, timestamp, callback) {
    client.search({
      index: self.toAppIndex(app_id),
      type: 'user',
      refresh: true,
      body: {
        from: 0,
        size: options.elasticsearch.max_children,
        query: {
          filtered: {
            filter: {
              bool: {
                must: [
                  { range: { last_login: { lte: timestamp } } },
                  { term: { admin: false } },
                  { term: { karma: 0 } },
                  { missing: { field: 'watch' } }
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
        self._purgeArray(app_id, 'user', timestamp, response.hits.hits, validators.gc_users, callback);
        return;
      }
      callback();
    });
  }

  self.gc_onboard = function(app_id, timestamp, callback) {
    client.search({
      index: self.toAppIndex(app_id),
      type: 'user',
      refresh: true,
      body: {
        from: 0,
        size: options.elasticsearch.max_children,
        query: {
          filtered: {
            filter: {
              bool: {
                must: [
                  { range: { last_login: { lte: timestamp } } }
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
        self._updateArray(
          app_id,
          'user',
          timestamp,
          response.hits.hits,
          validators.gc_onboard,
          { onboard: 0 },
          callback
        );
        return;
      }
      callback();
    });
  }
}
