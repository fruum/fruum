/* globals describe, it, expect, jasmine */

var request = require('request'),
    url = 'http://test:testkey@localhost:3000',
    Utils = require('./client/utils'),
    load_bob = Utils.load_bob;

describe('Document API', function() {
  it('creates document', function(done) {
    var payload = {
      id: 'foo_id',
      parent: 'home',
      type: 'category',
      header: 'foo',
      body: 'bar',
    };
    request({
      method: 'POST',
      url: url + '/api/v1/docs',
      json: true,
      body: payload,
    }, function(err, res, body) {
      expect(err).toBe(null);
      expect(body).toEqual(jasmine.objectContaining(payload));
      done();
    });
  });

  it('creates document without id', function(done) {
    var payload = {
      parent: 'home',
      type: 'category',
      header: 'foo2',
      body: 'bar2',
    };
    request({
      method: 'POST',
      url: url + '/api/v1/docs',
      json: true,
      body: payload,
    }, function(err, res, body) {
      expect(err).toBe(null);
      expect(body).toEqual(jasmine.objectContaining(payload));
      done();
    });
  });

  it('does not create document with existing id', function(done) {
    var payload = {
      id: 'foo_id',
      parent: 'home',
      type: 'category',
      header: 'foo',
      body: 'bar',
    };
    request({
      method: 'POST',
      url: url + '/api/v1/docs',
      json: true,
      body: payload,
    }, function(err, res, body) {
      expect(err).toBe(null);
      expect(res.statusCode).toBe(400);
      done();
    });
  });

  it('does not create document with invalid parent', function(done) {
    var payload = {
      parent: 'home_invalid',
      type: 'category',
      header: 'foo',
      body: 'bar',
    };
    request({
      method: 'POST',
      url: url + '/api/v1/docs',
      json: true,
      body: payload,
    }, function(err, res, body) {
      expect(err).toBe(null);
      expect(res.statusCode).toBe(400);
      done();
    });
  });

  // ---------------------------------------------------------------------------

  it('updates document', function(done) {
    var payload = {
      body: 'bar2',
    };
    request({
      method: 'PUT',
      url: url + '/api/v1/docs/foo_id',
      json: true,
      body: payload,
    }, function(err, res, body) {
      expect(err).toBe(null);
      expect(body).toEqual(jasmine.objectContaining(payload));
      done();
    });
  });

  it('does not update document with invalid parent', function(done) {
    var payload = {
      body: 'bar2',
      parent: 'invalid_parent',
    };
    request({
      method: 'PUT',
      url: url + '/api/v1/docs/foo_id',
      json: true,
      body: payload,
    }, function(err, res, body) {
      expect(err).toBe(null);
      expect(res.statusCode).toBe(400);
      done();
    });
  });

  it('does not update document with invalid id', function(done) {
    var payload = {
      body: 'bar2',
    };
    request({
      method: 'PUT',
      url: url + '/api/v1/docs/foo_id_invalid',
      json: true,
      body: payload,
    }, function(err, res, body) {
      expect(err).toBe(null);
      expect(res.statusCode).toBe(404);
      done();
    });
  });

  // ---------------------------------------------------------------------------

  it('gets document', function(done) {
    var payload = {
      id: 'foo_id',
    };
    request({
      method: 'GET',
      url: url + '/api/v1/docs/foo_id',
      json: true,
    }, function(err, res, body) {
      expect(err).toBe(null);
      expect(body).toEqual(jasmine.objectContaining(payload));
      done();
    });
  });

  it('does not get invalid document', function(done) {
    request({
      method: 'GET',
      url: url + '/api/v1/docs/foo_id_invalid',
      json: true,
    }, function(err, res, body) {
      expect(err).toBe(null);
      expect(res.statusCode).toBe(404);
      done();
    });
  });

  // ---------------------------------------------------------------------------

  it('deletes document', function(done) {
    var payload = {
      id: 'foo_id',
    };
    request({
      method: 'DELETE',
      url: url + '/api/v1/docs/foo_id',
      json: true,
    }, function(err, res, body) {
      expect(err).toBe(null);
      expect(body).toEqual(jasmine.objectContaining(payload));
      done();
    });
  });

  it('does not delete invalid document', function(done) {
    request({
      method: 'DELETE',
      url: url + '/api/v1/docs/foo_id_invalid',
      json: true,
    }, function(err, res, body) {
      expect(err).toBe(null);
      expect(res.statusCode).toBe(404);
      done();
    });
  });
});

