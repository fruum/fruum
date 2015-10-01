/******************************************************************************
 Database management
*******************************************************************************/

'use strict';

var _ = require('underscore'),
    logger = require('../logger');

module.exports = function(options, instance, self) {
  var storage = self.storage,
      auth = self.auth,
      email = self.email;

  // ---------------------------------- SETUP ----------------------------------

  self.setup = function() {
    logger.system('Setup database');
    auth.setup();
    storage.setup();
  }

  // --------------------------------- MIGRATE ---------------------------------

  self.migrate = function() {
    logger.system('Migrate database');
    auth.migrate();
    storage.migrate();
  }

  // ---------------------------------- TEARDOWN ----------------------------------

  self.teardown = function() {
    logger.system('Teardown database');
    auth.teardown();
    storage.teardown();
  }

  // ----------------------------- GARBAGE COLLECT -----------------------------

  self.gc = function(app_id) {
    logger.system('Delete archived documents');
    storage.gc_archived(app_id, Date.now(), function() {});
  }
}
