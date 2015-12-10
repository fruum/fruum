/******************************************************************************
 Move
*******************************************************************************/

'use strict';

var _ = require('underscore'),
    logger = require('../logger');

module.exports = function(options, instance, self) {
  var storage = self.storage,
      plugins = self.plugins;

  //return a list of all forum categories
  self.categories = function(socket, payload) {
    if (!self.validatePayloadID(socket, null, 'categories')) return;
    var app_id = socket.app_id,
        user = socket.fruum_user;
    if (!user.get('admin')) {
      logger.error(app_id, 'categories_noperm', user);
      socket.emit('fruum:categories');
      return;
    }
    storage.search_attributes(app_id, { type: 'category', archived: false }, function(results) {
      var response = [];
      _.each(results, function(document) {
        response.push(document.toJSON());
      });
      socket.emit('fruum:categories', {
        categories: response
      });
    });
  }

  //move article/thread/channel under another category
  self.move = function(socket, payload) {
    if (!self.validatePayloadID(socket, payload, 'move')) return;
    var app_id = socket.app_id,
        id = payload.id,
        category_id = payload.category,
        user = socket.fruum_user;
    if (!user.get('admin')) {
      logger.error(app_id, 'move_noperm', user);
      socket.emit('fruum:move');
      return;
    }
    if (!id || !category_id) {
      logger.error(app_id, 'move_invalid_payload', user);
      socket.emit('fruum:move');
      return;
    }
    //get document
    storage.get(app_id, id, function(document) {
      if (!document) {
        logger.error(app_id, 'move_invalid_doc', '' + id);
        socket.emit('fruum:move');
        return;
      }
      var original_document = document.clone();
      //get target category
      storage.get(app_id, category_id, function(category_doc) {
        if (!category_doc) {
          logger.error(app_id, 'move_invalid_category_doc', '' + category_id);
          socket.emit('fruum:move');
          return;
        }
        //validate document type
        switch(document.get('type')) {
          case 'thread':
          case 'article':
          case 'channel':
            break;
          default:
            logger.error(app_id, 'move_invalid_document_type', '' + id);
            socket.emit('fruum:move');
            return;
        }
        //validate category type
        if (category_doc.get('type') != 'category') {
          logger.error(app_id, 'move_invalid_document_type', '' + id);
          socket.emit('fruum:move');
          return;
        }
        //already under the proper category
        if (document.get('parent') == category_doc.get('id')) {
          return;
        }
        //get children
        storage.children(app_id, document, function(children) {
          document.setParentDocument(category_doc);
          _.each(children, function(child) {
            child.setParentDocument(document);
          });
          //process plugins
          var plugin_payload = {
            app_id: app_id,
            document: document,
            category: category_doc,
            children: children,
            user: user
          };
          plugins.move(plugin_payload, function(err, plugin_payload) {
            document = plugin_payload.document || document;
            children = plugin_payload.children || children;
            var emit_payload = {
              source: original_document.toJSON(),
              target: document.toJSON()
            };
            if (plugin_payload.storage_noop) {
              self.invalidateDocument(app_id, original_document);
              self.invalidateDocument(app_id, category_doc);
              socket.emit('fruum:move', emit_payload);
              return;
            }
            //save
            children.push(document);
            function process() {
              var doc = children.shift();
              if (!doc) {
                self.invalidateDocument(app_id, original_document);
                self.invalidateDocument(app_id, category_doc);
                socket.emit('fruum:move', emit_payload);
                if (!plugin_payload.broadcast_noop) {
                  self.broadcastRaw(
                    app_id, original_document.get('parent'),
                    'fruum:move', emit_payload
                  );
                  self.broadcastRaw(
                    app_id, document.get('parent'),
                    'fruum:move', emit_payload
                  );
                }
              }
              else {
                self.invalidateDocument(app_id, doc);
                storage.update(app_id, doc, null, function() {
                  process();
                });
              }
            }
            process();
          });
        });
      });
    });
  }
}
