/******************************************************************************
 Utilities
*******************************************************************************/

'use strict';

var _ = require('underscore'),
    logger = require('../logger');

module.exports = function(options, instance, self) {
  var app_users = self.app_users,
      app_applications = self.app_applications;

  self._validate_payload_id = function(socket, payload, command) {
    if (payload && !self._isID(payload.id)) {
      logger.system(command + ': id is not a string or number');
      socket.disconnect();
      return false;
    }
    if (socket && !socket.fruum_user) {
      logger.system(command + ': No user found');
      socket.disconnect();
      return false;
    }
    return true;
  }
  //helper function to check if a document id is valid
  self._isID = function(obj) {
    return (typeof obj === 'string') || (typeof obj === 'number');
  };
  //emits notification signals to all users watching this document
  self._broadcastNotifications = function(by_user, document) {
    var app = app_users[by_user.get('app_id')];
    if (!app || document.get('type') != 'post' || document.get('parent_type') == 'channel') return;
    var doc_id = document.get('parent');
    _.each(app, function(user) {
      var viewing = user.get('viewing'),
          watch = user.get('watch') || [],
          socket = user.get('socket');
      if (user != by_user && socket && viewing != doc_id && watch.indexOf(doc_id) != -1) {
        if (user.get('admin') || document.get('visible'))
          socket.emit('fruum:notify', { id: doc_id });
      }
    });
  };
  //emits a signal to all users viewing the same parent, in order to request
  //a refresh
  self._broadcast = function(by_user, document, action) {
    var app = app_users[by_user.get('app_id')];
    if (!app) return;
    var parent = document.get('parent'),
        id = document.get('id'),
        json = document.toJSON();
    _.each(app, function(user) {
      var viewing = user.get('viewing'),
          socket = user.get('socket');
      if ((viewing == parent || viewing == id) && user != by_user && socket) {
        if (user.get('admin') || document.get('visible'))
          socket.emit(action || 'fruum:dirty', json);
      }
    });
  };
  //count normal users viewing a document
  self._countNormalUsers = function(app_id, doc_id) {
    var app = app_users[app_id];
    if (!app) return 0;
    var counter = 0;
    _.each(app, function(user) {
      if (!user.get('anonymous') && user.get('viewing') == doc_id) counter++;
    });
    return counter;
  };
  //broadbast to all users viewing a document
  self._broadcastRaw = function(app_id, doc_id, action, json) {
    var app = app_users[app_id];
    if (!app) return;
    _.each(app, function(user) {
      if (user.get('viewing') == doc_id && user.get('socket'))
        user.get('socket').emit(action, json)
    });
  }

}
