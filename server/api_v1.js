/******************************************************************************
 API V1
*******************************************************************************/

'use strict';

var express = require('express'),
    Models = require('./models');

function API_v1(options, instance) {
  var storage = instance.storage;
  var cache = instance.cache;
  var router = express.Router();
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
  router.get('/:api_key/docs/', function(req, res) {
    get_app(req, res, function(application) {
      if (application) {
        res.json({});
      }
    });
  });
  router.post('/:api_key/docs/', function(req, res) {
    get_app(req, res, function(application) {
      if (application) {
        //upsert
        storage.get(application.get('id'), req.body.id || '0', function(document) {
          if (document) {
            document.set(req.body);
            document.escape();
            document.extractTags();
            storage.update(application.get('id'), document, null, function(updated_doc) {
              cache.invalidate_document(application.get('id'), updated_doc);
              res.json(updated_doc.toJSON());
            });
          }
          else {
            document = new Models.Document(req.body);
            document.escape();
            document.extractTags();
            storage.add(application.get('id'), document, function(document) {
              cache.invalidate_document(application.get('id'), document);
              res.json(document.toJSON());
            });
          }
        });
      }
    });
  });
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
  router.put('/:api_key/docs/:id', function(req, res) {
    var id = req.params.id;
    get_app(req, res, function(application) {
      if (application) {
        storage.get(application.get('id'), id, function(document) {
          if (document) {
            document.set(req.body);
            document.escape();
            document.extractTags();
            storage.update(application.get('id'), document, null, function(updated_doc) {
              cache.invalidate_document(application.get('id'), updated_doc);
              res.json(updated_doc.toJSON());
            });
          }
          else {
            res.json({ error: 'invalid_doc_id: '  + id });
          }
        });
      }
    });
  });
  router.delete('/:api_key/docs/:id', function(req, res) {
    var id = req.params.id;
    get_app(req, res, function(application) {
      if (application) {
        storage.get(application.get('id'), id, function(document) {
          if (document) {
            storage.delete(application.get('id'), document, function() {
              cache.invalidate_document(application.get('id'), document);
              res.json(document.toJSON());
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
