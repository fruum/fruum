/******************************************************************************
  Root class for cache backends
*******************************************************************************/

'use strict';

module.exports = function(options, storage) {
  /*
  Summary:
  Store a value in the cache

  Parameters:
  - queue: "static" for caching js, css files,
           "views" for caching page views,
           "properties" for caching application properties
  - key: Key name
  - value: Value to store

  Note that "static" queue is very important and should have higher persistent
  rate, compared to the "views" queue, which should have less priority.
  */
  this.put = function(queue, key, value) {};

  /*
  Summary:
  Get a value from cache

  Parameters:
  - queue: Name of the cache queue
  - key: Key name

  Returns:
  The value or undefined if key does not exist.
  */
  this.get = function(queue, key) {};

  /*
  Summary:
  Delete a cache key

  Parameters:
  - queue: Name of the cache queue
  - key: Key name
  */
  this.del = function(queue, key) {}
}
