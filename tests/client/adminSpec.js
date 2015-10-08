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

});
