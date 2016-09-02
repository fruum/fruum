var io = require('socket.io-client'),
    request = require('request'),
    url = 'http://test:testkey@localhost:3000';

function admin_connect(ready) {
  var user_payload = {
    id: '1',
    admin: true,
    anonymous: false,
    username: 'god',
    displayname: 'God'
  }
  var socket = io.connect('http://localhost:3000', {'force new connection': true});
  socket.on('connect', function() {
    socket.removeListener('connect', this);
    socket.emit('fruum:auth', {
      app_id: 'test',
      user: user_payload
    });
    socket.on('fruum:auth', function(payload) {
      expect(payload.user).toEqual(jasmine.objectContaining(user_payload));
      socket.removeListener('connect', this);
      ready(socket);
    });
  });
}

function user_connect(ready) {
  var user_payload = {
    id: '2',
    admin: false,
    anonymous: false,
    username: 'human',
    displayname: 'Human'
  }
  var socket = io.connect('http://localhost:3000', {'force new connection': true});
  socket.on('connect', function() {
    socket.removeListener('connect', this);
    socket.emit('fruum:auth', {
      app_id: 'test',
      user: user_payload
    });
    socket.on('fruum:auth', function(payload) {
      expect(payload.user).toEqual(jasmine.objectContaining(user_payload));
      socket.removeListener('connect', this);
      ready(socket);
    });
  });
}

function anonymous_connect(ready) {
  var user_payload = {
    admin: false,
    anonymous: true
  }
  var socket = io.connect('http://localhost:3000', {'force new connection': true});
  socket.on('connect', function() {
    socket.removeListener('connect', this);
    socket.emit('fruum:auth', {
      app_id: 'test',
      user: user_payload
    });
    socket.on('fruum:auth', function(payload) {
      expect(payload.user).toEqual(jasmine.objectContaining(user_payload));
      socket.removeListener('connect', this);
      ready(socket);
    });
  });
}

function bob_create(ready) {
  var user_payload = {
    id: 'bob',
    admin: false,
    anonymous: false,
    username: 'bob',
    displayname: 'bob'
  }
  var socket = io.connect('http://localhost:3000', {'force new connection': true});
  socket.on('connect', function() {
    socket.removeListener('connect', this);
    socket.emit('fruum:auth', {
      app_id: 'test',
      user: user_payload
    });
    socket.on('fruum:auth', function(payload) {
      socket.removeListener('fruum:auth', this);
      socket.removeListener('connect', this);
      socket.disconnect();
      socket = null;
      ready();
    });
  });
}

function _delete(done) {
  //reset category
  request({
    method: 'DELETE',
    url: url + '/api/v1/docs/category',
    json: true
  }, done);
}

function _category(done) {
  //create category
  request({
    method: 'POST',
    url: url + '/api/v1/docs',
    json: true,
    body: {
      id: 'category',
      type: 'category',
      parent: 'home',
      parent_type: 'category',
      header: 'category header',
      body: 'category body'
    }
  }, done);
}

function _locked_category(done) {
  //create category
  request({
    method: 'POST',
    url: url + '/api/v1/docs',
    json: true,
    body: {
      id: 'locked_category',
      type: 'category',
      parent: 'home',
      parent_type: 'category',
      header: 'locked category header',
      body: 'locked category body',
      usage: 4
    }
  }, done);
}

function _user_category(done) {
  //create category
  request({
    method: 'POST',
    url: url + '/api/v1/docs',
    json: true,
    body: {
      id: 'user_category',
      type: 'category',
      parent: 'home',
      parent_type: 'category',
      header: 'user category header',
      body: 'user category body',
      usage: 0,
      permission: 1
    }
  }, done);
}

function _user_category(done) {
  //create category
  request({
    method: 'POST',
    url: url + '/api/v1/docs',
    json: true,
    body: {
      id: 'user_category',
      type: 'category',
      parent: 'home',
      parent_type: 'category',
      header: 'user category header',
      body: 'user category body',
      usage: 0,
      permission: 1
    }
  }, done);
}