describe('API call', function() {
  it('validates api_key', function(done) {
    var payload = {
      id: 'foo_id',
      type: 'category',
      header: 'foo',
      body: 'bar',
    };
    request({
      method: 'POST',
      url: url.replace('testkey', '_testkey') + '/api/v1/docs',
      json: true,
      body: payload,
    }, function(err, res, body) {
      expect(err).toBe(null);
      expect(res.statusCode).toBe(401);
      done();
    });
  });

  it('validates application', function(done) {
    var payload = {
      id: 'foo_id',
      type: 'category',
      header: 'foo',
      body: 'bar',
    };
    request({
      method: 'POST',
      url: url.replace('test:', '_test:') + '/api/v1/docs',
      json: true,
      body: payload,
    }, function(err, res, body) {
      expect(err).toBe(null);
      expect(res.statusCode).toBe(401);
      done();
    });
  });

  it('validates doc_id', function(done) {
    request({
      method: 'GET',
      url: url + '/api/v1/docs/bar',
      json: true,
      body: {},
    }, function(err, res, body) {
      expect(err).toBe(null);
      expect(res.statusCode).toBe(404);
      done();
    });
  });
});

describe('Presence API', function() {
  it('gets overview', function(done) {
    request({
      url: url + '/api/v1/presence/overview',
      json: true,
    }, function(err, res, body) {
      expect(err).toBe(null);
      expect(body).toEqual(jasmine.objectContaining({
        total: 0,
        anonymous: 0,
        authenticated: 0,
      }));
      done();
    });
  });

  it('gets overview under document', function(done) {
    request({
      url: url + '/api/v1/presence/overview/home',
      json: true,
    }, function(err, res, body) {
      expect(err).toBe(null);
      expect(body).toEqual(jasmine.objectContaining({
        total: 0,
        anonymous: 0,
        authenticated: 0,
      }));
      done();
    });
  });

  it('gets overview under document (with children)', function(done) {
    request({
      url: url + '/api/v1/presence/overview/home?children',
      json: true,
    }, function(err, res, body) {
      expect(err).toBe(null);
      expect(body).toEqual(jasmine.objectContaining({
        total: 0,
        anonymous: 0,
        authenticated: 0,
      }));
      done();
    });
  });

  it('gets users', function(done) {
    request({
      url: url + '/api/v1/presence/users',
      json: true,
    }, function(err, res, body) {
      expect(err).toBe(null);
      expect(body.length).toEqual(0);
      done();
    });
  });

  it('gets users under document', function(done) {
    request({
      url: url + '/api/v1/presence/users/home',
      json: true,
    }, function(err, res, body) {
      expect(err).toBe(null);
      expect(body.length).toEqual(0);
      done();
    });
  });

  it('gets users under document (with children)', function(done) {
    request({
      url: url + '/api/v1/presence/users/home?children',
      json: true,
    }, function(err, res, body) {
      expect(err).toBe(null);
      expect(body.length).toEqual(0);
      done();
    });
  });

  it('gets document overview', function(done) {
    request({
      url: url + '/api/v1/presence/docs',
      json: true,
    }, function(err, res, body) {
      expect(err).toBe(null);
      expect(body).toEqual(jasmine.objectContaining({
        docs: {},
        paths: {},
      }));
      done();
    });
  });
});

