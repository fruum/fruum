var anonymous_connect = require('./utils').anonymous_connect,
    load_fixture = require('./utils').load_fixture;

describe("Anonymous client", function() {
  it("can view category", function(done) {
    anonymous_connect(function(socket) {
      load_fixture(function() {
        socket.emit('fruum:view', { id: 'category' });
        socket.on('fruum:view', function(payload) {
          socket.removeListener('fruum:view', this);
          expect(payload.id).toEqual('category');
          socket.disconnect();
          done();
        });
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
        socket.on('fruum:add', function(payload) {
          socket.removeListener('fruum:add', this);
          expect(payload).toBeUndefined();
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
        socket.on('fruum:react', function(payload) {
          socket.removeListener('fruum:react', this);
          expect(payload).toBeUndefined();
          socket.disconnect();
          done();
        });
      });
    });
  });
});
