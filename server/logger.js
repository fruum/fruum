/******************************************************************************
  High level logger
*******************************************************************************/

'use strict';

var winston = require('winston'),
    logger = winston.createLogger({
      level: process.env.NODE_ENV == 'test' ? 'none' : 'info',
      format: winston.format.simple(),
      transports: [
        new winston.transports.Console()
      ],
    });

function build_log(app_id, reason, object) {
  var msg = '[' + app_id + '] [' + reason + '] ';
  if (object) {
    // string type
    if (typeof object === 'string') {
      msg += object;
    } else if (object.toLog) { // backbone model
      msg += object.toLog();
    } else {
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
  },
};
