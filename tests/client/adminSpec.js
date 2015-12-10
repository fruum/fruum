var admin_connect = require('./utils').admin_connect,
    load_fixture = require('./utils').load_fixture;

describe("Admin client", function() {
  it("creates category", function(done) {
    admin_connect(function(socket) {
      var payload = {
        parent: 'home',
        type: 'category',
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

  it("gets all categories", function(done) {
    admin_connect(function(socket) {
      socket.emit('fruum:categories', {});
      socket.on('fruum:categories', function(payload) {
        socket.removeListener('fruum:categories', this);
        expect(payload.categories).toBeDefined();
        expect(payload.categories[0]).toEqual(jasmine.objectContaining({
          type: 'category'
        }));
        socket.disconnect();
        done();
      });
    });
  });

  it("creates article", function(done) {
    admin_connect(function(socket) {
      var payload = {
        parent: 'home',
        type: 'article',
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

  it("creates blog article", function(done) {
    admin_connect(function(socket) {
      var payload = {
        parent: 'home',
        type: 'article',
        header: 'foo',
        body: 'bar',
        is_blog: true
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

  it("respects parent", function(done) {
    admin_connect(function(socket) {
      var payload = {
        parent: 'home_invalid',
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

  it("can archive thread", function(done) {
    admin_connect(function(socket) {
      load_fixture(function() {
        socket.emit('fruum:archive', { id: 'thread' });
        socket.on('fruum:archive', function(payload) {
          socket.removeListener('fruum:archive', this);
          expect(payload).toEqual(jasmine.objectContaining({
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
        socket.on('fruum:restore', function(payload) {
          socket.removeListener('fruum:restore', this);
          expect(payload).toEqual(jasmine.objectContaining({
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
        socket.on('fruum:field', function(payload) {
          socket.removeListener('fruum:field', this);
          expect(payload).toEqual(jasmine.objectContaining({
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
        socket.on('fruum:move', function(payload) {
          socket.removeListener('fruum:move', this);
          expect(payload.source).toEqual(jasmine.objectContaining({
            id: 'move_thread', parent: 'category'
          }));
          expect(payload.target).toEqual(jasmine.objectContaining({
            id: 'move_thread', parent: 'home'
          }));
          socket.disconnect();
          done();
        });
      });
    });
  });

});
