/******************************************************************************
 Utilities
*******************************************************************************/

'use strict';

var _ = require('underscore'),
    logger = require('../logger');

function _gen_cache_key(app_id, admin, doc_id) {
  return app_id + ':' + (admin|0) + ':' + doc_id;
}

var re_mention = new RegExp(['(^|\\s)@[.+-_0-9A-Za-z\xaa\xb5\xba\xc0-\xd6\xd8-\xf6',
  '\xf8-\u02c1\u02c6-\u02d1\u02e0-\u02e4\u02ec\u02ee\u0370-\u0374\u0376',
  '-\u0377\u037a-\u037d\u0386\u0388-\u038a\u038c\u038e-\u03a1\u03a3-',
  '\u03f5\u03f7-\u0481\u048a-\u0527\u0531-\u0556\u0559\u0561-\u0587\u05d0',
  '-\u05ea\u05f0-\u05f2\u0620-\u064a\u066e-\u066f\u0671-\u06d3\u06d5',
  '\u06e5-\u06e6\u06ee-\u06ef\u06fa-\u06fc\u06ff\u0710\u0712-\u072f\u074d',
  '-\u07a5\u07b1\u07ca-\u07ea\u07f4-\u07f5\u07fa\u0800-\u0815\u081a\u0824',
  '\u0828\u0840-\u0858\u08a0\u08a2-\u08ac\u0904-\u0939\u093d\u0950\u0958-',
  '\u0961\u0971-\u0977\u0979-\u097f\u0985-\u098c\u098f-\u0990\u0993-',
  '\u09a8\u09aa-\u09b0\u09b2\u09b6-\u09b9\u09bd\u09ce\u09dc-\u09dd\u09df-',
  '\u09e1\u09f0-\u09f1\u0a05-\u0a0a\u0a0f-\u0a10\u0a13-\u0a28\u0a2a-',
  '\u0a30\u0a32-\u0a33\u0a35-\u0a36\u0a38-\u0a39\u0a59-\u0a5c\u0a5e\u0a72',
  '-\u0a74\u0a85-\u0a8d\u0a8f-\u0a91\u0a93-\u0aa8\u0aaa-\u0ab0\u0ab2',
  '-\u0ab3\u0ab5-\u0ab9\u0abd\u0ad0\u0ae0-\u0ae1\u0b05-\u0b0c\u0b0f-',
  '\u0b10\u0b13-\u0b28\u0b2a-\u0b30\u0b32-\u0b33\u0b35-\u0b39\u0b3d\u0b5c',
  '-\u0b5d\u0b5f-\u0b61\u0b71\u0b83\u0b85-\u0b8a\u0b8e-\u0b90\u0b92-',
  '\u0b95\u0b99-\u0b9a\u0b9c\u0b9e-\u0b9f\u0ba3-\u0ba4\u0ba8-\u0baa\u0bae',
  '-\u0bb9\u0bd0\u0c05-\u0c0c\u0c0e-\u0c10\u0c12-\u0c28\u0c2a-\u0c33',
  '\u0c35-\u0c39\u0c3d\u0c58-\u0c59\u0c60-\u0c61\u0c85-\u0c8c\u0c8e-',
  '\u0c90\u0c92-\u0ca8\u0caa-\u0cb3\u0cb5-\u0cb9\u0cbd\u0cde\u0ce0-\u0ce1',
  '\u0cf1-\u0cf2\u0d05-\u0d0c\u0d0e-\u0d10\u0d12-\u0d3a\u0d3d\u0d4e\u0d60',
  '-\u0d61\u0d7a-\u0d7f\u0d85-\u0d96\u0d9a-\u0db1\u0db3-\u0dbb\u0dbd',
  '\u0dc0-\u0dc6\u0e01-\u0e30\u0e32-\u0e33\u0e40-\u0e46\u0e81-\u0e82',
  '\u0e84\u0e87-\u0e88\u0e8a\u0e8d\u0e94-\u0e97\u0e99-\u0e9f\u0ea1-\u0ea3',
  '\u0ea5\u0ea7\u0eaa-\u0eab\u0ead-\u0eb0\u0eb2-\u0eb3\u0ebd\u0ec0-\u0ec4',
  '\u0ec6\u0edc-\u0edf\u0f00\u0f40-\u0f47\u0f49-\u0f6c\u0f88-\u0f8c\u1000',
  '-\u102a\u103f\u1050-\u1055\u105a-\u105d\u1061\u1065-\u1066\u106e-',
  '\u1070\u1075-\u1081\u108e\u10a0-\u10c5\u10c7\u10cd\u10d0-\u10fa\u10fc-',
  '\u1248\u124a-\u124d\u1250-\u1256\u1258\u125a-\u125d\u1260-\u1288\u128a',
  '-\u128d\u1290-\u12b0\u12b2-\u12b5\u12b8-\u12be\u12c0\u12c2-\u12c5',
  '\u12c8-\u12d6\u12d8-\u1310\u1312-\u1315\u1318-\u135a\u1380-\u138f',
  '\u13a0-\u13f4\u1401-\u166c\u166f-\u167f\u1681-\u169a\u16a0-\u16ea',
  '\u1700-\u170c\u170e-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176c',
  '\u176e-\u1770\u1780-\u17b3\u17d7\u17dc\u1820-\u1877\u1880-\u18a8\u18aa',
  '\u18b0-\u18f5\u1900-\u191c\u1950-\u196d\u1970-\u1974\u1980-\u19ab',
  '\u19c1-\u19c7\u1a00-\u1a16\u1a20-\u1a54\u1aa7\u1b05-\u1b33\u1b45-',
  '\u1b4b\u1b83-\u1ba0\u1bae-\u1baf\u1bba-\u1be5\u1c00-\u1c23\u1c4d-',
  '\u1c4f\u1c5a-\u1c7d\u1ce9-\u1cec\u1cee-\u1cf1\u1cf5-\u1cf6\u1d00-',
  '\u1dbf\u1e00-\u1f15\u1f18-\u1f1d\u1f20-\u1f45\u1f48-\u1f4d\u1f50-',
  '\u1f57\u1f59\u1f5b\u1f5d\u1f5f-\u1f7d\u1f80-\u1fb4\u1fb6-\u1fbc\u1fbe\u1fc2',
  '-\u1fc4\u1fc6-\u1fcc\u1fd0-\u1fd3\u1fd6-\u1fdb\u1fe0-\u1fec\u1ff2',
  '-\u1ff4\u1ff6-\u1ffc\u2071\u207f\u2090-\u209c\u2102\u2107\u210a-\u2113',
  '\u2115\u2119-\u211d\u2124\u2126\u2128\u212a-\u212d\u212f-\u2139\u213c-',
  '\u213f\u2145-\u2149\u214e\u2183-\u2184\u2c00-\u2c2e\u2c30-\u2c5e\u2c60',
  '-\u2ce4\u2ceb-\u2cee\u2cf2-\u2cf3\u2d00-\u2d25\u2d27\u2d2d\u2d30-',
  '\u2d67\u2d6f\u2d80-\u2d96\u2da0-\u2da6\u2da8-\u2dae\u2db0-\u2db6\u2db8',
  '-\u2dbe\u2dc0-\u2dc6\u2dc8-\u2dce\u2dd0-\u2dd6\u2dd8-\u2dde\u2e2f',
  '\u3005-\u3006\u3031-\u3035\u303b-\u303c\u3041-\u3096\u309d-\u309f',
  '\u30a1-\u30fa\u30fc-\u30ff\u3105-\u312d\u3131-\u318e\u31a0-\u31ba',
  '\u31f0-\u31ff\u3400-\u4db5\u4e00-\u9fcc\ua000-\ua48c\ua4d0-\ua4fd',
  '\ua500-\ua60c\ua610-\ua61f\ua62a-\ua62b\ua640-\ua66e\ua67f-\ua697',
  '\ua6a0-\ua6e5\ua717-\ua71f\ua722-\ua788\ua78b-\ua78e\ua790-\ua793',
  '\ua7a0-\ua7aa\ua7f8-\ua801\ua803-\ua805\ua807-\ua80a\ua80c-\ua822',
  '\ua840-\ua873\ua882-\ua8b3\ua8f2-\ua8f7\ua8fb\ua90a-\ua925\ua930-',
  '\ua946\ua960-\ua97c\ua984-\ua9b2\ua9cf\uaa00-\uaa28\uaa40-\uaa42\uaa44',
  '-\uaa4b\uaa60-\uaa76\uaa7a\uaa80-\uaaaf\uaab1\uaab5-\uaab6\uaab9-',
  '\uaabd\uaac0\uaac2\uaadb-\uaadd\uaae0-\uaaea\uaaf2-\uaaf4\uab01-\uab06',
  '\uab09-\uab0e\uab11-\uab16\uab20-\uab26\uab28-\uab2e\uabc0-\uabe2',
  '\uac00-\ud7a3\ud7b0-\ud7c6\ud7cb-\ud7fb\uf900-\ufa6d\ufa70-\ufad9',
  '\ufb00-\ufb06\ufb13-\ufb17\ufb1d\ufb1f-\ufb28\ufb2a-\ufb36\ufb38-',
  '\ufb3c\ufb3e\ufb40-\ufb41\ufb43-\ufb44\ufb46-\ufbb1\ufbd3-\ufd3d\ufd50',
  '-\ufd8f\ufd92-\ufdc7\ufdf0-\ufdfb\ufe70-\ufe74\ufe76-\ufefc\uff21',
  '-\uff3a\uff41-\uff5a\uff66-\uffbe\uffc2-\uffc7\uffca-\uffcf\uffd2',
  '-\uffd7\uffda-\uffdc]+'].join(''), 'g');