describe('User API', function() {
  it('creates a user', function(done) {
    var payload = {
      id: 'api_user',
      username: 'api_user',
      displayname: 'API USER',
    };
    request({
      method: 'POST',
      url: url + '/api/v1/users',
      json: true,
      body: payload,
    }, function(err, res, body) {
      expect(err).toBe(null);
      expect(body).toEqual(jasmine.objectContaining(payload));
      done();
    });
  });

  it('gets a user', function(done) {
    request({
      method: 'GET',
      url: url + '/api/v1/users/api_user',
      json: true,
    }, function(err, res, body) {
      expect(err).toBe(null);
      expect(body).toEqual(jasmine.objectContaining({
        username: 'api_user',
      }));
      done();
    });
  });

  it('updates a user', function(done) {
    var payload = {
      displayname: 'FOO BAR',
    };
    request({
      method: 'PUT',
      url: url + '/api/v1/users/api_user',
      json: true,
      body: payload,
    }, function(err, res, body) {
      expect(err).toBe(null);
      expect(body).toEqual(jasmine.objectContaining(payload));
      done();
    });
  });

  it('does not get invalid username', function(done) {
    request({
      method: 'GET',
      url: url + '/api/v1/users/invalid_username',
      json: true,
    }, function(err, res, body) {
      expect(err).toBe(null);
      expect(res.statusCode).toBe(404);
      done();
    });
  });

  it('gets user topics', function(done) {
    load_bob(function() {
      setTimeout(function() {
        request({
          method: 'GET',
          url: url + '/api/v1/users/bob/topics',
          json: true,
        }, function(err, res, body) {
          expect(err).toBe(null);
          expect(body.length).toEqual(2);
          expect(body[0]).toEqual(jasmine.objectContaining({
            user_id: 'bob',
          }));
          expect(body[1]).toEqual(jasmine.objectContaining({
            user_id: 'bob',
          }));
          // and counts them
          request({
            method: 'GET',
            url: url + '/api/v1/users/bob/topics?count',
            json: true,
          }, function(err2, res2, body2) {
            expect(err2).toBe(null);
            expect(body2).toEqual(2);
            done();
          });
        });
      }, 2000);
    });
  });

  it('gets user topics as admin', function(done) {
    load_bob(function() {
      setTimeout(function() {
        request({
          method: 'GET',
          url: url + '/api/v1/users/bob/topics?admin',
          json: true,
        }, function(err, res, body) {
          expect(err).toBe(null);
          expect(body.length).toEqual(3);
          expect(body[0]).toEqual(jasmine.objectContaining({
            user_id: 'bob',
          }));
          expect(body[1]).toEqual(jasmine.objectContaining({
            user_id: 'bob',
          }));
          expect(body[2]).toEqual(jasmine.objectContaining({
            user_id: 'bob',
          }));
          // and counts them
          request({
            method: 'GET',
            url: url + '/api/v1/users/bob/topics?count&admin',
            json: true,
          }, function(err2, res2, body2) {
            expect(err2).toBe(null);
            expect(body2).toEqual(3);
            done();
          });
        });
      }, 2000);
    });
  });

  it('gets user replies', function(done) {
    load_bob(function() {
      setTimeout(function() {
        request({
          method: 'GET',
          url: url + '/api/v1/users/bob/replies',
          json: true,
        }, function(err, res, body) {
          expect(err).toBe(null);
          expect(body.length).toEqual(0);
          // and counts them
          request({
            method: 'GET',
            url: url + '/api/v1/users/bob/replies?count',
            json: true,
          }, function(err2, res2, body2) {
            expect(err2).toBe(null);
            expect(body2).toEqual(0);
            done();
          });
        });
      }, 2000);
    });
  });

  it('gets user replies as admin', function(done) {
    load_bob(function() {
      setTimeout(function() {
        request({
          method: 'GET',
          url: url + '/api/v1/users/bob/replies?admin',
          json: true,
        }, function(err, res, body) {
          expect(err).toBe(null);
          expect(body.length).toEqual(1);
          expect(body[0]).toEqual(jasmine.objectContaining({
            user_id: 'bob',
          }));
          // and counts them
          request({
            method: 'GET',
            url: url + '/api/v1/users/bob/replies?count&admin',
            json: true,
          }, function(err2, res2, body2) {
            expect(err2).toBe(null);
            expect(body2).toEqual(1);
            done();
          });
        });
      }, 2000);
    });
  });
});
