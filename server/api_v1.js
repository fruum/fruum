/******************************************************************************
 API V1
*******************************************************************************/

'use strict';

var _ = require('underscore'),
    auth = require('basic-auth'),
    express = require('express'),
    Models = require('./models');

function API_v1(options, instance) {
  var storage = instance.storage,
      engine = instance.engine,
      router = express.Router();

  function serverError(req, res) {
    res.statusCode = 500;
    res.send('Internal Server Error');
  }

  function notFound(req, res, message) {
    res.statusCode = 404;
    res.send(message || 'Not found');
  }

  function badRequest(req, res, message) {
    res.statusCode = 400;
    res.setHeader('WWW-Authenticate', 'Basic realm="api"');
    res.send(message || 'Bad request');
  }

  function unauthorized(req, res, message) {
    res.statusCode = 401;
    res.setHeader('WWW-Authenticate', 'Basic realm="api"');
    res.send(message || 'Unauthorized');
  }

  function get_app(req, res, callback) {
    var credentials = auth(req);
    if (!credentials || !credentials.name || !credentials.pass) {
      unauthorized(req, res, 'API Key is missing');
    }
    else {
      storage.get_api_key(credentials.pass, function(application) {
        if (application && application.get('id') === credentials.name) {
          callback(application);
        }
        else {
          unauthorized(req, res, 'Invalid API Key or Application name');
        }
      });
    }
  }

  // ------------------------------- DOCUMENTS API -----------------------------

  // GET ALL documents
  router.get('/docs/', function(req, res) {
    get_app(req, res, function(application) {
      res.json({});
    });
  });

  // GET single document
  router.get('/docs/:id', function(req, res) {
    var id = req.params.id;
    get_app(req, res, function(application) {
      storage.get(application.get('id'), id, function(document) {
        if (document) {
          res.json(document.toJSON());
        }
        else {
          notFound(req, res);
        }
      });
    });
  });

  // CREATE new document
  router.post('/docs/', function(req, res) {
    get_app(req, res, function(application) {
      var document = new Models.Document(req.body);
      document.escape();
      //validate parent exists
      if (!document.get('parent')) {
        badRequest(req, res, 'Parent document is missing');
        return;
      }
      //insert
      storage.get(application.get('id'), document.get('id') || '0', function(existing_document) {
        if (existing_document) {
          badRequest(req, res, 'Document already exists');
        }
        else {
          //find parent
          storage.get(application.get('id'), document.get('parent'), function(parent_doc) {
            if (!parent_doc) {
              badRequest(req, res, 'Invalid parent document');
            }
            else {
              document.setParentDocument(parent_doc);
              storage.add(application.get('id'), document, function(document) {
                engine.invalidateDocument(application.get('id'), document);
                res.json(document.toJSON());
                engine.refreshChildrenCount(application.get('id'), document.get('parent'), function() {
                  engine.refreshNotify(application.get('id'), document.get('parent'));
                });
              });
            }
          });
        }
      });
    });
  });

  // UPDATE existing document
  router.put('/docs/:id', function(req, res) {
    var id = req.params.id;
    get_app(req, res, function(application) {
      storage.get(application.get('id'), id, function(document) {
        if (document) {
          function apply_permission(root_doc, previous_permission) {
            if (root_doc.get('permission') != previous_permission) {
              storage.update_subtree(application.get('id'), root_doc, {
                permission: root_doc.get('permission')
              }, function() {
                res.json(root_doc.toJSON());
              });
            }
            else res.json(root_doc.toJSON());
          }
          var permission = document.get('permission');
          //home
          if (document.get('id') == 'home' && !document.get('parent')) {
            //update only flags
            _.each([
              'header', 'body', 'initials',
              'visible', 'usage', 'permission'
            ], function(field) {
              if (req.body[field] != undefined) {
                document.set(field, req.body[field]);
              }
            });
            storage.update(application.get('id'), document, null, function(updated_doc) {
              engine.invalidateDocument(application.get('id'), updated_doc);
              apply_permission(updated_doc, permission);
            });
          }
          else {
            document.set(req.body);
            //allow permission changes only on categories
            if (document.get('type') != 'category')
              document.set('permission', permission);
            document.escape();
            //verify that parent exists
            storage.get(application.get('id'), document.get('parent'), function(parent_doc) {
              if (!parent_doc) {
                badRequest(req, res, 'Invalid document parent');
              }
              else {
                document.setParentDocument(parent_doc);
                storage.update(application.get('id'), document, null, function(updated_doc) {
                  engine.invalidateDocument(application.get('id'), updated_doc);
                  apply_permission(updated_doc, permission);
                });
              }
            });
          }
        }
        else {
          notFound(req, res, 'Invalid document');
        }
      });
    });
  });

  // DELETE existing document
  router.delete('/docs/:id', function(req, res) {
    var id = req.params.id;
    get_app(req, res, function(application) {
      storage.get(application.get('id'), id, function(document) {
        if (document) {
          storage.delete(application.get('id'), document, function() {
            engine.invalidateDocument(application.get('id'), document);
            res.json(document.toJSON());
            engine.refreshChildrenCount(application.get('id'), document.get('parent'), function() {
              engine.refreshNotify(application.get('id'), document.get('parent'));
            });
          });
        }
        else {
          notFound(req, res, 'Invalid document');
        }
      });
    });
  });

  // ------------------------------- PRESENCE API -----------------------------

  function serialize_user(user) {
    return {
      id: user.get('id'),
      admin: user.get('admin'),
      blocked: user.get('blocked'),
      username: user.get('username'),
      displayname: user.get('displayname'),
      email: user.get('email'),
      avatar: user.get('avatar'),
      created: user.get('created'),
      last_login: user.get('last_login'),
      last_logout: user.get('last_logout'),
      karma: user.get('karma'),
      viewing_docid: user.get('viewing'),
      viewing_docpath: user.get('viewing_path'),
    };
  }

  //presence overview
  router.get('/presence/overview', function(req, res) {
    get_app(req, res, function(application) {
      var response = {
        total: 0,
        anonymous: 0,
        authenticated: 0
      };
      var users = instance.engine.app_users[application.get('id')];
      if (users) {
        _.each(users, function(user) {
          if (!user.get('socket')) return;
          response.total++;
          if (user.get('anonymous')) response.anonymous++;
          else response.authenticated++;
        }, this);
      }
      res.json(response);
    });
  });

  //presence overview viewing a document
  router.get('/presence/overview/:id', function(req, res) {
    var viewing_id = req.params.id;
    get_app(req, res, function(application) {
      var response = {
        total: 0,
        anonymous: 0,
        authenticated: 0
      };
      var users = instance.engine.app_users[application.get('id')];
      if (users) {
        var children = req.query.children !== undefined;
        _.each(users, function(user) {
          if (user.get('socket') &&
              (user.get('viewing') == viewing_id ||
                (children && _.contains(user.get('viewing_path'), viewing_id))
              )
          ) {
            response.total++;
            if (user.get('anonymous')) response.anonymous++;
            else response.authenticated++;
          }
        }, this);
      }
      res.json(response);
    });
  });

  //presence document breakdown
  router.get('/presence/docs', function(req, res) {
    get_app(req, res, function(application) {
      var response = {
        docs: {},
        paths: {}
      };
      var users = instance.engine.app_users[application.get('id')];
      if (users) {
        _.each(users, function(user) {
          var doc_id = user.get('viewing');
          var path_id = (user.get('viewing_path') || []).join('/');
          if (!user.get('socket') || !doc_id || !path_id) return;
          var doc_entry = response.docs[doc_id] || {
            total: 0,
            anonymous: 0,
            authenticated: 0
          };
          var path_entry = response.paths[path_id] || {
            total: 0,
            anonymous: 0,
            authenticated: 0
          };
          doc_entry.total++;
          path_entry.total++;
          if (user.get('anonymous')) {
            doc_entry.anonymous++;
            path_entry.anonymous++;
          }
          else {
            doc_entry.authenticated++;
            path_entry.authenticated++;
          }
          response.docs[doc_id] = doc_entry;
          response.paths[path_id] = path_entry;
        }, this);
      }
      res.json(response);
    });
  });

  //presence users
  router.get('/presence/users', function(req, res) {
    get_app(req, res, function(application) {
      var response = [];
      var users = instance.engine.app_users[application.get('id')];
      if (users) {
        _.each(users, function(user) {
          if (!user.get('anonymous') && user.get('socket')) {
            response.push(serialize_user(user));
          }
        }, this);
      }
      res.json(response);
    });
  });

  //presence users
  router.get('/presence/users/:id', function(req, res) {
    var viewing_id = req.params.id;
    get_app(req, res, function(application) {
      var response = [];
      var users = instance.engine.app_users[application.get('id')];
      if (users) {
        var children = req.query.children !== undefined;
        _.each(users, function(user) {
          if (!user.get('anonymous') &&
              user.get('socket') &&
              (user.get('viewing') == viewing_id ||
                (children && _.contains(user.get('viewing_path'), viewing_id))
              )
          ) {
            response.push(serialize_user(user));
          }
        }, this);
      }
      res.json(response);
    });
  });

  instance.server.use('/api/v1', router);
}

module.exports = API_v1;
