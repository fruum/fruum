var anonymous_connect = require('./utils').anonymous_connect,
    load_fixture = require('./utils').load_fixture;

describe("Anonymous client", function() {
  it("can view category", function(done) {
    anonymous_connect(function(socket) {
      load_fixture(function() {
        socket.emit('fruum:view', { id: 'category' });
        socket.on('fruum:view', function(response) {
          socket.removeListener('fruum:view', this);
          expect(response.id).toEqual('category');
          socket.disconnect();
          done();
        });
      });
    });
  });

  it("cannot get all categories", function(done) {
    anonymous_connect(function(socket) {
      socket.emit('fruum:categories', {});
      socket.on('fruum:categories', function(response) {
        socket.removeListener('fruum:categories', this);
        expect(response).toBeUndefined();
        socket.disconnect();
        done();
      });
    });
  });

  it("cannot create thread", function(done) {
    anonymous_connect(function(socket) {
      var payload = {
        parent: 'home',
        type: 'thread',
        header: 'foo',
        body: 'bar'
      }
      socket.emit('fruum:add', payload);
      socket.on('fruum:add', function(response) {
        socket.removeListener('fruum:add', this);
        expect(response).toBeUndefined();
        socket.disconnect();
        done();
      });
    });
  });

  it("cannot create article", function(done) {
    anonymous_connect(function(socket) {
      var payload = {
        parent: 'home',
        type: 'article',
        header: 'foo',
        body: 'bar'
      }
      socket.emit('fruum:add', payload);
      socket.on('fruum:add', function(response) {
        socket.removeListener('fruum:add', this);
        expect(response).toBeUndefined();
        socket.disconnect();
        done();
      });
    });
  });

  it("cannot create channel", function(done) {
    anonymous_connect(function(socket) {
      var payload = {
        parent: 'home',
        type: 'channel',
        header: 'foo',
        body: 'bar'
      }
      socket.emit('fruum:add', payload);
      socket.on('fruum:add', function(response) {
        socket.removeListener('fruum:add', this);
        expect(response).toBeUndefined();
        socket.disconnect();
        done();
      });
    });
  });

  it("cannot reply to thread", function(done) {
    anonymous_connect(function(socket) {
      load_fixture(function() {
        var payload = {
          parent: 'thread',
          type: 'post',
          header: 'post header',
          body: 'post body'
        }
        socket.emit('fruum:add', payload);
        socket.on('fruum:add', function(response) {
          socket.removeListener('fruum:add', this);
          expect(response).toBeUndefined();
          socket.disconnect();
          done();
        });
      });
    });
  });

  it("cannot add reactions", function(done) {
    anonymous_connect(function(socket) {
      load_fixture(function() {
        var payload = {
          id: 'thread',
          reaction: 'up'
        }
        socket.emit('fruum:react', payload);
        socket.on('fruum:react', function(response) {
          socket.removeListener('fruum:react', this);
          expect(response).toBeUndefined();
          socket.disconnect();
          done();
        });
      });
    });
  });

  it("cannot move thread", function(done) {
    anonymous_connect(function(socket) {
      load_fixture(function() {
        socket.emit('fruum:move', { id: 'move_thread', category: 'home' });
        socket.on('fruum:move', function(response) {
          socket.removeListener('fruum:move', this);
          expect(response).toBeUndefined();
          socket.disconnect();
          done();
        });
      });
    });
  });
});
