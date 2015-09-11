/******************************************************************************
Elastic search utilities
*******************************************************************************/

'use strict';

var _ = require('underscore'),
    uuid = require('uuid'),
    slug = require('slug'),
    logger = require('../../../logger');

module.exports = function(options, client) {
  var that = this;
  //helpers
  that.toIndex = function(app_id) {
    return 'app:' + app_id;
  }
  //try to find a unique slug based on header (truncate to max 64 characters)
  this.unique = function(app_id, document, doc_id, counter, callback) {
    var new_id = doc_id + (counter?'-' + counter:'');
    client.exists({
      index: that.toIndex(app_id),
      type: 'doc',
      id: new_id,
      refresh: true
    }, function(error, exists) {
      if (exists === true) {
        that.unique(app_id, document, doc_id, counter + 1, callback);
      }
      else {
        document.set('id', new_id);
        callback(document);
      }
    });
  }
  //find a unique slug for the document id
  this.slugify = function(app_id, document, callback) {
    var existing_id = document.get('id');
    if (existing_id && existing_id.length > 2) {
      this.unique(app_id, document, existing_id, 0, callback);
      return;
    }
    if (document.get('type') == 'post' || !document.get('header')) {
      document.set('id', uuid.v1());
      callback(document);
      return;
    }
    this.unique(app_id, document, slug(
      document.get('header').substr(0, 64).toLowerCase().replace(/\[(.*?)\]/g, '')
    ), 0, callback);
  }
  //count search results based on qsl
  this.count = function(app_id, body_qsl, callback) {
    client.count({
      index: that.toIndex(app_id),
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
  }
  //bulk operations
  this.bulk_update = function(app_id, q, fields, attributes, validator, callback) {
    var body_qsl = {
      query: {
        multi_match: {
          query: q,
          fields: fields
        }
      }
    }
    this.count(app_id, body_qsl, function(count) {
      body_qsl = _.extend(body_qsl, {
        from: 0,
        size: Math.max(count, options.elasticsearch.max_children)
      });
      client.search({
        index: that.toIndex(app_id),
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
                  _index: that.toIndex(app_id),
                  _type: 'doc',
                  _id: hit._source.id
                }});
                body.push({ doc: attributes });
              }
            });
            client.bulk({
              index: that.toIndex(app_id),
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
                  index: that.toIndex(app_id),
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
  this.bulk_delete = function(app_id, q, fields, validator, callback) {
    var body_qsl = {
      query: {
        multi_match: {
          query: q,
          fields: fields
        }
      }
    }
    this.count(app_id, body_qsl, function(count) {
      body_qsl = _.extend(body_qsl, {
        from: 0,
        size: Math.max(count, options.elasticsearch.max_children)
      });
      client.search({
        index: that.toIndex(app_id),
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
                  _index: that.toIndex(app_id),
                  _type: 'doc',
                  _id: hit._source.id
                }});
              }
            });
            client.bulk({
              index: that.toIndex(app_id),
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
                  index: that.toIndex(app_id),
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
}
