/******************************************************************************
  Redis dispatch client
*******************************************************************************/

'use strict';

var _ = require('underscore'),
    Base = require('./base'),
    logger = require('../../logger'),
    redis = require('redis');

module.exports = function(options) {
  _.extend(this, new Base(options));

  // abort if we do not have an api key
  if (!options.redis.host) return;

  var sub = redis.createClient({
    host: options.redis.host,
    port: options.redis.port,
    password: options.redis.password,
  });
  var pub = redis.createClient({
    host: options.redis.host,
    port: options.redis.port,
    password: options.redis.password,
  });
  var ready = false, that = this;
  sub.on('subscribe', function(channel) {
    if (channel === 'fruum') {
      ready = true;
      logger.system('Redis dispatch connected');
    }
  });
  sub.on('message', function(channel, message) {
    if (channel !== 'fruum') return;
    try {
      message = JSON.parse(message);
      _.each(that.getCallbacks(), function(cb) {
        cb(message);
      });
    } catch (err) {}
  });
  sub.subscribe('fruum');

  // override emit function
  this.emit = function(payload) {
    if (!ready) return;
    pub.publish('fruum', JSON.stringify(payload));
  };
};
