/******************************************************************************
Garbage collect archived documents
*******************************************************************************/
'use strict';

var _ = require('underscore'),
    moment = require('moment'),
    logger = require('../../server/logger');

function GarbageCollect(options, instance) {
  var keep_archived_for = moment.duration(options.garbage_collect.keep_archived_for).asMilliseconds(),
      keep_chat_for = moment.duration(options.garbage_collect.keep_chat_for).asMilliseconds();

  function process_app(application) {
    logger.system("Garbage collecting [" + application.get('id') + "] for archived older than " + moment(Date.now() - keep_archived_for).fromNow());
    instance.storage.gc_archived(application.get('id'), Date.now() - keep_archived_for, function() {});

    logger.system("Garbage collecting [" + application.get('id') + "] for chat older than " + moment(Date.now() - keep_chat_for).fromNow());
    instance.storage.gc_chat(application.get('id'), Date.now() - keep_chat_for, function() {});
  }

  this.cron = function() {
    //get all applications
    instance.storage.list_apps(function(apps) {
      _.each(apps, process_app);
    });
  }
}

module.exports = GarbageCollect;
