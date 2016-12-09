/* globals describe, it, expect, jasmine */

var Utils = require('./utils'),
    anonymous_connect = Utils.anonymous_connect,
    bob_create = Utils.bob_create,
    load_bob = Utils.load_bob,
    load_fixture = Utils.load_fixture,
    set_field = Utils.set_field;

describe('Anonymous client', function() {
  it('can view category', function(done) {
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

  it('cannot get all categories', function(done) {
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

  it('cannot create thread', function(done) {
    set_field('home', {usage: 0}, function() {
      anonymous_connect(function(socket) {
        var payload = {
          parent: 'home',
          type: 'thread',
          header: 'foo',
          body: 'bar',
        };
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

  it('cannot create thread on user category', function(done) {
    anonymous_connect(function(socket) {
      var payload = {
        parent: 'user_category',
        type: 'thread',
        header: 'foo',
        body: 'bar',
      };
      socket.emit('fruum:add', payload);
      socket.on('fruum:add', function(response) {
        socket.removeListener('fruum:add', this);
        expect(response).toBeUndefined();
        socket.disconnect();
        done();
      });
    });
  });

  it('cannot create thread on admin category', function(done) {
    anonymous_connect(function(socket) {
      var payload = {
        parent: 'admin_category',
        type: 'thread',
        header: 'foo',
        body: 'bar',
      };
      socket.emit('fruum:add', payload);
      socket.on('fruum:add', function(response) {
        socket.removeListener('fruum:add', this);
        expect(response).toBeUndefined();
        socket.disconnect();
        done();
      });
    });
  });

  it('cannot create article', function(done) {
    set_field('home', {usage: 1}, function() {
      anonymous_connect(function(socket) {
        var payload = {
          parent: 'home',
          type: 'article',
          header: 'foo',
          body: 'bar',
        };
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

  it('cannot create blog', function(done) {
    set_field('home', {usage: 2}, function() {
      anonymous_connect(function(socket) {
        var payload = {
          parent: 'home',
          type: 'blog',
          header: 'foo',
          body: 'bar',
        };
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

  it('cannot create bookmark', function(done) {
    anonymous_connect(function(socket) {
      var payload = {
        parent: 'home',
        type: 'bookmark',
        header: 'bookmark',
        body: '#foo',
      };
      socket.emit('fruum:add', payload);
      socket.on('fruum:add', function(response) {
        socket.removeListener('fruum:add', this);
        expect(response).toBeUndefined();
        socket.disconnect();
        done();
      });
    });
  });

  it('cannot create channel', function(done) {
    set_field('home', {usage: 3}, function() {
      anonymous_connect(function(socket) {
        var payload = {
          parent: 'home',
          type: 'channel',
          header: 'foo',
          body: 'bar',
        };
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

  it('cannot reply to thread', function(done) {
    anonymous_connect(function(socket) {
      load_fixture(function() {
        var payload = {
          parent: 'thread',
          type: 'post',
          header: 'post header',
          body: 'post body',
        };
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

  it('cannot add reactions', function(done) {
    anonymous_connect(function(socket) {
      load_fixture(function() {
        var payload = {
          id: 'thread',
          reaction: 'up',
        };
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

  it('cannot move thread', function(done) {
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

  it('cannot set onboarding', function(done) {
    anonymous_connect(function(socket) {
      socket.emit('fruum:onboard', { onboard: 1234 });
      socket.on('fruum:onboard', function(response) {
        socket.removeListener('fruum:onboard', this);
        expect(response).toBeUndefined();
        socket.disconnect();
        done();
      });
    });
  });

  it('cannot block user', function(done) {
    bob_create(function() {
      anonymous_connect(function(socket) {
        var payload = {
          id: 'bob',
        };
        socket.emit('fruum:user:block', payload);
        socket.on('fruum:user:block', function(response) {
          socket.removeListener('fruum:user:block', this);
          expect(response).toBeUndefined();
          socket.disconnect();
          done();
        });
      });
    });
  });

  it('cannot unblock user', function(done) {
    bob_create(function() {
      anonymous_connect(function(socket) {
        var payload = {
          id: 'bob',
        };
        socket.emit('fruum:user:unblock', payload);
        socket.on('fruum:user:unblock', function(response) {
          socket.removeListener('fruum:user:unblock', this);
          expect(response).toBeUndefined();
          socket.disconnect();
          done();
        });
      });
    });
  });

  it('cannot remove user', function(done) {
    bob_create(function() {
      anonymous_connect(function(socket) {
        var payload = {
          id: 'bob',
        };
        socket.emit('fruum:user:remove', payload);
        socket.on('fruum:user:remove', function(response) {
          socket.removeListener('fruum:user:remove', this);
          expect(response).toBeUndefined();
          socket.disconnect();
          done();
        });
      });
    });
  });

  it('can view profile', function(done) {
    load_bob(function() {
      anonymous_connect(function(socket) {
        var payload = {
          id: 'bob',
        };
        socket.emit('fruum:profile', payload);
        socket.on('fruum:profile', function(response) {
          socket.removeListener('fruum:profile', this);
          expect(response).toEqual(jasmine.objectContaining({
            id: 'bob',
            topics: 1,
            replies: 0,
          }));
          socket.disconnect();
          done();
        });
      });
    });
  });

  it('can view profile feed', function(done) {
    load_bob(function() {
      anonymous_connect(function(socket) {
        var payload = {
          id: 'bob',
          feed: 'topics',
        };
        socket.emit('fruum:user:feed', payload);
        socket.on('fruum:user:feed', function(response) {
          socket.removeListener('fruum:user:feed', this);
          expect(response).toEqual(jasmine.objectContaining({
            id: 'bob',
            feed: 'topics',
          }));
          expect(response.docs.length).toBe(1);
          socket.disconnect();
          done();
        });
      });
    });
  });
});
