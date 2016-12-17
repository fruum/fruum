/******************************************************************************
Elastic search stogage engine
*******************************************************************************/

'use strict';

var _ = require('underscore'),
    elasticsearch = require('elasticsearch'),
    Base = require('./base');

function ElasticSearch(options) {
  _.extend(this, new Base(options));
  options.elasticsearch = options.elasticsearch || {};
  options.elasticsearch.host = options.elasticsearch.host || 'http://localhost:9200';
  options.elasticsearch.max_children = options.elasticsearch.max_children || 1000;
  options.elasticsearch.retry_on_conflict = options.elasticsearch.retry_on_conflict || 0;
  options.elasticsearch.index_prefix = options.elasticsearch.index_prefix || '';

  var client_params = { host: options.elasticsearch.host };
  if (options.elasticsearch.apiVersion) {
    client_params.apiVersion = options.elasticsearch.apiVersion;
  }
  var client = new elasticsearch.Client(client_params);

  // ------------------------------- PARTIALS= ---------------------------------

  require('./elasticsearch/util')(options, client, this);
  require('./elasticsearch/application')(options, client, this);
  require('./elasticsearch/deletion')(options, client, this);
  require('./elasticsearch/get')(options, client, this);
  require('./elasticsearch/management')(options, client, this);
  require('./elasticsearch/search')(options, client, this);
  require('./elasticsearch/set')(options, client, this);
  require('./elasticsearch/watch')(options, client, this);
  require('./elasticsearch/user')(options, client, this);
  require('./elasticsearch/gc')(options, client, this);
}
module.exports = ElasticSearch;
