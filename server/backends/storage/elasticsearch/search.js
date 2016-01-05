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

  function _search(app_id, query, callback) {
    client.search({
      index: self.toAppIndex(app_id),
      type: 'doc',
      refresh: true,
      body: {
        from: 0,
        size: query.max_results,
        sort: query.sort,
        query: {
          filtered: {
            filter: {
              bool: {
                must_not: query.must_not,
                must: query.must
              }
            },
            query: {
              bool: {
                should: query.should
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
          if (!query.highlight) {
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

  self.search = function(app_id, q, callback) {
    //failsafe
    q = q || '';

    //filter containers
    var must_not = [
          { term: { archived: true } },
          { term: { visible: false } },
          { term: { inappropriate: true } },
          { term: { type: 'category' } }
        ],
        must = [], should = [], sort = [];

    var query = {
      must: must,
      must_not: must_not,
      should: should,
      sort: sort,
      highlight: true,
      max_results: 20
    }

    //extract tags
    var tags = [];
    q = q.replace(/(^|\s)(#[a-z\d-]+)/ig, function(tag) {
      tag = tag.replace('#', '').trim();
      if (tag) tags.push(tag.toLowerCase());
      return '';
    }).trim();
    //put tags in the must filter
    _.each(tags, function(tag) {
      must.push({ term: { tags: tag } });
    });
    //disable highlighting on tagged search
    query.highlight = tags.length == 0;

    //extract keys
    var tokens = q.split(' ');
    _.each(tokens, function(token) {
      var pair = token.split(':');
      if (pair.length == 2) {
        q = q.replace(token, '').trim();
        switch (pair[0]) {
          case 'maxresults':
            query.max_results = pair[1]|0;
            break;
          case 'highlight':
            query.highlight = /(true|1|yes)/i.test(pair[1]);
            break;
          case 'sort':
            switch(pair[1].toLowerCase()) {
              case 'created':
              case 'created_desc':
                sort.push({ created : {order : 'desc'} });
                break;
              case 'created_asc':
                sort.push({ created : {order : 'asc'} });
                break;
              case 'updated':
              case 'updated_desc':
                sort.push({ updated : {order : 'desc'} });
                break;
              case 'updated_asc':
                sort.push({ updated : {order : 'asc'} });
                break;
              case 'user':
              case 'user_desc':
                sort.push({ user_username : {order : 'desc'} });
                break;
              case 'user_asc':
                sort.push({ user_username : {order : 'asc'} });
                break;
            }
            break;
        }
      }
    });

    //put normal string search in the should filter
    if (q) {
      should.push(
        { bool: { must: [
          { match: { type: 'thread' } },
          { match: { header: q } } ] } },
        { bool: { must: [
          { match: { type: 'thread' } },
          { match: { body: q } } ] } },
        { bool: { must: [
          { match: { type: 'article' } },
          { match: { header: q } } ] } },
        { bool: { must: [
          { match: { type: 'article' } },
          { match: { body: q } } ] } },
        { bool: { must: [
          { match: { type: 'post' } },
          { match: { body: q } } ] } }
      );
    }

    _search(app_id, query, callback);
  }

  // --------------------------- SEARCH ON FIELDS ------------------------------

  self.search_attributes = function(app_id, attributes, callback) {
    client.search({
      index: self.toAppIndex(app_id),
      type: 'doc',
      refresh: true,
      body: {
        from: 0,
        size: options.elasticsearch.max_children,
        query: self.createSearchQSL(attributes)
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

  self.count_attributes = function(app_id, attributes, callback) {
    client.count({
      index: self.toAppIndex(app_id),
      type: 'doc',
      refresh: true,
      body: {
        query: self.createSearchQSL(attributes)
      }
    }, function(error, response) {
      if (error) {
        logger.error(app_id, 'count_attributes', error);
        callback(0);
        return;
      }
      else {
        callback(response.count || 0);
      }
    });
  }
}
