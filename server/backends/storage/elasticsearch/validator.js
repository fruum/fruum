/******************************************************************************
Elastic search response validators
*******************************************************************************/

'use strict';

var _ = require('underscore');

module.exports = {
  id: function (source, q) {
    return source.id == q || source.parent == q || source.breadcrumb.indexOf(q) >= 0;
  },
  user_id: function (source, q) {
    return source.user_id == q;
  },
  mget: function (source, q) {
    return q.indexOf(source.id) >= 0;
  },
  children: function (source, q) {
    return source.parent == q && !source.archived;
  },
  delete: function (source, q) {
    return source.archived == true && source.archived_ts <= q;
  },
  match_users: function(source, q) {
    return _.isMatch(source, q);
  },
  find_watch_users: function(source, q) {
    return _.intersection(source.watch, q).length > 0;
  }
}
