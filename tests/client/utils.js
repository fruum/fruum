var io = require('socket.io-client'),
    request = require('request'),
    url = 'http://localhost:3000';

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

function _delete(done) {
  //reset category
  request({
    method: 'DELETE',
    url: url + '/api/v1/testkey/docs/category',
    json: true
  }, done);
}

function _category(done) {
  //create category
  request({
    method: 'POST',
    url: url + '/api/v1/testkey/docs',
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
    url: url + '/api/v1/testkey/docs',
    json: true,
    body: {
      id: 'locked_category',
      type: 'category',
      parent: 'home',
      parent_type: 'category',
      header: 'locked category header',
      body: 'locked category body',
      allow_threads: false,
      allow_channels: false
    }
  }, done);
}

function _article(done) {
  request({
    method: 'POST',
    url: url + '/api/v1/testkey/docs',
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
    url: url + '/api/v1/testkey/docs',
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
    url: url + '/api/v1/testkey/docs',
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
    url: url + '/api/v1/testkey/docs',
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
    url: url + '/api/v1/testkey/docs',
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

function load_fixture(done) {
  _category(function() {
    _locked_category(function() {
      _article(function() {
        _channel(function() {
          _thread(function() {
            _move_thread(function() {
              _locked_thread(function() {
                done && done();
              });
            });
          });
        });
      });
    });
  });
}

function set_field(id, field, value, done) {
  var body = { id: id };
  body[field] = value;
  request({
    method: 'PUT',
    url: url + '/api/v1/testkey/docs/' + id,
    json: true,
    body: body
  }, done);
}

module.exports = {
  admin_connect: admin_connect,
  user_connect: user_connect,
  anonymous_connect: anonymous_connect,
  load_fixture: load_fixture,
  set_field: set_field
}
