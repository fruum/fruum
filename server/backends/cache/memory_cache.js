/******************************************************************************
  memory-cache backend
*******************************************************************************/

'use strict';

var _ = require('underscore'),
    Base = require('./base');

var BUFFER = {
  hash: {},
  array: [],
  max_size: 10,
};

module.exports = function(options, storage) {
  _.extend(this, new Base(options, storage));
  if (options.memory_cache) {
    BUFFER.max_size = options.memory_cache.size || BUFFER.max_size;
  }
  // store a value in cache
  this.put = function(key, value) {
    // check for existing entry
    var entry = BUFFER.hash[key];
    if (entry) {
      entry.value = value;
      return;
    }
    // check for reaching cache limits
    while (BUFFER.array.length >= BUFFER.max_size) {
      entry = BUFFER.array.shift();
      delete BUFFER.hash[entry.key];
    }
    // add new entry
    entry = {
      key: key,
      value: value,
    };
    BUFFER.hash[key] = entry;
    BUFFER.array.push(entry);
  };
  // get a value from cache
  this.get = function(key, callback) {
    var entry = BUFFER.hash[key],
        value;

    if (entry) value = entry.value;
    callback(value);
  };
  // delete a value from cache
  this.del = function(key) {
    var entry = BUFFER.hash[key];
    if (entry) {
      delete BUFFER.hash[key];
      var index = BUFFER.array.indexOf(entry);
      BUFFER.array.splice(index, 1);
    }
  };
};
