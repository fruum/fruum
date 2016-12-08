/******************************************************************************
  Root class for dispatch backends
*******************************************************************************/

'use strict';

var _ = require('underscore'),
    logger = require('../../logger');

module.exports = function(options) {
  var callbacks = [];

  /*
  Summary:
  Emit an event

  Parameters:
  - payload: JSON payload
  */
  this.emit = function(payload) {
    logger.system('Dispatch emit: ' + JSON.stringify(payload));
    _.each(callbacks, function(cb) {
      cb(payload);
    });
  };

  /*
  Summary:
  Receive an event

  Parameters:
  - callback: function callback passing the payload as parameter
  */
  this.on = function(callback) {
    if (!_.contains(callbacks, callback)) {
      callbacks.push(callback);
    }
  };

  /*
  Summary:
  Stop Receiving event

  Parameters:
  - callback: function callback that was previously registered with "on"
  */
  this.off = function(callback) {
    if (_.contains(callbacks, callback)) {
      callbacks = _.without(callbacks, callback);
    }
  };

  /*
  Summary:
  Get all registered callback functions
  */
  this.getCallbacks = function() {
    return callbacks;
  };
};
