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
    if (!self.validatePayloadID(socket, null, 'add')) {
      self.fail(payload);
      return;
    }
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
      self.fail(payload);
      return;
    }
    if (!document.isValid()) {
      logger.error(app_id, 'add_invalid_doc', document);
      logger.error(app_id, 'validation_error:', document.validationError);
      socket.emit('fruum:add');
      self.fail(payload);
      return;
    }
    if (!user.get('admin') && _.contains(['category', 'article', 'blog', 'bookmark'], document.get('type'))) {
      logger.error(app_id, 'add_' + document.get('type') + '_noperm', user);
      socket.emit('fruum:add');
      self.fail(payload);
      return;
    }
    //get parent
    storage.get(app_id, document.get('parent'), function(parent_doc) {
      if (!parent_doc) {
        logger.error(app_id, 'add_noparent', document);
        socket.emit('fruum:add');
        self.fail(payload);
        return;
      }
      var is_valid = false, parent_type = parent_doc.get('type');
      switch(document.get('type')) {
        case 'category':
          is_valid = (parent_type == 'category');
          break;
        case 'bookmark':
          is_valid = (parent_type == 'category');
          break;
        case 'thread':
          is_valid = (parent_type == 'category' && parent_doc.get('usage') == 0);
          break;
        case 'article':
          is_valid = (parent_type == 'category' && parent_doc.get('usage') == 1);
          break;
        case 'blog':
          is_valid = (parent_type == 'category' && parent_doc.get('usage') == 2);
          break;
        case 'post':
          is_valid = (_.contains(['article', 'blog', 'thread', 'channel'], parent_type) &&
                      !parent_doc.get('locked'));
          break;
        case 'channel':
          is_valid = (parent_type == 'category' && parent_doc.get('usage') == 3);
          break;
      }
      //check permissions
      is_valid = is_valid && (parent_doc.get('permission') <= user.get('permission'));
      if (!is_valid) {
        logger.error(app_id, 'add_invalid_parent_perm', document);
        socket.emit('fruum:add');
        self.fail(payload);
        return;
      }
      //conform to document constraints
      switch (document.get('type')) {
        case 'bookmark':
          document.set({
            header: options.docs.max_bookmark_title_size?document.get('header').substr(0, options.docs.max_bookmark_title_size):document.get('header')
          });
          break;
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
        case 'blog':
          //update fields (denormalization for search)
          document.set({
            initials: parent_doc.get('initials'),
            header: options.docs.max_blog_title_size?document.get('header').substr(0, options.docs.max_blog_title_size):document.get('header'),
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
      plugins.beforeAdd(plugin_payload, function(err, plugin_payload) {
        document = plugin_payload.document || document;
        if (plugin_payload.storage_noop) {
          socket.emit('fruum:add', document.toJSON());
          if (!plugin_payload.broadcast_noop) self.broadcast(user, document);
          self.success(payload);
          return;
        }
        storage.add(app_id, document, function(new_document) {
          if (new_document) {
            //success
            if (new_document.get('parent_type') != 'channel') {
              self.refreshChildrenCount(app_id, new_document.get('parent'), function() {
                self.refreshUpdateTS(app_id, new_document.get('parent'), now, user);
              });
            }
            self.invalidateDocument(app_id, new_document);
            socket.emit('fruum:add', new_document.toJSON());
            if (!plugin_payload.broadcast_noop) {
              self.broadcast(user, new_document);
              self.broadcastNotifications(user, new_document);
            }
            plugin_payload.document = new_document;
            plugins.afterAdd(plugin_payload, function() {
              self.success(payload);
            });
          }
          else {
            //fail
            socket.emit('fruum:add');
            self.fail(payload);
          }
        });
      });
    });
  }

  // --------------------------------- UPDATE ----------------------------------

  self.update = function(socket, payload) {
    if (!self.validatePayloadID(socket, payload, 'update')) {
      self.fail(payload);
      return;
    }
    var app_id = socket.app_id,
        user = socket.fruum_user,
        document = new Models.Document(payload);
    if (user.get('anonymous')) {
      logger.error(app_id, 'update_anonymous_noperm', user);
      socket.emit('fruum:update');
      self.fail(payload);
      return;
    }
    if (!document.isValid()) {
      logger.error(app_id, 'update_invalid_doc', document);
      logger.error(app_id, 'validation_error:', document.validationError);
      socket.emit('fruum:update');
      self.fail(payload);
      return;
    }
    storage.get(app_id, document.get('id'), function(doc_to_update) {
      if (!doc_to_update) {
        logger.error(app_id, 'update_doc_does_not_exist', document);
        socket.emit('fruum:update');
        self.fail(payload);
        return;
      }
      if (!user.get('admin') && _.contains(['category', 'bookmark', 'article', 'blog'], doc_to_update.get('type'))) {
        logger.error(app_id, 'update_' + doc_to_update.get('type') + '_noperm', user);
        socket.emit('fruum:update');
        self.fail(payload);
        return;
      }
      if (!user.get('admin') && doc_to_update.get('user_id') != user.get('id')) {
        logger.error(app_id, 'update_noperm', user);
        socket.emit('fruum:update');
        self.fail(payload);
        return;
      }
      //escape document based on difference with previous
      var update_timestamp = false,
          update_permission = false,
          now = Date.now();
      document.escape(doc_to_update);
      //alter timestamp only when we have changes in the body
      if (document.get('body') != doc_to_update.get('body')) {
        update_timestamp = true;
        doc_to_update.set('updated', now);
      }
      switch(doc_to_update.get('type')) {
        case 'bookmark':
          doc_to_update.set({
            header: options.docs.max_bookmark_title_size?document.get('header').substr(0, options.docs.max_bookmark_title_size):document.get('header'),
            body: document.get('body')
          });
          break;
        case 'category':
          update_permission = (doc_to_update.get('permission') != document.get('permission'));
          doc_to_update.set({
            initials: document.get('initials'),
            usage: document.get('usage'),
            permission: document.get('permission'),
            header: options.docs.max_category_title_size?document.get('header').substr(0, options.docs.max_category_title_size):document.get('header'),
            body: options.docs.max_category_description_size?document.get('body').substr(0, options.docs.max_category_description_size):document.get('body')
          });
          break;
        case 'article':
          doc_to_update.set({
            header: options.docs.max_article_title_size?document.get('header').substr(0, options.docs.max_article_title_size):document.get('header'),
            body: options.docs.max_post_size?document.get('body').substr(0, options.docs.max_post_size):document.get('body'),
            tags: document.get('tags'),
            attachments: document.get('attachments')
          });
          break;
        case 'blog':
          doc_to_update.set({
            header: options.docs.max_blog_title_size?document.get('header').substr(0, options.docs.max_blog_title_size):document.get('header'),
            body: options.docs.max_post_size?document.get('body').substr(0, options.docs.max_post_size):document.get('body'),
            tags: document.get('tags'),
            attachments: document.get('attachments')
          });
          break;
        case 'thread':
          doc_to_update.set({
            header: options.docs.max_thread_title_size?document.get('header').substr(0, options.docs.max_thread_title_size):document.get('header'),
            body: options.docs.max_post_size?document.get('body').substr(0, options.docs.max_post_size):document.get('body'),
            tags: document.get('tags'),
            attachments: document.get('attachments')
          });
          break;
        case 'channel':
          doc_to_update.set({
            header: options.docs.max_channel_name_size?document.get('header').substr(0, options.docs.max_channel_name_size):document.get('header')
          });
          break;
        case 'post':
          doc_to_update.set({
            body: options.docs.max_post_size?document.get('body').substr(0, options.docs.max_post_size):document.get('body'),
            attachments: document.get('attachments')
          });
          break;
      }
      //check for moving bookmark around
      if (doc_to_update.get('type') == 'bookmark' &&
          doc_to_update.get('parent') != document.get('parent'))
      {
        self.delete(socket, _.extend(_.clone(payload), {
          _success: function() {
            self.add(socket, payload);
          }
        }));
      }
      else {
        //process plugins
        var plugin_payload = {
          app_id: app_id,
          document: doc_to_update,
          user: user
        };
        plugins.beforeUpdate(plugin_payload, function(err, plugin_payload) {
          doc_to_update = plugin_payload.document || doc_to_update;
          if (plugin_payload.storage_noop) {
            socket.emit('fruum:update', doc_to_update.toJSON());
            if (!plugin_payload.broadcast_noop) self.broadcast(user, doc_to_update);
            self.success(payload);
            return;
          }
          storage.update(app_id, doc_to_update, null, function(updated_document) {
            if (updated_document) {
              self.invalidateDocument(app_id, updated_document);
              socket.emit('fruum:update', updated_document.toJSON());
              if (!plugin_payload.broadcast_noop) self.broadcast(user, updated_document);
              plugin_payload.document = updated_document;
              plugins.afterUpdate(plugin_payload, function() {});
              //update parent timestamp
              if (update_timestamp) {
                storage.update(
                  app_id,
                  new Models.Document({ id: updated_document.get('parent') }),
                  { updated: now },
                  function() {}
                );
              }
              if (update_permission) {
                storage.update_subtree(app_id, updated_document, {
                  permission: updated_document.get('permission')
                }, function(updated_document2) {
                  if (updated_document2) {
                    self.invalidateDocument(app_id, updated_document2);
                    socket.emit('fruum:field', updated_document2.toJSON());
                    self.broadcast(user, updated_document2, 'fruum:dirty', true);
                    self.success(payload);
                  }
                  else {
                    socket.emit('fruum:field');
                    self.fail(payload);
                  }
                });
              }
              else self.success(payload);
            }
            else {
              socket.emit('fruum:update');
              self.fail(payload);
            }
          });
        });
      }
    });
  }

  // --------------------------- UPDATE FIELD ----------------------------------

  self.field = function(socket, payload) {
    if (!self.validatePayloadID(socket, payload, 'field')) {
      self.fail(payload);
      return;
    }
    var app_id = socket.app_id,
        id = payload.id,
        user = socket.fruum_user;
    if (!user.get('admin')) {
      logger.error(app_id, 'field_category_noperm', user);
      socket.emit('fruum:field');
      self.fail(payload);
      return;
    }
    storage.get(app_id, id, function(document) {
      if (!document) {
        logger.error(app_id, 'field_invalid_doc', '' + id);
        socket.emit('fruum:field');
        self.fail(payload);
        return;
      }
      if (document.attributes[payload.field] === undefined || payload.value === undefined) {
        logger.error(app_id, 'field_invalid_field', '' + id);
        socket.emit('fruum:field');
        self.fail(payload);
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
            self.success(payload);
          }
          else {
            socket.emit('fruum:field');
            self.fail(payload);
          }
        });
      }
      else {
        storage.update(app_id, document, attributes, function(updated_document) {
          if (updated_document) {
            self.invalidateDocument(app_id, updated_document);
            socket.emit('fruum:field', updated_document.toJSON());
            self.broadcast(user, updated_document);
            self.success(payload);
          }
          else {
            socket.emit('fruum:field');
            self.fail(payload);
          }
        });
      }
    });
  }
}
