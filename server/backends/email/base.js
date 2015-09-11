/******************************************************************************
  Root class for email backends
*******************************************************************************/

'use strict';

module.exports = function(options) {
  //send a message to a user.
  //message is { subject: '', html: '', text: '' }
  this.send = function(application, user, message, callback) { callback(); }
  //notify administrators that a user flagged a document as inappropriate
  this.inappropriate_notify = function(application, document, reporter, administrators, callback) { callback(); }
}
