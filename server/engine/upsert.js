/******************************************************************************
 Add or update
*******************************************************************************/

'use strict';

var _ = require('underscore'),
    Backbone = require('backbone'),
    Models = require('../models'),
    logger = require('../logger');

module.exports = function(options, instance, self) {
  var cache = self.cache,
      engine = self.engine,
      storage = self.storage,
      plugins = self.plugins;

  // --------------------------------- ADD -------------------------------------

  self.add = function(socket, payload) {
    if (!self.validatePayloadID(socket, null, 'add')) return;
    var app_id = socket.app_id,
        user = socket.fruum_user,
        document = new Models.Document(payload);
    document.set({
      user_id: user.get('id'),
      user_username: user.get('username'),
      user_displayname: user.get('displayname'),
      user_avatar: user.get('avatar')
    });
    if (user.get('anonymous')) {
      logger.error(app_id, 'add_anonymous_noperm', user);
      socket.emit('fruum:add');
      return;
    }
    if (!document.isValid()) {
      logger.error(app_id, 'add_invalid_doc', document);
      logger.error(app_id, 'validation_error:', document.validationError);
      socket.emit('fruum:add');
      return;
    }
    if (document.get('type') == 'category' && !user.get('admin')) {
      logger.error(app_id, 'add_category_noperm', user);
      socket.emit('fruum:add');
      return;
    }
    if (document.get('type') == 'article' && !user.get('admin')) {
      logger.error(app_id, 'add_article_noperm', user);
      socket.emit('fruum:add');
      return;
    }
    //get parent
    storage.get(app_id, document.get('parent'), function(parent_doc) {
      if (!parent_doc) {
        logger.error(app_id, 'add_noparent', document);
        socket.emit('fruum:add');
        return;
      }
      //check permissions
      if (document.get('type') == 'thread' && !parent_doc.get('allow_threads') ||
          document.get('type') == 'channel' && !parent_doc.get('allow_channels') ||
          document.get('type') == 'post' && parent_doc.get('locked'))
      {
        logger.error(app_id, 'add_invalid_parent_perm', document);
        socket.emit('fruum:add');
        return;
      }
      //conform to document constraints
      switch (document.get('type')) {
        case 'category':
          document.set({
            header: options.docs.max_category_title_size?document.get('header').substr(0, options.docs.max_category_title_size):document.get('header'),
            body: options.docs.max_category_description_size?document.get('body').substr(0, options.docs.max_category_description_size):document.get('body')
          });
          break;
        case 'article':
          //update fields (denormalization for search)
          document.set({
            initials: parent_doc.get('initials'),
            header: options.docs.max_article_title_size?document.get('header').substr(0, options.docs.max_article_title_size):document.get('header'),
            body: options.docs.max_post_size?document.get('body').substr(0, options.docs.max_post_size):document.get('body')
          });
          break;
        case 'thread':
          //update fields (denormalization for search)
          document.set({
            initials: parent_doc.get('initials'),
            header: options.docs.max_thread_title_size?document.get('header').substr(0, options.docs.max_thread_title_size):document.get('header'),
            body: options.docs.max_post_size?document.get('body').substr(0, options.docs.max_post_size):document.get('body')
          });
          break;
        case 'channel':
          //update fields (denormalization for search)
          document.set({
            initials: parent_doc.get('initials'),
            header: options.docs.max_channel_name_size?document.get('header').substr(0, options.docs.max_channel_name_size):document.get('header')
          });
          break;
        case 'post':
          //update fields (denormalization for search)
          document.set({
            header: parent_doc.get('header'),
            initials: parent_doc.get('initials'),
            body: options.docs.max_post_size?document.get('body').substr(0, options.docs.max_post_size):document.get('body')
          });
          break;
      }
      //update parent (breadcrumb and parent type)
      document.setParentDocument(parent_doc);
      //set timestamps
      var now = Date.now();
      document.set({
        created: now,
        updated: now
      });
      //escape document
      document.escape();
      //process plugins
      var plugin_payload = {
        app_id: app_id,
        document: document,
        user: user
      };
      plugins.add(plugin_payload, function(err, plugin_payload) {
        document = plugin_payload.document || document;
        if (plugin_payload.storage_noop) {
          socket.emit('fruum:add', document.toJSON());
          if (!plugin_payload.broadcast_noop) self.broadcast(user, document);
          return;
        }
        //count number of child documents
        storage.count_attributes(app_id, { parent: parent_doc.get('id') }, function(total) {
          storage.add(app_id, document, function(new_document) {
            if (new_document) {
              //success
              self.invalidateDocument(app_id, new_document);
              self.invalidateDocument(app_id, parent_doc);
              socket.emit('fruum:add', new_document.toJSON());
              if (!plugin_payload.broadcast_noop) {
                self.broadcast(user, new_document);
                self.broadcast(user, parent_doc, 'fruum:info');
                self.broadcastNotifications(user, new_document);
              }
              //update parent counter`
              storage.update(app_id, parent_doc, {
                updated: now,
                children_count: total + 1
              }, function() {});
              //if document is article and blog then set the order to be on top
              if (new_document.get('type') == 'article' && new_document.get('is_blog')) {
                //get all children
                new_document.set('order', 1);
                storage.children(app_id, parent_doc, function(children) {
                  var collection = new Backbone.Collection();
                  collection.comparator = 'order';
                  collection.add(new_document.toJSON());
                  _.each(children, function(child) {
                    if (child.get('type') == 'article' && child.get('id') != new_document.get('id'))
                      collection.add(child.toJSON());
                  });
                  //reorder
                  var order = 1;
                  collection.each(function(child) {
                    if (child.get('id') != new_document.get('id')) {
                      order++;
                      child.set('order', order);
                    }
                    storage.update(app_id, child, { order: child.get('order') }, function(updated_child) {
                      if (updated_child) {
                        self.broadcast(user, updated_child);
                      }
                    });
                  });
                });
              }
            }
            else {
              //fail
              socket.emit('fruum:add');
            }
          });
        });
      });
    });
  }

  // --------------------------------- UPDATE ----------------------------------

  self.update = function(socket, payload) {
    if (!self.validatePayloadID(socket, payload, 'update')) return;
    var app_id = socket.app_id,
        user = socket.fruum_user,
        document = new Models.Document(payload);
    if (user.get('anonymous')) {
      logger.error(app_id, 'update_anonymous_noperm', user);
      socket.emit('fruum:update');
      return;
    }
    if (!document.isValid()) {
      logger.error(app_id, 'update_invalid_doc', document);
      logger.error(app_id, 'validation_error:', document.validationError);
      socket.emit('fruum:update');
      return;
    }
    storage.get(app_id, document.get('id'), function(doc_to_update) {
      if (!doc_to_update) {
        logger.error(app_id, 'update_doc_does_not_exist', document);
        socket.emit('fruum:update');
        return;
      }
      if (doc_to_update.get('type') == 'category' && !user.get('admin')) {
        logger.error(app_id, 'update_category_noperm', user);
        socket.emit('fruum:update');
        return;
      }
      if (doc_to_update.get('type') == 'article' && !user.get('admin')) {
        logger.error(app_id, 'update_article_noperm', user);
        socket.emit('fruum:update');
        return;
      }
      if (!user.get('admin') && doc_to_update.get('user_id') != user.get('id')) {
        logger.error(app_id, 'update_noperm', user);
        socket.emit('fruum:update');
        return;
      }
      //escape document based on difference with previous
      var update_timestamp = false, now = Date.now();
      document.escape(doc_to_update);
      //alter timestamp only when we have changes in the body
      if (document.get('body') != doc_to_update.get('body')) {
        update_timestamp = true;
        doc_to_update.set('updated', now);
      }
      switch(doc_to_update.get('type')) {
        case 'category':
          doc_to_update.set({
            initials: document.get('initials'),
            header: document.get('header'),
            body: document.get('body')
          });
          break;
        case 'article':
          doc_to_update.set({
            header: document.get('header'),
            body: document.get('body'),
            is_blog: document.get('is_blog'),
            tags: document.get('tags'),
            attachments: document.get('attachments')
          });
          break;
        case 'thread':
          doc_to_update.set({
            header: document.get('header'),
            body: document.get('body'),
            tags: document.get('tags'),
            attachments: document.get('attachments')
          });
          break;
        case 'channel':
          doc_to_update.set({
            header: document.get('header')
          });
          break;
        case 'post':
          doc_to_update.set({
            body: document.get('body'),
            attachments: document.get('attachments')
          });
          break;
      }
      //process plugins
      var plugin_payload = {
        app_id: app_id,
        document: doc_to_update,
        user: user
      };
      plugins.update(plugin_payload, function(err, plugin_payload) {
        doc_to_update = plugin_payload.document || doc_to_update;
        if (plugin_payload.storage_noop) {
          socket.emit('fruum:update', doc_to_update.toJSON());
          if (!plugin_payload.broadcast_noop) self.broadcast(user, doc_to_update);
          return;
        }
        storage.update(app_id, doc_to_update, null, function(updated_document) {
          if (updated_document) {
            self.invalidateDocument(app_id, updated_document);
            socket.emit('fruum:update', updated_document.toJSON());
            if (!plugin_payload.broadcast_noop) self.broadcast(user, updated_document);
            //update parent timestamp
            if (update_timestamp) {
              storage.update(
                app_id,
                new Models.Document({ id: updated_document.get('parent') }),
                { updated: now },
                function() {}
              );
            }
          }
          else {
            socket.emit('fruum:update');
          }
        });
      });
    });
  }

  // --------------------------- UPDATE FIELD ----------------------------------

  self.field = function(socket, payload) {
    if (!self.validatePayloadID(socket, payload, 'field')) return;
    var app_id = socket.app_id,
        id = payload.id,
        user = socket.fruum_user;
    if (!user.get('admin')) {
      logger.error(app_id, 'field_category_noperm', user);
      socket.emit('fruum:field');
      return;
    }
    storage.get(app_id, id, function(document) {
      if (!document) {
        logger.error(app_id, 'field_invalid_doc', '' + id);
        socket.emit('fruum:field');
        return;
      }
      if (document.attributes[payload.field] === undefined || payload.value === undefined) {
        logger.error(app_id, 'field_invalid_field', '' + id);
        socket.emit('fruum:field');
        return;
      }
      var attributes = {};
      attributes[payload.field] = payload.value;
      if (payload.field == 'visible') {
        storage.update_subtree(app_id, document, attributes, function(updated_document) {
          if (updated_document) {
            self.invalidateDocument(app_id, updated_document);
            socket.emit('fruum:field', updated_document.toJSON());
            self.broadcast(user, updated_document, 'fruum:dirty', true);
          }
          else {
            socket.emit('fruum:field');
          }
        });
      }
      else {
        storage.update(app_id, document, attributes, function(updated_document) {
          if (updated_document) {
            self.invalidateDocument(app_id, updated_document);
            socket.emit('fruum:field', updated_document.toJSON());
            self.broadcast(user, updated_document);
          }
          else {
            socket.emit('fruum:field');
          }
        });
      }
    });
  }
}
