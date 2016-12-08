/******************************************************************************
Garbage collect archived documents
*******************************************************************************/
'use strict';

var _ = require('underscore'),
    moment = require('moment'),
    logger = require('../../server/logger');

function GarbageCollect(options, instance) {
  var keep_archived_for = null,
      keep_chat_for = null,
      keep_inactive_users_for = null,
      reset_onboard_after = null;

  if (options.garbage_collect.keep_archived_for) {
    keep_archived_for = moment.duration(options.garbage_collect.keep_archived_for).asMilliseconds();
  }

  if (options.garbage_collect.keep_chat_for) {
    keep_chat_for = moment.duration(options.garbage_collect.keep_chat_for).asMilliseconds();
  }

  if (options.garbage_collect.keep_inactive_users_for) {
    keep_inactive_users_for = moment.duration(options.garbage_collect.keep_inactive_users_for).asMilliseconds();
  }

  if (options.garbage_collect.reset_onboard_after) {
    reset_onboard_after = moment.duration(options.garbage_collect.reset_onboard_after).asMilliseconds();
  }

  function process_app(application) {
    if (keep_archived_for) {
      logger.system('Garbage collecting [' + application.get('id') + '] for archived older than ' + moment(Date.now() - keep_archived_for).fromNow());
      instance.storage.gc_archived(application.get('id'), Date.now() - keep_archived_for, function() {});
    }

    if (keep_chat_for) {
      logger.system('Garbage collecting [' + application.get('id') + '] for chat older than ' + moment(Date.now() - keep_chat_for).fromNow());
      instance.storage.gc_chat(application.get('id'), Date.now() - keep_chat_for, function() {});
    }

    if (keep_inactive_users_for) {
      logger.system('Garbage collecting [' + application.get('id') + '] for inactive users older than ' + moment(Date.now() - keep_inactive_users_for).fromNow());
      instance.storage.gc_users(application.get('id'), Date.now() - keep_inactive_users_for, function() {});
    }

    if (reset_onboard_after) {
      logger.system('Resetting onboarding [' + application.get('id') + '] for inactive users older than ' + moment(Date.now() - reset_onboard_after).fromNow());
      instance.storage.gc_onboard(application.get('id'), Date.now() - reset_onboard_after, function() {});
    }
  }

  this.cron = function() {
    // get all applications
    instance.storage.list_apps(function(apps) {
      _.each(apps, process_app);
    });
  };
}

module.exports = GarbageCollect;
