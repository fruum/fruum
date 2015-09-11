/******************************************************************************
 Search
*******************************************************************************/

'use strict';

var _ = require('underscore'),
    validators = require('./validator'),
    Utils = require('./util'),
    Models = require('../../../models');

function endsWith(str, suffix) {
  return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

module.exports = function(options, client) {
  var utils = new Utils(options, client);

  // -------------------------------- SEARCH -----------------------------------

  this.search = function(app_id, q, callback) {
    client.search({
      index: utils.toIndex(app_id),
      type: 'doc',
      body: {
        from: 0,
        size: 20,
        query: {
          filtered: {
            filter: {
              bool: {
                must_not: [
                  { term: { archived: true } },
                  { term: { visible: false } },
                  { term: { inappropriate: true } },
                  { term: { type: 'category' } }
                ]
              }
            },
            query: {
              bool: {
                should: [
                  {
                    bool: {
                      must: [
                        { match: { type: 'thread' } },
                        { match: { header: q } }
                      ]
                    }
                  },
                  {
                    bool: {
                      must: [
                        { match: { type: 'thread' } },
                        { match: { body: q } }
                      ]
                    }
                  },
                  {
                    bool: {
                      must: [
                        { match: { type: 'article' } },
                        { match: { header: q } }
                      ]
                    }
                  },
                  {
                    bool: {
                      must: [
                        { match: { type: 'article' } },
                        { match: { body: q } }
                      ]
                    }
                  },
                  {
                    bool: {
                      must: [
                        { match: { type: 'post' } },
                        { match: { body: q } }
                      ]
                    }
                  }
                ]
              }
            }
          }
        },
        highlight: {
          pre_tags: ['<span class="highlight">'],
          post_tags: ['</span>'],
          fields: {
            header: {},
            body: {}
          }
        }
      }
    }, function(error, response) {
      var results = [];
      if (!error && response && response.hits && response.hits.hits) {
        _.each(response.hits.hits, function(hit) {
          if (hit.highlight) {
            var found = false;
            if (hit.highlight.header && hit.highlight.header.length) {
              found = true;
            }
            if (hit.highlight.body && hit.highlight.body.length) {
              hit._source.body = hit.highlight.body[0];
              found = true;
            }
            if (found) {
              results.push(new Models.Document(hit._source))
            }
          }
        });
      }
      callback(results);
    });
  }

  // --------------------------- SEARCH ON FIELDS ------------------------------

  this.search_attributes = function(app_id, attributes, callback) {
    var matches = [], not_matches = [];
    for (var key in attributes) {
      var term = {},
          value = attributes[key],
          range = key.match(/__lte|__lt|__gte|__gt/),
          negative = key.match(/__not/);

      if (range && range.length) {
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
    client.search({
      index: utils.toIndex(app_id),
      type: 'doc',
      body: {
        from: 0,
        size: options.elasticsearch.max_children,
        query: {
          bool: {
            must: matches,
            must_not: not_matches
          }
        }
      }
    }, function(error, response) {
      var results = [];
      if (!error && response && response.hits && response.hits.hits) {
        _.each(response.hits.hits, function(hit) {
          results.push(new Models.Document(hit._source))
        });
      }
      callback(results);
    });
  }
}
