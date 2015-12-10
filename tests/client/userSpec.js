var user_connect = require('./utils').user_connect,
    load_fixture = require('./utils').load_fixture;

describe("User client", function() {
  it("cannot create category", function(done) {
    user_connect(function(socket) {
      var payload = {
        parent: 'home',
        type: 'category',
        header: 'foo',
        body: 'bar'
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

  it("cannot get all categories", function(done) {
    user_connect(function(socket) {
      socket.emit('fruum:categories', {});
      socket.on('fruum:categories', function(payload) {
        socket.removeListener('fruum:categories', this);
        expect(payload).toBeUndefined();
        socket.disconnect();
        done();
      });
    });
  });

  it("cannot create article", function(done) {
    user_connect(function(socket) {
      var payload = {
        parent: 'home',
        type: 'article',
        header: 'foo',
        body: 'bar'
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

  it("can create thread", function(done) {
    user_connect(function(socket) {
      var payload = {
        parent: 'home',
        type: 'thread',
        header: 'foo',
        body: 'bar'
      }
      socket.emit('fruum:add', payload);
      socket.on('fruum:add', function(payload) {
        socket.removeListener('fruum:add', this);
        expect(payload).toEqual(jasmine.objectContaining(payload));
        socket.disconnect();
        done();
      });
    });
  });

  it("can create channel", function(done) {
    user_connect(function(socket) {
      var payload = {
        parent: 'home',
        type: 'channel',
        header: 'foo',
        body: 'bar'
      }
      socket.emit('fruum:add', payload);
      socket.on('fruum:add', function(payload) {
        socket.removeListener('fruum:add', this);
        expect(payload).toEqual(jasmine.objectContaining(payload));
        socket.disconnect();
        done();
      });
    });
  });

  it("can reply to thread", function(done) {
    user_connect(function(socket) {
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
          expect(payload).toEqual(jasmine.objectContaining(payload));
          socket.disconnect();
          done();
        });
      });
    });
  });

  it("cannot reply to locked thread", function(done) {
    user_connect(function(socket) {
      load_fixture(function() {
        var payload = {
          parent: 'locked_thread',
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

  it("cannot create thread to locked category", function(done) {
    user_connect(function(socket) {
      load_fixture(function() {
        var payload = {
          parent: 'locked_category',
          type: 'thread',
          header: 'foo',
          body: 'bar'
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

  it("cannot create channel to locked category", function(done) {
    user_connect(function(socket) {
      load_fixture(function() {
        var payload = {
          parent: 'locked_category',
          type: 'channel',
          header: 'foo',
          body: 'bar'
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

  it("can create thread to subcategory", function(done) {
    user_connect(function(socket) {
      load_fixture(function() {
        var payload = {
          parent: 'category',
          type: 'thread',
          header: 'foo',
          body: 'bar'
        }
        socket.emit('fruum:add', payload);
        socket.on('fruum:add', function(payload) {
          socket.removeListener('fruum:add', this);
          expect(payload).toEqual(jasmine.objectContaining(payload));
          socket.disconnect();
          done();
        });
      });
    });
  });

  it("can create channel to subcategory", function(done) {
    user_connect(function(socket) {
      load_fixture(function() {
        var payload = {
          parent: 'category',
          type: 'channel',
          header: 'foo',
          body: 'bar'
        }
        socket.emit('fruum:add', payload);
        socket.on('fruum:add', function(payload) {
          socket.removeListener('fruum:add', this);
          expect(payload).toEqual(jasmine.objectContaining(payload));
          socket.disconnect();
          done();
        });
      });
    });
  });

  it("cannot archive thread", function(done) {
    user_connect(function(socket) {
      load_fixture(function() {
        socket.emit('fruum:archive', { id: 'thread' });
        socket.on('fruum:archive', function(payload) {
          socket.removeListener('fruum:archive', this);
          expect(payload).toBeUndefined();
          socket.disconnect();
          done();
        });
      });
    });
  });

  it("cannot sticky thread", function(done) {
    user_connect(function(socket) {
      load_fixture(function() {
        socket.emit('fruum:field', { id: 'thread', field: 'sticky', value: true });
        socket.on('fruum:field', function(payload) {
          socket.removeListener('fruum:field', this);
          expect(payload).toBeUndefined();
          socket.disconnect();
          done();
        });
      });
    });
  });

  it("can add reactions", function(done) {
    user_connect(function(socket) {
      load_fixture(function() {
        socket.emit('fruum:react', {
          id: 'thread',
          reaction: 'up'
        });
        socket.on('fruum:react', function(payload) {
          socket.removeListener('fruum:react', this);
          expect(payload).toBeDefined();
          expect(payload.react_up).toContain('human');
          expect(payload.react_up.length).toBe(1);
          socket.disconnect();
          done();
        });
      });
    });
  });

  it("cannot move thread", function(done) {
    user_connect(function(socket) {
      load_fixture(function() {
        socket.emit('fruum:move', { id: 'move_thread', category: 'home' });
        socket.on('fruum:move', function(payload) {
          socket.removeListener('fruum:move', this);
          expect(payload).toBeUndefined();
          socket.disconnect();
          done();
        });
      });
    });
  });
});
