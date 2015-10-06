var request = require('request'),
    url = 'http://localhost:3000';

describe("API", function() {
  it("creates document", function(done) {
    var payload = {
      id: 'foo_id',
      type: 'category',
      header: 'foo',
      body: 'bar'
    }
    request({
      method: 'POST',
      url: url + '/api/v1/testkey/docs',
      json: true,
      body: payload
    }, function(err, res, body) {
      expect(err).toBe(null);
      expect(body).toEqual(jasmine.objectContaining(payload));
      done();
    });
  });
  it("updates document", function(done) {
    var payload = {
      body: 'bar2'
    }
    request({
      method: 'PUT',
      url: url + '/api/v1/testkey/docs/foo_id',
      json: true,
      body: payload
    }, function(err, res, body) {
      expect(err).toBe(null);
      expect(body).toEqual(jasmine.objectContaining(payload));
      done();
    });
  });
  it("gets document", function(done) {
    var payload = {
      id: 'foo_id'
    }
    request({
      method: 'GET',
      url: url + '/api/v1/testkey/docs/foo_id',
      json: true,
      body: payload
    }, function(err, res, body) {
      expect(err).toBe(null);
      expect(body).toEqual(jasmine.objectContaining(payload));
      done();
    });
  });
  it("deletes document", function(done) {
    var payload = {
      id: 'foo_id'
    }
    request({
      method: 'DELETE',
      url: url + '/api/v1/testkey/docs/foo_id',
      json: true,
      body: payload
    }, function(err, res, body) {
      expect(err).toBe(null);
      expect(body).toEqual(jasmine.objectContaining(payload));
      done();
    });
  });
});
