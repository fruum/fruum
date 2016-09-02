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

  instance.server.use('/api/v1', router);
}

module.exports = API_v1;
