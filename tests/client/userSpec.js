var Utils = require('./utils'),
    user_connect = Utils.user_connect,
    load_fixture = Utils.load_fixture,
    set_field = Utils.set_field;

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
      socket.on('fruum:add', function(response) {
        socket.removeListener('fruum:add', this);
        expect(response).toBeUndefined();
        socket.disconnect();
        done();
      });
    });
  });

  it("cannot get all categories", function(done) {
    user_connect(function(socket) {
      socket.emit('fruum:categories', {});
      socket.on('fruum:categories', function(response) {
        socket.removeListener('fruum:categories', this);
        expect(response).toBeUndefined();
        socket.disconnect();
        done();
      });
    });
  });

  it("cannot create article", function(done) {
    set_field('home', {usage: 1}, function() {
      user_connect(function(socket) {
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
  });

  it("cannot create blog", function(done) {
    set_field('home', {usage: 2}, function() {
      user_connect(function(socket) {
        var payload = {
          parent: 'home',
          type: 'blog',
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
  });

  it("cannot create bookmark", function(done) {
    user_connect(function(socket) {
      var payload = {
        parent: 'home',
        type: 'bookmark',
        header: 'bookmark',
        body: '#foo'
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

  it("can create thread", function(done) {
    set_field('home', {usage: 0}, function() {
      user_connect(function(socket) {
        var payload = {
          parent: 'home',
          type: 'thread',
          header: 'foo',
          body: 'bar'
        }
        socket.emit('fruum:add', payload);
        socket.on('fruum:add', function(response) {
          socket.removeListener('fruum:add', this);
          expect(response).toEqual(jasmine.objectContaining(payload));
          socket.disconnect();
          done();
        });
      });
    });
  });

  it("can create channel", function(done) {
    set_field('home', {usage: 3}, function() {
      user_connect(function(socket) {
        var payload = {
          parent: 'home',
          type: 'channel',
          header: 'foo',
          body: 'bar'
        }
        socket.emit('fruum:add', payload);
        socket.on('fruum:add', function(response) {
          socket.removeListener('fruum:add', this);
          expect(response).toEqual(jasmine.objectContaining(payload));
          socket.disconnect();
          done();
        });
      });
    });
  });

  it("creates thread on user category", function(done) {
    user_connect(function(socket) {
      var payload = {
        parent: 'user_category',
        type: 'thread',
        header: 'foo',
        body: 'bar'
      }
      socket.emit('fruum:add', payload);
      socket.on('fruum:add', function(response) {
        socket.removeListener('fruum:add', this);
        expect(response).toEqual(jasmine.objectContaining(payload));
        socket.disconnect();
        done();
      });
    });
  });

  it("cannot create thread on admin category", function(done) {
    user_connect(function(socket) {
      var payload = {
        parent: 'admin_category',
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

  it("can reply to thread", function(done) {
    user_connect(function(socket) {
      load_fixture(function() {
        var payload = {
          parent: 'thread',
          type: 'post',
          body: 'post body'
        }
        socket.emit('fruum:add', payload);
        socket.on('fruum:add', function(response) {
          socket.removeListener('fruum:add', this);
          expect(response).toEqual(jasmine.objectContaining(payload));
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
        socket.on('fruum:add', function(response) {
          socket.removeListener('fruum:add', this);
          expect(response).toBeUndefined();
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
        socket.on('fruum:add', function(response) {
          socket.removeListener('fruum:add', this);
          expect(response).toBeUndefined();
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
        socket.on('fruum:add', function(response) {
          socket.removeListener('fruum:add', this);
          expect(response).toBeUndefined();
          socket.disconnect();
          done();
        });
      });
    });
  });

  it("can create thread to subcategory", function(done) {
    set_field('category', {usage: 0}, function() {
      user_connect(function(socket) {
        load_fixture(function() {
          var payload = {
            parent: 'category',
            type: 'thread',
            header: 'foo',
            body: 'bar'
          }
          socket.emit('fruum:add', payload);
          socket.on('fruum:add', function(response) {
            socket.removeListener('fruum:add', this);
            expect(response).toEqual(jasmine.objectContaining(payload));
            socket.disconnect();
            done();
          });
        });
      });
    });
  });

  it("cannot create thread to subcategory with disabled threads", function(done) {
    set_field('category', {usage: 4}, function() {
      user_connect(function(socket) {
        load_fixture(function() {
          var payload = {
            parent: 'category',
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
    });
  });

  it("can create channel to subcategory", function(done) {
    set_field('category', {usage: 3}, function() {
      user_connect(function(socket) {
        load_fixture(function() {
          var payload = {
            parent: 'category',
            type: 'channel',
            header: 'foo',
            body: 'bar'
          }
          socket.emit('fruum:add', payload);
          socket.on('fruum:add', function(response) {
            socket.removeListener('fruum:add', this);
            expect(response).toEqual(jasmine.objectContaining(payload));
            socket.disconnect();
            done();
          });
        });
      });
    });
  });

  it("cannot create channel to subcategory with disabled channels", function(done) {
    set_field('category', {usage: 4}, function() {
      user_connect(function(socket) {
        load_fixture(function() {
          var payload = {
            parent: 'category',
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
    });
  });

  it("cannot archive thread", function(done) {
    user_connect(function(socket) {
      load_fixture(function() {
        socket.emit('fruum:archive', { id: 'thread' });
        socket.on('fruum:archive', function(response) {
          socket.removeListener('fruum:archive', this);
          expect(response).toBeUndefined();
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
        socket.on('fruum:field', function(response) {
          socket.removeListener('fruum:field', this);
          expect(response).toBeUndefined();
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

  it("can set onboarding", function(done) {
    user_connect(function(socket) {
      socket.emit('fruum:onboard', { onboard: 1234 });
      socket.on('fruum:onboard', function(response) {
        socket.removeListener('fruum:onboard', this);
        expect(response.onboard).toBe(1234);
        socket.disconnect();
        done();
      });
    });
  });

});
