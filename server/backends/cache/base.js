/******************************************************************************
  Root class for cache backends
*******************************************************************************/

'use strict';

function _gen_cache_key(app_id, admin, doc_id) {
  return app_id + ':' + (admin|0) + ':' + doc_id;
}

module.exports = function(options) {
  //store a value in cache
  this.put = function(queue, key, value) {};
  //get a value from cache
  this.get = function(queue, key) {};
  //delete a value from cache
  this.del = function(queue, key) {}

  //high level function add document to cache
  this.cache_response = function(app_id, user, doc_id, response) {
    if (!user) return;
    this.put('views', _gen_cache_key(app_id, user.get('admin'), doc_id), response);
  }
  this.invalidate_cache = function(app_id, doc_id) {
    this.del('views', _gen_cache_key(app_id, true, doc_id));
    this.del('views', _gen_cache_key(app_id, false, doc_id));
  }
  this.invalidate_document = function(app_id, document) {
    this.invalidate_cache(app_id, document.get('id'));
    this.invalidate_cache(app_id, document.get('parent'));
  }
  this.get_cached_response = function(app_id, user, doc_id, hit, miss) {
    if (!user) return;
    var key = _gen_cache_key(app_id, user.get('admin'), doc_id);
    var data = this.get('views', key);
    if (data) {
      hit && hit(data);
    }
    else {
      miss && miss();
    }
  }
}
