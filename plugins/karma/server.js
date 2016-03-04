/******************************************************************************
  Karma plugin
*******************************************************************************/

var _ = require('underscore'),
    logger = require('../../server/logger');

function Karma(options, instance) {

  options.karma = options.karma || {};
  options.karma.added_category = options.karma.added_category || 0;
  options.karma.added_thread = options.karma.added_thread || 0;
  options.karma.added_article = options.karma.added_article || 0;
  options.karma.added_blog = options.karma.added_blog || 0;
  options.karma.added_channel = options.karma.added_channel || 0;
  options.karma.got_reply = options.karma.got_reply || 0;
  options.karma.replied = options.karma.replied || 0;
  options.karma.got_react_up = options.karma.got_react_up || 0;
  options.karma.got_react_down = options.karma.got_react_down || 0;
  options.karma.got_inappropriate = options.karma.got_inappropriate || 0;

  function add_karma(app_id, user_id, karma) {
    if (!karma) return;
    instance.storage.get_user(app_id, user_id, function(user) {
      if (!user) {
        logger.error(app_id, 'karma_invalid_user_id', user_id);
        return;
      }
      else {
        user.set('karma', user.get('karma') + karma);
        instance.storage.update_user(app_id, user, { karma: user.get('karma') }, function(updated_user) {
          if (updated_user) {
            logger.info(app_id, 'karma', user);
            //notify user for karma change
            var u = instance.engine.findOnlineUser(app_id, user_id);
            if (u && u.get('socket')) {
              u.set('karma', user.get('karma'));
              u.get('socket').emit('fruum:karma', { karma: user.get('karma') });
            }
          }
          else {
            logger.error(app_id, 'karma_fail_update', user);
          }
        });
      }
    });
  }

  this.afterAdd = function(payload, callback) {
    callback(null, payload);

    instance.storage.get(payload.app_id, payload.document.get('parent'), function(parent_doc) {
      if (!parent_doc) return;
      var karma = 0;
      switch(payload.document.get('type')) {
        case 'category':
          karma = options.karma.added_category;
          break;
        case 'thread':
          karma = options.karma.added_thread;
          break;
        case 'article':
          karma = options.karma.added_article;
          break;
        case 'blog':
          karma = options.karma.added_blog;
          break;
        case 'channel':
          karma = options.karma.added_channel;
          break;
        case 'post':
          karma = options.karma.replied;
          if (parent_doc.get('user_id') != payload.user.get('id')) {
            add_karma(payload.app_id, parent_doc.get('user_id'), options.karma.got_reply);
          }
          break;
      }
      add_karma(payload.app_id, payload.user.get('id'), karma);
    });
  }

  this.afterField = function(payload, callback) {
    callback(null, payload);
    if (payload.document.get('user_id') != payload.user.get('id') &&
        payload.field == 'inappropriate')
    {
      add_karma(
        payload.app_id,
        payload.document.get('user_id'),
        options.karma.got_inappropriate * (payload.value?1:-1));
    }
  }

  this.afterReact = function(payload, callback) {
    callback(null, payload);

    if (payload.document.get('user_id') != payload.user.get('id')) {
      var karma = 0;
      switch(payload.reaction) {
        case 'up':
          karma = options.karma.got_react_up;
          if (payload.balance == 0)
            karma -= options.karma.got_react_down;
          else
            karma *= payload.balance;
          break;
        case 'down':
          karma = options.karma.got_react_down;
          if (payload.balance == 0)
            karma -= options.karma.got_react_up;
          else
            karma *= payload.balance;
          break;
      }
      add_karma(payload.app_id,
                payload.document.get('user_id'),
                karma);
    }
  }

}

module.exports = Karma;
