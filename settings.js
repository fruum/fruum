/******************************************************************************
  Read settings from config.json
*******************************************************************************/

'use strict;'

var _ = require('underscore'),
    config = require('./config.json');
try {
  config = _.extend(config, require('./config.local.json'));
}
catch(e) {}

module.exports = config;
