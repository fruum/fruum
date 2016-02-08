/******************************************************************************
  memcached backend
*******************************************************************************/

'use strict';

var _ = require('underscore'),
    memjs = require('memjs'),
    logger = require('../../logger'),
    Base = require('./base');

module.exports = function(options, storage) {
  _.extend(this, new Base(options, storage));

  var client = memjs.Client.create(options.memcached.host, {
    username: options.memcached.username,
    password: options.memcached.password
  });

  //reset cache on restart
  client.flush(function(err) {
    if (err) {
      logger.error('memcached', 'flush', err);
    }
    else {
      logger.info('memcached', 'flush', 'successful');
    }
  });

  var expires = {
    static: options.memcached.expire_static || 0,
    views: options.memcached.expire_views || 0,
    properties: options.memcached.expire_properties || 0
  }

  //store a value in cache
  this.put = function(queue, key, value) {
    client.set(queue + ':' + key, value , function(err) {
      if (err) {
        logger.error('memcached', 'put', err);
      }
    }, expires[queue] || 0);
  };
  //get a value from cache
  this.get = function(queue, key, callback) {
    client.get(queue + ':' + key, function(err, val) {
      if (err) {
        logger.error('memcached', 'get', err);
      }
      var value;
      if (val && !err) value = val;
      callback(value);
    });
  };
  //delete a value from cache
  this.del = function(queue, key) {
    client.delete(queue + ':' + key, function(err) {
      if (err) {
        logger.error('memcached', 'del', err);
      }
    });
  }
}
