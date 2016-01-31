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

  function _search(app_id, query, callback, params) {
    var body = {
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
        pre_tags: ['{{{'],
        post_tags: ['}}}'],
        fields: {
          header: {},
          body: {}
        }
      }
    };
    if (params && params.skipfields && params.skipfields.length) {
      body._source = {
        exclude: params.skipfields
      }
    }
    client.search({
      index: self.toAppIndex(app_id),
      type: 'doc',
      refresh: true,
      body: body
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

  self.search = function(app_id, payload, callback, params) {
    //failsafe
    var q = payload.text || '',
        permission = payload.permission|0;

    //filter containers
    var must_not = [
          { term: { type: 'category' } },
          { term: { type: 'bookmark' } }
        ],
        must = [
          { range: { permission: { lte: permission } } }
        ],
        should = [],
        sort = [];

    if (!payload.include_inappropriate)
      must_not.push({ term: { inappropriate: true } });

    if (!payload.include_hidden)
      must_not.push({ term: { visible: false } });

    if (!payload.include_archived)
      must_not.push({ term: { archived: true } });

    var query = {
      must: must,
      must_not: must_not,
      should: should,
      sort: sort,
      highlight: true,
      max_results: 20
    }

    //include tags
    var tags = [];
    q = q.replace(/(^|\s)(#[a-z\d-]+)/ig, function(tag) {
      tag = tag.replace('#', '').trim();
      if (tag) {
        tag = tag.toLowerCase();
        tags.push(tag);
        must.push({ term: { tags: tag } });
      }
      return '';
    }).trim();
    //exclude tags
    q = q.replace(/(^|\s)(-#[a-z\d-]+)/ig, function(tag) {
      tag = tag.replace('-#', '').trim();
      if (tag) {
        tag = tag.toLowerCase();
        tags.push(tag);
        must_not.push({ term: { tags: tag } });
      }
      return '';
    }).trim();

    //include users
    var users = [];
    q = q.replace(/(^|\s)(@[a-z\d-]+)/ig, function(user) {
      user = user.replace('@', '').trim();
      if (user) {
        users.push(user);
        must.push({ term: { user_username: user } });
      }
      return '';
    }).trim();
    //exclude users
    q = q.replace(/(^|\s)(-@[a-z\d-]+)/ig, function(user) {
      user = user.replace('-#', '').trim();
      if (user) {
        users.push(user);
        must_not.push({ term: { user_username: user } });
      }
      return '';
    }).trim();

    //disable highlighting on tagged search
    query.highlight = (tags.length == 0) && (users.length == 0);
    if (tags.length || users.length) {
      query.max_results = options.elasticsearch.max_children;
    }

    //extract keys
    var tokens = q.split(' ');
    _.each(tokens, function(token) {
      var pair = token.split(':');
      if (pair.length == 2) {
        q = q.replace(token, '').trim();
        switch (pair[0]) {
          case 'parent':
            must.push({ term: { parent: pair[1] } });
            break;
          case 'type':
            must.push({ term: { type: pair[1] } });
            break;
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

    //add some default sorting
    if (!sort.length) {
      //in case of tags or users, sort by dated descending
      if (tags.length || users.length) {
        sort.push({ created : {order : 'desc'} });
      }
    }

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
          { match: { type: 'blog' } },
          { match: { header: q } } ] } },
        { bool: { must: [
          { match: { type: 'blog' } },
          { match: { body: q } } ] } },
        { bool: { must: [
          { match: { type: 'post' } },
          { match: { body: q } } ] } }
      );
    }

    _search(app_id, query, callback, params);
  }

  // --------------------------- SEARCH ON FIELDS ------------------------------

  self.search_attributes = function(app_id, attributes, callback, params) {
    var body = {
      from: 0,
      size: options.elasticsearch.max_children,
      query: self.createSearchQSL(attributes)
    };
    if (params && params.skipfields && params.skipfields.length) {
      body._source = {
        exclude: params.skipfields
      }
    }
    client.search({
      index: self.toAppIndex(app_id),
      type: 'doc',
      refresh: true,
      body: body
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
