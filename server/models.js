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
    root_path = path.resolve(__dirname + '/..');

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
    //category, thread, article, post, channel
    type: '',
    //creation date in unix timestamp
    created: 0,
    //last update date in unix timestamp
    updated: 0,
    //category initials
    initials: '',
    //header e.g. category or thread or article title
    header: '',
    //body e.g. description or post message
    body: '',
    //if thread is sticky
    sticky: false,
    //if article is a blogpost
    is_blog: false,
    //permissions
    locked: false,
    visible: true,
    allow_threads: true,
    allow_channels: true,
    inappropriate: false,
    //denormalized author details
    user_id: '',
    user_username: '',
    user_displayname: '',
    user_avatar: '',
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
  extractTags: function() {
    var extracted = (this.get('header') || '').match(/\[(.*?)\]/g);
    //validate tags
    var tags = [];
    _.each(extracted, function(tag) {
      if (tag && tag[0] == '[' && tag[tag.length - 1] == ']')
        tags.push(tag.substr(1, tag.length - 2));
    });
    this.set('tags', tags);
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
  toLog: function() {
    var log = '[user] id:' + this.get('id');
    if (this.get('admin')) {
      log += ' (admin)'
    }
    if (this.get('anonymous')) {
      log += ' (anonymous)'
    }
    else {
      log += ' username:' + this.get('username');
      log += ' displayname:' + this.get('displayname');
      log += ' email:' + this.get('email');
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
    //notifications email
    notifications_email: '',
    //contact email
    contact_email: '',
    //custom theme style
    theme: '',
    //tier level
    tier: '',
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
  toLog: function() {
    var log = '[app] id:' + this.get('id');
    log += ' name:' + this.get('name');
    log += ' url:' + this.get('url');
    log += ' auth_url:' + this.get('auth_url');
    log += ' fullpage_url:' + this.get('fullpage_url');
    log += ' notifications_email:' + this.get('notifications_email');
    log += ' contact_email:' + this.get('contact_email');
    log += ' tier:' + this.get('tier');
    log += ' theme:' + this.get('theme');
    log += ' private_key:' + this.get('private_key');
    log += ' api_keys:' + this.get('api_keys').length;
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
  }
});

module.exports = {
  //models
  Application: Application,
  Document: Document,
  User: User
};
