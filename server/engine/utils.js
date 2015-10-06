/******************************************************************************
 Utilities
*******************************************************************************/

'use strict';

var _ = require('underscore'),
    logger = require('../logger');

function _gen_cache_key(app_id, admin, doc_id) {
  return app_id + ':' + (admin|0) + ':' + doc_id;
}

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

  // ------------------------------ CACHE UTILS --------------------------------

  //high level function add document to cache
  self.cacheResponse = function(app_id, user, doc_id, response) {
    if (!user) return;
    self.cache.put('views', _gen_cache_key(app_id, user.get('admin'), doc_id), response);
  }
  self.invalidateCache = function(app_id, doc_id) {
    self.cache.del('views', _gen_cache_key(app_id, true, doc_id));
    self.cache.del('views', _gen_cache_key(app_id, false, doc_id));
  }
  self.invalidateDocument = function(app_id, document) {
    self.invalidateCache(app_id, document.get('id'));
    self.invalidateCache(app_id, document.get('parent'));
  }
  self.getCachedResponse = function(app_id, user, doc_id, hit, miss) {
    if (!user) return;
    var key = _gen_cache_key(app_id, user.get('admin'), doc_id);
    var data = self.cache.get('views', key);
    if (data) {
      hit && hit(data);
    }
    else {
      miss && miss();
    }
  }

  // ---------------------------------- EMAIL UTILS ----------------------------

  //exlude users with no email address
  self.filterUsersWithEmail = function(users) {
    var recipients = [];
    _.each(users, function(user) {
      if (user.get('email')) {
        recipients.push(user);
      }
    });
    return recipients;
  }

  //get a list of administrators or admins defaults as defined on config.json
  self.administratorsOrDefaults = function(administrators) {
    administrators = self.filterUsersWithEmail(administrators);
    if (!administrators.length) {
      //add failsafe admins
      _.each(options.notifications.defaults.administrators, function(email) {
        administrators.push(new Models.User({
          username: 'admin',
          displayname: 'Administrator',
          email: email
        }));
      });
    }
    return administrators;
  }
}
