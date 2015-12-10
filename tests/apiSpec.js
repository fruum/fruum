var request = require('request'),
    url = 'http://localhost:3000';

describe("API call", function() {

  it("creates document", function(done) {
    var payload = {
      id: 'foo_id',
      parent: 'home',
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
  it("creates document without id", function(done) {
    var payload = {
      parent: 'home',
      type: 'category',
      header: 'foo2',
      body: 'bar2'
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
  it("does not create document with existing id", function(done) {
    var payload = {
      id: 'foo_id',
      parent: 'home',
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
      expect(body).toEqual(jasmine.objectContaining({ error: 'doc_id_already_exists: ' + payload.id }));
      done();
    });
  });
  it("does not create document with invalid parent", function(done) {
    var payload = {
      parent: 'home_invalid',
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
      expect(body).toEqual(jasmine.objectContaining({ error: 'invalid_parent_id: ' + payload.parent }));
      done();
    });
  });

  // ---------------------------------------------------------------------------

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
  it("does not update document with invalid parent", function(done) {
    var payload = {
      body: 'bar2',
      parent: 'invalid_parent'
    }
    request({
      method: 'PUT',
      url: url + '/api/v1/testkey/docs/foo_id',
      json: true,
      body: payload
    }, function(err, res, body) {
      expect(err).toBe(null);
      expect(body).toEqual(jasmine.objectContaining({ error: 'invalid_parent_id: ' + payload.parent }));
      done();
    });
  });
  it("does not update document with invalid id", function(done) {
    var payload = {
      body: 'bar2'
    }
    request({
      method: 'PUT',
      url: url + '/api/v1/testkey/docs/foo_id_invalid',
      json: true,
      body: payload
    }, function(err, res, body) {
      expect(err).toBe(null);
      expect(body).toEqual(jasmine.objectContaining({ error: 'invalid_doc_id: foo_id_invalid' }));
      done();
    });
  });

  // ---------------------------------------------------------------------------

  it("gets document", function(done) {
    var payload = {
      id: 'foo_id'
    }
    request({
      method: 'GET',
      url: url + '/api/v1/testkey/docs/foo_id',
      json: true
    }, function(err, res, body) {
      expect(err).toBe(null);
      expect(body).toEqual(jasmine.objectContaining(payload));
      done();
    });
  });
  it("does not get invalid document", function(done) {
    request({
      method: 'GET',
      url: url + '/api/v1/testkey/docs/foo_id_invalid',
      json: true
    }, function(err, res, body) {
      expect(err).toBe(null);
      expect(body).toEqual(jasmine.objectContaining({ error: 'invalid_doc_id: foo_id_invalid' }));
      done();
    });
  });

  // ---------------------------------------------------------------------------

  it("deletes document", function(done) {
    var payload = {
      id: 'foo_id'
    }
    request({
      method: 'DELETE',
      url: url + '/api/v1/testkey/docs/foo_id',
      json: true
    }, function(err, res, body) {
      expect(err).toBe(null);
      expect(body).toEqual(jasmine.objectContaining(payload));
      done();
    });
  });
  it("does not delete invalid document", function(done) {
    request({
      method: 'DELETE',
      url: url + '/api/v1/testkey/docs/foo_id_invalid',
      json: true
    }, function(err, res, body) {
      expect(err).toBe(null);
      expect(body).toEqual(jasmine.objectContaining({ error: 'invalid_doc_id: foo_id_invalid' }));
      done();
    });
  });

});

describe("API call", function() {
  it("validates api_key", function(done) {
    var payload = {
      id: 'foo_id',
      type: 'category',
      header: 'foo',
      body: 'bar'
    }
    request({
      method: 'POST',
      url: url + '/api/v1/_testkey/docs',
      json: true,
      body: payload
    }, function(err, res, body) {
      expect(err).toBe(null);
      expect(body).toEqual(jasmine.objectContaining({
        error: 'invalid_api_key: _testkey'
      }));
      done();
    });
  });
  it("validates doc_id", function(done) {
    request({
      method: 'GET',
      url: url + '/api/v1/testkey/docs/bar',
      json: true,
      body: {}
    }, function(err, res, body) {
      expect(err).toBe(null);
      expect(body).toEqual(jasmine.objectContaining({
        error: 'invalid_doc_id: bar'
      }));
      done();
    });
  });
});
