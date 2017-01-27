/******************************************************************************
  Read settings from config.json
*******************************************************************************/

'use strict;';

var _ = require('underscore'),
    config = require('./config.json');

try {
  config = _.extend(config, require('./config.' + process.env.NODE_ENV + '.json'));
} catch (e) {}

try {
  config = _.extend(config, require('./config.local.json'));
} catch (e) {}

module.exports = function(options) {
  var final = config;
  if (options && options['config']) {
    final = _.extend(final, require(options['config']));
  }
  return final;
};