function _admin_category(done) {
  //create category
  request({
    method: 'POST',
    url: url + '/api/v1/docs',
    json: true,
    body: {
      id: 'admin_category',
      type: 'category',
      parent: 'home',
      parent_type: 'category',
      header: 'admin category header',
      body: 'admin category body',
      usage: 0,
      permission: 2
    }
  }, done);
}

function _article(done) {
  request({
    method: 'POST',
    url: url + '/api/v1/docs',
    json: true,
    body: {
      id: 'article',
      type: 'article',
      parent: 'category',
      header: 'article header',
      body: 'article body'
    }
  }, done);
}

function _thread(done) {
  request({
    method: 'POST',
    url: url + '/api/v1/docs',
    json: true,
    body: {
      id: 'thread',
      type: 'thread',
      parent: 'category',
      header: 'thread header',
      body: 'thread body'
    }
  }, done);
}

function _move_thread(done) {
  request({
    method: 'POST',
    url: url + '/api/v1/docs',
    json: true,
    body: {
      id: 'move_thread',
      type: 'thread',
      parent: 'category',
      header: 'move_thread header',
      body: 'move_thread body'
    }
  }, done);
}

function _locked_thread(done) {
  request({
    method: 'POST',
    url: url + '/api/v1/docs',
    json: true,
    body: {
      id: 'locked_thread',
      type: 'thread',
      parent: 'category',
      header: 'locked thread header',
      body: 'locked thread body',
      locked: true
    }
  }, done);
}

function _channel(done) {
  request({
    method: 'POST',
    url: url + '/api/v1/docs',
    json: true,
    body: {
      id: 'channel',
      type: 'channel',
      parent: 'category',
      header: 'channel header',
      body: 'channel body'
    }
  }, done);
}

function _bookmark(done) {
  request({
    method: 'POST',
    url: url + '/api/v1/docs',
    json: true,
    body: {
      id: 'bookmark',
      type: 'bookmark',
      parent: 'category',
      header: 'bookmark header',
      body: 'bookmark body'
    }
  }, done);
}

function load_fixture(done) {
  _category(function() {
    _locked_category(function() {
      _article(function() {
        _channel(function() {
          _thread(function() {
            _move_thread(function() {
              _locked_thread(function() {
                _bookmark(function() {
                  _user_category(function() {
                    _admin_category(function() {
                      done && done();
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });
}

function load_bob(done) {
  request({
    method: 'POST',
    url: url + '/api/v1/docs',
    json: true,
    body: {
      id: 'bob_thread',
      type: 'thread',
      parent: 'home',
      header: 'bob thread',
      body: 'bob body',
      permission: 0,
      user_id: 'bob'
    }
  }, function() {
    request({
      method: 'POST',
      url: url + '/api/v1/docs',
      json: true,
      body: {
        id: 'bob_thread_user',
        type: 'thread',
        parent: 'home',
        header: 'bob thread',
        body: 'bob body',
        permission: 1,
        user_id: 'bob'
      }
    }, function() {
      request({
        method: 'POST',
        url: url + '/api/v1/docs',
        json: true,
        body: {
          id: 'bob_thread_admin',
          type: 'thread',
          parent: 'home',
          header: 'bob thread',
          body: 'bob body',
          permission: 2,
          user_id: 'bob'
        }
      }, function() {
        bob_create(done);
      });
    });
  });
}

function set_field(id, fields, done) {
  fields.id = id;
  request({
    method: 'PUT',
    url: url + '/api/v1/docs/' + id,
    json: true,
    body: fields
  }, done);
}

module.exports = {
  admin_connect: admin_connect,
  user_connect: user_connect,
  anonymous_connect: anonymous_connect,
  bob_create: bob_create,
  load_bob: load_bob,
  load_fixture: load_fixture,
  set_field: set_field
}
