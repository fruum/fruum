var Utils = require('./utils'),
    admin_connect = Utils.admin_connect,
    load_fixture = Utils.load_fixture,
    set_field = Utils.set_field;

describe("Admin client", function() {

  it("cannot create bookmark under thread", function(done) {
    admin_connect(function(socket) {
      load_fixture(function() {
        var payload = {
          parent: 'thread',
          type: 'bookmark',
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

  it("cannot create bookmark under bookmark", function(done) {
    admin_connect(function(socket) {
      load_fixture(function() {
        var payload = {
          parent: 'bookmark',
          type: 'bookmark',
          header: 'foo2',
          body: 'bar2'
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

  it("cannot create thread under bookmark", function(done) {
    admin_connect(function(socket) {
      load_fixture(function() {
        var payload = {
          parent: 'bookmark',
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

  it("creates category", function(done) {
    admin_connect(function(socket) {
      var payload = {
        parent: 'home',
        type: 'category',
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

  it("gets all categories", function(done) {
    admin_connect(function(socket) {
      socket.emit('fruum:categories', {});
      socket.on('fruum:categories', function(response) {
        socket.removeListener('fruum:categories', this);
        expect(response.categories).toBeDefined();
        expect(response.categories[0]).toEqual(jasmine.objectContaining({
          type: 'category'
        }));
        socket.disconnect();
        done();
      });
    });
  });

  it("creates thread on user category", function(done) {
    admin_connect(function(socket) {
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

  it("creates thread on admin category", function(done) {
    admin_connect(function(socket) {
      var payload = {
        parent: 'admin_category',
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

  it("creates article", function(done) {
    set_field('home', {usage: 1}, function() {
      admin_connect(function(socket) {
        var payload = {
          parent: 'home',
          type: 'article',
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

  it("creates blog post", function(done) {
    set_field('home', {usage: 2}, function() {
      admin_connect(function(socket) {
        var payload = {
          parent: 'home',
          type: 'blog',
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

  it("creates bookmark", function(done) {
    admin_connect(function(socket) {
      var payload = {
        parent: 'home',
        type: 'bookmark',
        header: 'bookmark',
        body: '#foo'
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

  it("respects parent", function(done) {
    admin_connect(function(socket) {
      var payload = {
        parent: 'home_invalid',
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

  it("can archive thread", function(done) {
    admin_connect(function(socket) {
      load_fixture(function() {
        socket.emit('fruum:archive', { id: 'thread' });
        socket.on('fruum:archive', function(response) {
          socket.removeListener('fruum:archive', this);
          expect(response).toEqual(jasmine.objectContaining({
            id: 'thread'
          }))
          socket.disconnect();
          done();
        });
      });
    });
  });

  it("can restore thread", function(done) {
    admin_connect(function(socket) {
      load_fixture(function() {
        socket.emit('fruum:restore', { id: 'thread' });
        socket.on('fruum:restore', function(response) {
          socket.removeListener('fruum:restore', this);
          expect(response).toEqual(jasmine.objectContaining({
            id: 'thread'
          }));
          socket.disconnect();
          done();
        });
      });
    });
  });

  it("can sticky thread", function(done) {
    admin_connect(function(socket) {
      load_fixture(function() {
        socket.emit('fruum:field', { id: 'thread', field: 'sticky', value: true });
        socket.on('fruum:field', function(response) {
          socket.removeListener('fruum:field', this);
          expect(response).toEqual(jasmine.objectContaining({
            id: 'thread', sticky: true
          }));
          socket.disconnect();
          done();
        });
      });
    });
  });

  it("can move thread", function(done) {
    admin_connect(function(socket) {
      load_fixture(function() {
        socket.emit('fruum:move', { id: 'move_thread', category: 'home' });
        socket.on('fruum:move', function(response) {
          socket.removeListener('fruum:move', this);
          expect(response.source).toEqual(jasmine.objectContaining({
            id: 'move_thread', parent: 'category'
          }));
          expect(response.target).toEqual(jasmine.objectContaining({
            id: 'move_thread', parent: 'home'
          }));
          socket.disconnect();
          done();
        });
      });
    });
  });

  it("can set onboarding", function(done) {
    admin_connect(function(socket) {
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
