/******************************************************************************
  High level logger
*******************************************************************************/

'use strict';

var logger = require('winston');

function build_log(app_id, reason, object) {
  var msg = '[' + app_id + '] [' + reason + '] ';
  if (object) {
    //string type
    if (typeof object === 'string') msg += object;
    //backbone model
    else if (object.toLog) {
      msg += object.toLog();
    }
    else {
      msg += JSON.stringify(object);
    }
  }
  return msg;
}

module.exports = {
  system: function(message) {
    logger.info(message);
  },
  info: function(app_id, reason, object) {
    logger.info(build_log(app_id, reason, object));
  },
  error: function(app_id, reason, object) {
    logger.error(build_log(app_id, reason, object));
  },
  level: function(level) {
    logger.level = level;
  }
};
