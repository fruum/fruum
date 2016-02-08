/******************************************************************************
  Models
*******************************************************************************/

'use strict';

var _ = require('underscore'),
    Backbone = require('backbone'),
    marked = require('marked'),
    xss = require('xss'),
    request = require('request'),
    path = require('path'),
    fs = require('fs'),
    moment = require('moment'),
    root_path = path.resolve(__dirname + '/..'),
    PROPERTY_PREFIX = 'prop_';

// --------------------------------- DOCUMENT ---------------------------------

var Document = Backbone.Model.extend({
  defaults: {
    //document id
    id: '',
    //breadcrumb path
    breadcrumb: [],
    //document parent id
    parent: '',
    //document parent type
    parent_type: '',
    //category, thread, article, blog, post, bookmark, channel
    type: '',
    //creation date in unix timestamp
    created: 0,
    //last update date in unix timestamp
    updated: 0,
    //category initials
    initials: '',
    //header e.g. category or thread or article title
    header: '',
    //body e.g. description or post message or bookmark search query
    body: '',
    //if thread is sticky
    sticky: false,
    //permissions
    locked: false,
    visible: true,
    inappropriate: false,
    //0: everyone, 1: logged-in, 2: admins
    permission: 0,
    //0: discussion, 1: helpdesk, 2: blog, 3: chat, 4: categories
    usage: 0,
    //denormalized author details
    user_id: '',
    user_username: '',
    user_displayname: '',
    user_avatar: '',
    //reactions (array of usernames)
    react_up: [],
    react_down: [],
    //order
    order: 0,
    //total number of children
    children_count: 0,
    //if document is marked for deletion
    archived: false,
    //archived date unix timestamp
    archived_ts: 0,
    //tags
    tags: [],
    //attachments, array of [{ name: '', type: 'image', data: 'base64' }, ..]
    attachments: [],
    //metadata
    meta: {}
  },
  //escape document field, with optional change comparator
  escape: function(comparator) {
    var body = this.get('body') || '';
    if (comparator && comparator.get('body') === body) return;
    //find code blocks
    body = body.replace(/```([^`]+)```/g, function(a, b) { return '```' + _.escape(b) + '```'; });
    body = xss(body, {
      whiteList: {
        a: ['href', 'title', 'target'],
        code: []
      }
    });
    //revert code blocks
    body = body.replace(/```([^`]+)```/g, function(a, b) { return '```' + _.unescape(b) + '```'; });
    this.set('body', body);
  },
  //validates that all fields are there depending on document type
  validate: function(attrs, options) {
    //check for use of attributes other than default fields
    for (var key in attrs) {
      if (this.defaults[key] === undefined)
        return 'model contains unknown field: ' + key;
    }
    //parent must be always set for child documents
    if (!attrs.parent && attrs.id != 'home') return 'parent is not set';
    //a document cannot have its parent and id be the same
    if (attrs.id && attrs.parent == attrs.id) return 'id is same as parent';
    switch(attrs.type) {
      case 'category':
      case 'thread':
      case 'article':
      case 'blog':
      case 'bookmark':
      case 'channel':
        if (!attrs.header) return 'header cannot be empty';
        break;
      case 'post':
        if (!attrs.body) return 'body cannot be empty';
        break;
      default:
        return 'type is invalid';
    }
  },
  toLog: function() {
    var log = '[doc] [' + this.get('type') + ']';
    log += ' id:' + this.get('id');
    log += ' parent:' + this.get('parent');
    log += ' user_id:' + this.get('user_id');
    switch(this.get('type')) {
      case 'category':
        log += ' order:' + this.get('order')
        break;
    }
    return log;
  },
  toHome: function() {
    this.set({
      id: 'home',
      parent: null,
      breadcrumb: [],
      type: 'category',
      header: 'Home',
      initials: 'HOM'
    });
    return this;
  },
  isSearchable: function() {
    return this.get('visible') &&
           this.get('type') != 'channel' &&
           this.get('parent_type') != 'channel' &&
           !this.get('archived') &&
           !this.get('inappropriate');
  },
  toRobot: function() {
    var json = this.toJSON();
    //remove escaping of > and ` used by markdown
    json.body = (json.body || '').replace(/&gt;/g, '>').replace(/&#x60;/g, '`');
    json.body = marked(json.body);
    return json;
  },
  setParentDocument: function(parent_doc) {
    if (!parent_doc) return;
    //update breadcrumb
    var breadcrumb = (parent_doc.get('breadcrumb') || []).slice();
    breadcrumb.push(parent_doc.get('id'));
    this.set({
      breadcrumb: breadcrumb,
      parent: parent_doc.get('id'),
      parent_type: parent_doc.get('type'),
      visible: parent_doc.get('visible'),
      permission: Math.max(this.get('permission'), parent_doc.get('permission'))
    });
  }
});

// ----------------------------------- USER -----------------------------------

var User = Backbone.Model.extend({
  defaults: {
    //user id
    id: '',
    //logged in user?
    anonymous: true,
    //is admin?
    admin: false,
    //user details
    username: '',
    displayname: '',
    email: '',
    //link to avatar
    avatar: '',
    //creation date in unix timestamp
    created: 0,
    //last login date in unix timestamp
    last_login: 0,
    //last logout date in unix timestamp
    last_logout: 0,
    //onboard mask
    onboard: 0,
    //watch list of doc ids
    watch: [],
    //tags
    tags: [],
    //notifications
    notifications: [],
    //metadata
    meta: {}
  },
  setMeta: function(key, value) {
    var meta = this.get('meta') || {};
    meta[key] = value;
    this.set('meta', meta);
  },
  getMeta: function(key) {
    return (this.get('meta') || {})[key];
  },
  delMeta: function(key) {
    var meta = this.get('meta') || {};
    delete meta[key];
    this.set('meta', meta);
  },
  needsUpdate: function(user) {
    return this.get('username') != user.get('username') ||
           this.get('displayname') != user.get('displayname') ||
           this.get('email') != user.get('email') ||
           this.get('admin') != user.get('admin') ||
           this.get('avatar') != user.get('avatar');
  },
  toLog: function(humanize) {
    var log = '[user] id:' + this.get('id');
    var divider = humanize?'\n       ':' ';
    if (this.get('admin')) {
      log += divider + '(ADMIN)';
    }
    if (this.get('anonymous')) {
      log += divider + '(ANONYMOUS)';
    }
    else {
      log += divider + 'username:' + this.get('username');
      log += divider + 'displayname:' + this.get('displayname');
      log += divider + 'email:' + this.get('email');
    }
    if (humanize && this.get('last_login')) {
      log += divider + 'last_login:' + moment(this.get('last_login')).format('D-MMM-YYYY');
    }
    return log;
  }
});

// -------------------------------- APPLICATION --------------------------------

var Application = Backbone.Model.extend({
  defaults: {
    //app id
    id: '',
    //name
    name: '',
    //description
    description: '',
    //Website url
    url: '',
    //authentication url
    auth_url: '',
    //full page url,
    fullpage_url: '',
    //pushstate support
    pushstate: false,
    //notifications email
    notifications_email: '',
    //contact email
    contact_email: '',
    //custom theme style
    theme: '',
    //creation date in unix timestamp
    created: 0,
    //private key
    private_key: '',
    //api keys
    api_keys: [],
    //tags
    tags: [],
    //metadata
    meta: {}
  },
  getProperty: function(property) {
    return this.get(PROPERTY_PREFIX + property);
  },
  toLog: function(humanize) {
    var divider = humanize?'\n      ':' ';
    var log = '[app] id:' + this.get('id');
    log += divider + 'name:' + this.get('name');
    log += divider + 'url:' + this.get('url');
    log += divider + 'auth_url:' + this.get('auth_url');
    log += divider + 'fullpage_url:' + this.get('fullpage_url');
    log += divider + 'pushstate:' + this.get('pushstate');
    log += divider + 'notifications_email:' + this.get('notifications_email');
    log += divider + 'contact_email:' + this.get('contact_email');
    log += divider + 'theme:' + this.get('theme');
    log += divider + 'private_key:' + this.get('private_key');
    log += divider + 'api_keys:' + this.get('api_keys').length;
    if (humanize) {
      log += divider + 'meta:' + JSON.stringify(this.get('meta'));
    }
    return log;
  },
  //get sass override text from theme path
  getThemeSass: function(callback) {
    var theme = this.get('theme');
    //no theme
    if (!theme) {
      callback('');
    }
    //local theme
    else if (theme.indexOf('theme:') == 0) {
      theme = theme.replace('theme:', '');
      fs.readFile(root_path + '/themes/' + theme + '.scss', {encoding: 'utf8'}, function(err, data) {
        callback(data || '');
      });
    }
    //remote sass
    else if (theme.indexOf('http://') == 0 || theme.indexOf('https://') == 0) {
      request(theme, function(error, response, body) {
        if (!error && response.statusCode == 200) {
          callback(body);
        }
      });
    }
    //inline sass
    else {
      callback(theme);
    }
  },
  //prepare full page url for share links
  getShareURL: function(doc_id) {
    if (this.get('pushstate')) {
      var url = this.get('fullpage_url') || '';
      if (url.length && url[url.length - 1] !== '/')
        url += '/';
      return url + 'v/' + doc_id;
    }
    else {
      return this.get('fullpage_url') + '#v/' + doc_id;
    }
  }
});

module.exports = {
  //models
  Application: Application,
  Document: Document,
  User: User,
  PROPERTY_PREFIX: PROPERTY_PREFIX
};
