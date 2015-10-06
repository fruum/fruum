describe("Anonymous client", function() {
  var socket;
  beforeEach(function() {
    socket = require('socket.io-client')('http://localhost:3000');
  });
  afterEach(function() {
    socket.disconnect();
    socket = null;
  });
  it("authenticates", function(done) {
    socket.emit("fruum:auth", {
      app_id: 'test'
    });
    socket.on("fruum:auth", function(payload) {
      socket.removeListener(this);
      expect(payload.user).toEqual(jasmine.objectContaining({
        anonymous: true,
        admin: false
      }));
      done();
    })
  });
});
