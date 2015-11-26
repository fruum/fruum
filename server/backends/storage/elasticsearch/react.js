/******************************************************************************
 Document reactions
*******************************************************************************/

'use strict';

var _ = require('underscore'),
    logger = require('../../../logger');

var valid_reactions = ['up', 'down'];

module.exports = function(options, client, self) {

  self.react = function(app_id, document, user, reaction, callback) {
    var username = user.get('username'),
        attributes = {};

    //check if reaction is already registered for that user
    var reaction_list = document.get('react_' + reaction),
        has_reaction = false;
    if (reaction_list && reaction_list.indexOf(username) >= 0) {
      has_reaction = true;
    }

    //remove from previous reactions
    _.each(valid_reactions, function(entry) {
      var field = 'react_' + entry,
          list = document.get(field);
      if (!list) return;
      list = _.without(list, username);
      if (entry === reaction && !has_reaction) {
        list.push(username);
      }
      document.set(field, list);
      attributes[field] = list;
    });
    logger.info(app_id, 'update_reaction_' + reaction + ':' + document.get('id'), user);
    self.update(app_id, document, attributes, callback);
  }

}
