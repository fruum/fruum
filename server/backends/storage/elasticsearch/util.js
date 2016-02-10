/******************************************************************************
Elastic search utilities
*******************************************************************************/

'use strict';

var _ = require('underscore'),
    uuid = require('uuid'),
    slug = require('slug'),
    logger = require('../../../logger');

module.exports = function(options, client, self) {
  var index_prefix = options.elasticsearch.index_prefix;
  //helpers
  self.toAppIndex = function(app_id) {
    return index_prefix + 'app:' + app_id;
  }
  self.toMasterIndex = function() {
    return index_prefix + 'applications';
  }
  //try to find a unique slug based on header (truncate to max 64 characters)
  self.unique = function(app_id, document, doc_id, counter, callback) {
    var new_id = doc_id + (counter?'-' + counter:'');
    client.exists({
      index: self.toAppIndex(app_id),
      type: 'doc',
      id: new_id,
      refresh: true
    }, function(error, exists) {
      if (exists === true) {
        self.unique(app_id, document, doc_id, counter + 1, callback);
      }
      else {
        document.set('id', new_id);
        callback(document);
      }
    });
  }
  //find a unique slug for the document id
  self.slugify = function(app_id, document, callback) {
    var existing_id = document.get('id');
    if (existing_id && existing_id.length > 2) {
      self.unique(app_id, document, existing_id, 0, callback);
      return;
    }
    if (document.get('type') == 'post' || !document.get('header')) {
      document.set('id', uuid.v1());
      callback(document);
      return;
    }
    self.unique(app_id, document, slug(
      document.get('header').substr(0, 64).toLowerCase().replace(/\[(.*?)\]/g, '')
    ), 0, callback);
  }
  //refresh index
  self.refreshIndex = function(app_id, callback) {
    client.indices.refresh({
      index: self.toAppIndex(app_id)
    }, function(error, response) {
      if (error) {
        logger.error(app_id, '_refreshIndex', error);
      }
      callback && callback();
    });
  }
  //count search results based on qsl
  self.count = function(app_id, body_qsl, callback) {
    self.refreshIndex(app_id, function() {
      client.count({
        index: self.toAppIndex(app_id),
        type: 'doc',
        refresh: true,
        body: body_qsl
      }, function(error, response) {
        if (error) {
          logger.error(app_id, '_count', error);
          callback(0);
          return;
        }
        else {
          callback(response.count || 0);
        }
      });
    });
  }
  //bulk operations
  self.bulk_update = function(app_id, q, fields, attributes, validator, callback) {
    var body_qsl = {
      query: {
        multi_match: {
          query: q,
          fields: fields
        }
      }
    }
    self.count(app_id, body_qsl, function(count) {
      body_qsl = _.extend(body_qsl, {
        from: 0,
        size: Math.max(count, options.elasticsearch.max_children)
      });
      client.search({
        index: self.toAppIndex(app_id),
        type: 'doc',
        refresh: true,
        body: body_qsl
      }, function(error, response) {
        if (error) {
          logger.error(app_id, 'update_bulk_search', error);
        }
        else if (response.hits && response.hits.hits && response.hits.hits.length) {
          if (options.elasticsearch.use_bulk) {
            var body = [];
            _.each(response.hits.hits, function(hit) {
              if (validator(hit._source, q)) {
                body.push({ update: {
                  _index: self.toAppIndex(app_id),
                  _type: 'doc',
                  _id: hit._source.id
                }});
                body.push({ doc: attributes });
              }
            });
            client.bulk({
              index: self.toAppIndex(app_id),
              type: 'doc',
              refresh: true,
              body: body
            }, function(error, response) {
              if (error) {
                logger.error(app_id, 'update_bulk', error);
              }
              else {
                logger.info(app_id, 'update_bulk', (body.length / 2) + ' updates on ' + q + ' with ' + JSON.stringify(attributes));
                if (response.errors) {
                  logger.error(app_id, 'update_bulk', JSON.stringify(body));
                  logger.error(app_id, 'update_bulk', response);
                }
              }
              callback();
            });
          }
          else {
            var body = [];
            _.each(response.hits.hits, function(hit) {
              if (validator(hit._source, q)) {
                body.push({
                  index: self.toAppIndex(app_id),
                  type: 'doc',
                  id: hit._source.id,
                  retryOnConflict: options.elasticsearch.retry_on_conflict,
                  body: {
                    doc: attributes
                  }
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
          return;
        }
        callback();
      });
    });
  }
  self.bulk_delete = function(app_id, q, fields, validator, callback) {
    var body_qsl = {
      query: {
        multi_match: {
          query: q,
          fields: fields
        }
      }
    }
    self.count(app_id, body_qsl, function(count) {
      body_qsl = _.extend(body_qsl, {
        from: 0,
        size: Math.max(count, options.elasticsearch.max_children)
      });
      client.search({
        index: self.toAppIndex(app_id),
        type: 'doc',
        refresh: true,
        body: body_qsl
      }, function(error, response) {
        if (error) {
          logger.error(app_id, 'delete_bulk_search', error);
        }
        else if (response.hits && response.hits.hits && response.hits.hits.length) {
          if (options.elasticsearch.use_bulk) {
            var body = [];
            _.each(response.hits.hits, function(hit) {
              if (validator(hit._source, q)) {
                body.push({ delete: {
                  _index: self.toAppIndex(app_id),
                  _type: 'doc',
                  _id: hit._source.id
                }});
              }
            });
            client.bulk({
              index: self.toAppIndex(app_id),
              type: 'doc',
              refresh: true,
              body: body
            }, function(error, response) {
              if (error) {
                logger.error(app_id, 'delete_bulk', error);
              }
              else {
                logger.info(app_id, 'delete_bulk', body.length + ' deletions on ' + q);
                if (response.errors) {
                  logger.error(app_id, 'delete_bulk', JSON.stringify(body));
                  logger.error(app_id, 'delete_bulk', response);
                }
              }
              callback();
            });
          }
          else {
            var body = [];
            _.each(response.hits.hits, function(hit) {
              if (validator(hit._source, q)) {
                body.push({
                  index: self.toAppIndex(app_id),
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
    });
  }

  self.createSearchQSL = function(attributes) {
    var matches = [], not_matches = [], filter = {};
    for (var key in attributes) {
      var term = {},
          value = attributes[key],
          range = key.match(/__lte|__lt|__gte|__gt/),
          negative = key.match(/__not/);

      if (key === 'ids') {
        filter = {
          ids: {
            values: value
          }
        }
      }
      else if (range && range.length) {
        var term_val = {};
        range = range[0];
        key = key.replace(range, '');
        range = range.replace('__', '');
        term_val[key] = {};
        term_val[key][range] = value;
        matches.push({ range: term_val });
      }
      else if (negative && negative.length) {
        var term_val = {};
        key = key.replace(negative, '');
        term_val[key] = value;
        not_matches.push({ term: term_val });
      }
      else {
        var term_val = {};
        term_val[key] = value;
        matches.push({ term: term_val });
      }
    }
    return {
      filtered: {
        filter: filter,
        query: {
          bool: {
            must: matches,
            must_not: not_matches
          }
        }
      }
    }
  }
}
