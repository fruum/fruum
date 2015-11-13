/******************************************************************************
  memory-cache backend
*******************************************************************************/

'use strict';

var _ = require('underscore'),
    Base = require('./base');

var queues = {
  static: {
    hash: {},
    array: [],
    max_size: 50
  },
  views: {
    hash: {},
    array: [],
    max_size: 10
  },
  default: {
    hash: {},
    array: [],
    max_size: 10
  }
}

function get_queue(queue) {
  return queues[queue] || queues.default;
}

module.exports = function(options, storage) {
  _.extend(this, new Base(options, storage));
  if (options.memory_cache) {
    queues.static.max_size = queues.static.max_size || options.memory_cache.static;
    queues.views.max_size = queues.views.max_size || options.memory_cache.views;
    queues.default.max_size = queues.default.max_size || options.memory_cache.default;
  }
  //store a value in cache
  this.put = function(queue, key, value) {
    var q = get_queue(queue);
    //check for existing entry
    var entry = q.hash[key];
    if (entry) {
      entry.value = value;
      return;
    }
    //check for reaching cache limits
    while(q.array.length >= q.max_size) {
      entry = q.array.shift();
      delete q.hash[entry.key];
    }
    //add new entry
    entry = {
      key: key,
      value: value
    }
    q.hash[key] = entry;
    q.array.push(entry);
  };
  //get a value from cache
  this.get = function(queue, key) {
    var q = get_queue(queue);
    var entry = q.hash[key];
    if (entry) return entry.value;
  };
  //delete a value from cache
  this.del = function(queue, key) {
    var q = get_queue(queue);
    var entry = q.hash[key];
    if (entry) {
      delete q.hash[key];
      var index = q.array.indexOf(entry);
      q.array.splice(index, 1);
    }
  }
}
