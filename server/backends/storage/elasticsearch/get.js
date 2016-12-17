/******************************************************************************
 Document getters
*******************************************************************************/

'use strict';

var _ = require('underscore'),
    validators = require('./validator'),
    Models = require('../../../models');

module.exports = function(options, client, self) {
  // -------------------------------- GET SINGLE--------------------------------

  self.get = function(app_id, id, callback, params) {
    client.get({
      index: self.toAppIndex(app_id),
      type: 'doc',
      id: id,
      refresh: true,
    }, function(error, response) {
      if (error) {
        // not found
        callback();
      } else if (response._source) {
        callback(new Models.Document(response._source));
      }
    });
  };

  // ------------------------------ GET MULTIPLE -------------------------------

  self.mget = function(app_id, id_array, callback, params) {
    var data = {
      index: self.toAppIndex(app_id),
      type: 'doc',
      refresh: true,
      body: { ids: id_array },
    };
    if (params && params.skipfields && params.skipfields.length) {
      data._sourceExclude = params.skipfields;
    }
    client.mget(data, function(error, response) {
      var values = {};
      if (error) {
      } else if (response && response.docs) {
        _.each(response.docs, function(hit) {
          if (validators.mget(hit._source, id_array)) {
            values[hit._source.id] = new Models.Document(hit._source);
          }
        });
      }
      callback(values);
    });
  };

  // -------------------------------- CHILDREN ---------------------------------

  self.children = function(app_id, document, callback, params) {
    var order = 'desc';
    if (document.get('parent_type') == 'thread' ||
        document.get('parent_type') == 'artile') order = 'asc';
    var id = document.get('id');
    var body = {
      from: 0,
      size: options.elasticsearch.max_children,
      sort: [{ created: {order: order} }],
      query: {
        filtered: {
          filter: {
            bool: {
              must: [
                { term: { parent: id } },
                { term: { archived: false } }
              ],
            },
          },
        },
      },
    };
    if (params && params.skipfields && params.skipfields.length) {
      body._source = {
        exclude: params.skipfields,
      };
    }
    client.search({
      index: self.toAppIndex(app_id),
      type: 'doc',
      refresh: true,
      body: body,
    }, function(error, response) {
      var values = [];
      if (error) {
      } else if (response && response.hits && response.hits.hits) {
        _.each(response.hits.hits, function(hit) {
          if (validators.children(hit._source, id)) {
            values.push(new Models.Document(hit._source));
          }
        });
      }
      callback(values);
    });
  };
};
