/******************************************************************************
 Search
*******************************************************************************/

'use strict';

var _ = require('underscore'),
    validators = require('./validator'),
    Models = require('../../../models');

function endsWith(str, suffix) {
  return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

module.exports = function(options, client, self) {

  // -------------------------------- SEARCH -----------------------------------

  function _fuzzy(q) {
    return {
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
  function _tag(q) {
    return {
      bool: {
        should: [
          {
            bool: {
              must: [
                { match: { tags: q } }
              ]
            }
          }
        ]
      }
    }
  }

  self.search = function(app_id, q, callback) {
    var query = {}, no_highlight = false;
    if (q && q[0] == '[' && q[q.length - 1] == ']') {
      query = _tag(q.substr(1, q.length - 2));
      no_highlight = true;
    }
    else {
      query = _fuzzy(q);
    }
    client.search({
      index: self.toIndex(app_id),
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
            query: query
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
          if (no_highlight) {
            results.push(new Models.Document(hit._source));
          }
          else if (hit.highlight) {
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

  self.search_attributes = function(app_id, attributes, callback) {
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
    client.search({
      index: self.toIndex(app_id),
      type: 'doc',
      body: {
        from: 0,
        size: options.elasticsearch.max_children,
        query: {
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
