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
    password: options.memcached.password,
  });

  // reset cache on restart
  client.flush(function(err) {
    if (err) {
      logger.error('memcached', 'flush', err);
    } else {
      logger.info('memcached', 'flush', 'successful');
    }
  });

  // store a value in cache
  this.put = function(key, value) {
    client.set(key, value, function(err) {
      if (err) {
        logger.error('memcached', 'put', err);
      }
    }, options.memcached.expire || 0);
  };
  // get a value from cache
  this.get = function(key, callback) {
    client.get(key, function(err, val) {
      if (err) {
        logger.error('memcached', 'get', err);
      }
      var value;
      if (val && !err) value = val;
      callback(value);
    });
  };
  // delete a value from cache
  this.del = function(key) {
    client.delete(key, function(err) {
      if (err) {
        logger.error('memcached', 'del', err);
      }
    });
  };
};
