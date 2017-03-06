/******************************************************************************
  Root class for cache backends
*******************************************************************************/

'use strict';

module.exports = function(options, storage) {
  /*
  Summary:
  Store a value in the cache

  Parameters:
  - key: Key name
  - value: Value to store
  */
  this.put = function(key, value) {};

  /*
  Summary:
  Get a value from cache

  Parameters:
  - key: Key name
  - callback function passing the stored value or undefined
  */
  this.get = function(key, callback) { callback(); };

  /*
  Summary:
  Delete a cache key

  Parameters:
  - key: Key name
  */
  this.del = function(key) {};
};
