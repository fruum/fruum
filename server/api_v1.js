/******************************************************************************
 API V1
*******************************************************************************/

'use strict';

var _ = require('underscore'),
    express = require('express'),
    Models = require('./models');

function API_v1(options, instance) {
  var storage = instance.storage,
      engine = instance.engine,
      router = express.Router();

  function get_app(req, res, callback) {
    if (!req.params.api_key) {
      res.json({ error: 'missing_api_key' });
      callback();
    }
    else {
      storage.get_api_key(req.params.api_key, function(application) {
        if (!application) {
          res.json({ error: 'invalid_api_key: ' + req.params.api_key });
        }
        callback(application);
      });
    }
  }

  // GET ALL documents
  router.get('/:api_key/docs/', function(req, res) {
    get_app(req, res, function(application) {
      if (application) {
        res.json({});
      }
    });
  });

  // GET single document
  router.get('/:api_key/docs/:id', function(req, res) {
    var id = req.params.id;
    get_app(req, res, function(application) {
      if (application) {
        storage.get(application.get('id'), id, function(document) {
          if (document) {
            res.json(document.toJSON());
          }
          else {
            res.json({ error: 'invalid_doc_id: '  + id });
          }
        });
      }
    });
  });

  // CREATE new document
  router.post('/:api_key/docs/', function(req, res) {
    get_app(req, res, function(application) {
      if (application) {
        var document = new Models.Document(req.body);
        document.escape();
        //validate parent exists
        if (!document.get('parent')) {
          res.json({ error: 'parent_missing' });
          return;
        }
        //insert
        storage.get(application.get('id'), document.get('id') || '0', function(existing_document) {
          if (existing_document) {
            res.json({ error: 'doc_id_already_exists: ' + document.get('id') });
          }
          else {
            //find parent
            storage.get(application.get('id'), document.get('parent'), function(parent_doc) {
              if (!parent_doc) {
                res.json({ error: 'invalid_parent_id: '  + document.get('parent') });
              }
              else {
                document.setParentDocument(parent_doc);
                storage.add(application.get('id'), document, function(document) {
                  engine.invalidateDocument(application.get('id'), document);
                  res.json(document.toJSON());
                  engine.refreshChildrenCount(application.get('id'), document.get('parent'), function() {
                  });
                });
              }
            });
          }
        });
      }
    });
  });

  // UPDATE existing document
  router.put('/:api_key/docs/:id', function(req, res) {
    var id = req.params.id;
    get_app(req, res, function(application) {
      if (application) {
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
                  res.json({ error: 'invalid_parent_id: '  + document.get('parent') });
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
            res.json({ error: 'invalid_doc_id: '  + id });
          }
        });
      }
    });
  });

  // DELETE existing document
  router.delete('/:api_key/docs/:id', function(req, res) {
    var id = req.params.id;
    get_app(req, res, function(application) {
      if (application) {
        storage.get(application.get('id'), id, function(document) {
          if (document) {
            storage.delete(application.get('id'), document, function() {
              engine.invalidateDocument(application.get('id'), document);
              res.json(document.toJSON());
              engine.refreshChildrenCount(application.get('id'), document.get('parent'));
            });
          }
          else {
            res.json({ error: 'invalid_doc_id: '  + id });
          }
        });
      }
    });
  });

  instance.server.use('/api/v1', router);
}

module.exports = API_v1;
