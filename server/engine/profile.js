/******************************************************************************
 User profile
*******************************************************************************/

'use strict';

var _ = require('underscore');

module.exports = function(options, instance, self) {
  var storage = self.storage;

  self.profile = function(socket, payload) {
    if (!self.validatePayloadID(socket, null, 'profile')) {
      self.fail(payload);
      return;
    }
    var app_id = socket.app_id,
        userid = payload.id,
        username = payload.username,
        permission = socket.fruum_user.get('permission');

    function finalize(user) {
      if (user) {
        var data = {
          id: user.get('id'),
          username: user.get('username'),
          displayname: user.get('displayname'),
          avatar: user.get('avatar'),
          karma: user.get('karma'),
          admin: user.get('admin'),
          blocked: user.get('blocked'),
          joined: user.get('created'),
          last_login: self.findOnlineUser(app_id, user.get('id'))
            ? 'online'
            : user.get('last_login'),
          topics: 0,
          replies: 0,
        };
        // count threads
        storage.count_attributes(app_id, {
          user_id: user.get('id'),
          type: ['thread', 'blog'],
          permission__lte: permission,
        }, function(topics) {
          data.topics = topics;
          // count replies
          storage.count_attributes(app_id, {
            user_id: user.get('id'),
            type: 'post',
            parent_type__not: 'channel',
            permission__lte: permission,
          }, function(replies) {
            data.replies = replies;
            if (payload.count_users) {
              storage.count_users(app_id, {}, function(total) {
                data.users = total;
                socket.emit('fruum:profile', data);
                self.success(payload);
              });
            } else {
              socket.emit('fruum:profile', data);
              self.success(payload);
            }
          });
        });
      } else {
        socket.emit('fruum:profile');
        self.fail(payload);
      }
    }

    // get user by id
    if (userid) {
      storage.get_user(app_id, userid, finalize);
    } else {
      // or by username
      storage.match_users(app_id, { username: username }, function(user) {
        finalize(user[0]);
      });
    }
  };

  // -------------------------- USER PROFILE HISTORY ---------------------------

  self.user_feed = function(socket, payload) {
    if (!self.validatePayloadID(socket, null, 'user_feed')) {
      self.fail(payload);
      return;
    }
    var app_id = socket.app_id,
        userid = payload.id,
        permission = socket.fruum_user.get('permission');

    // default pagination
    payload.from = payload.from || 0;
    payload.size = payload.size || 50;

    storage.get_user(app_id, userid, function(user) {
      if (user && ['topics', 'replies'].indexOf(payload.feed) != -1) {
        var data = {};
        if (payload.feed == 'topics') {
          data = {
            user_id: user.get('id'),
            type: ['thread', 'blog'],
            permission__lte: permission,
          };
        } else {
          data = {
            user_id: user.get('id'),
            type: 'post',
            parent_type__not: 'channel',
            permission__lte: permission,
          };
        }
        storage.search_attributes(app_id, data, function(docs) {
          var response = {
            id: payload.id,
            feed: payload.feed,
            docs: _.map(docs, function(document) {
              if (document.get('inappropriate')) document.set('body', '');
              return document.toJSON();
            }),
            from: payload.from,
            size: payload.size,
          };
          socket.emit('fruum:user:feed', response);
          self.success(payload);
        }, {
          skipfields: ['attachments'],
          from: payload.from,
          size: payload.size,
          sort: [{ updated: { order: 'desc' } }],
        });
      } else {
        socket.emit('fruum:user:feed');
        self.fail(payload);
      }
    });
  };

  // ------------------------------ USER LIST ----------------------------------

  self.user_list = function(socket, payload) {
    if (!self.validatePayloadID(socket, null, 'user_list')) {
      self.fail(payload);
      return;
    }

    var app_id = socket.app_id;

    // default pagination
    payload.from = payload.from || 0;
    payload.size = payload.size || 50;

    storage.match_users(app_id, {}, function(users) {
      var response = {
        users: _.map(users, function(user) {
          return {
            id: user.get('id'),
            admin: user.get('admin'),
            blocked: user.get('blocked'),
            username: user.get('username'),
            displayname: user.get('displayname'),
            avatar: user.get('avatar'),
            created: user.get('created'),
            last_login: user.get('last_login'),
            karma: user.get('karma'),
          };
        }),
        from: payload.from,
        size: payload.size,
      };
      socket.emit('fruum:user:list', response);
      self.success(payload);
    }, {
      from: payload.from,
      size: payload.size,
      sort: [{ last_login: { order: 'desc' } }],
    });
  };
};