module.exports = function(options, instance, self) {
  var app_users = self.app_users,
      app_applications = self.app_applications;

  self.validatePayloadID = function(socket, payload, command) {
    if (payload && !self.isID(payload.id)) {
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
  self.isID = function(obj) {
    return (typeof obj === 'string') || (typeof obj === 'number');
  };
  //emits notification signals to all users watching this document
  self.broadcastNotifications = function(by_user, document) {
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
  self.broadcast = function(by_user, document, action) {
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
  self.countNormalUsers = function(app_id, doc_id) {
    var app = app_users[app_id];
    if (!app) return 0;
    var counter = 0;
    _.each(app, function(user) {
      if (!user.get('anonymous') && user.get('viewing') == doc_id) counter++;
    });
    return counter;
  };
  //broadbast to all users viewing a document
  self.broadcastRaw = function(app_id, doc_id, action, json) {
    var app = app_users[app_id];
    if (!app) return;
    _.each(app, function(user) {
      if (user.get('viewing') == doc_id && user.get('socket'))
        user.get('socket').emit(action, json)
    });
  }
  //find user mentions, returns a list of usernames
  self.findMentions = function(text) {
    var users = [];
    _.each(re_mention.match(text), function(user) {
      user = user.trim();
      if (user.length > 1 && user[0] === '@') {
        users.push(user.substr(1));
      }
    });
    return _.unique(users);
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
  self.invalidateApplication = function(app_id) {
    _.each(self.CACHE_DEFS, function(value, key) {
      self.cache.del(value.queue, value.key.replace('{app_id}', app_id));
    });
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
