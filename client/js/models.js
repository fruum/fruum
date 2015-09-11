/******************************************************************************
Models
*******************************************************************************/

(function() {
  'use strict';
  window.Fruum.require.push(function () {
    var _ = Fruum.libs._;
    var Backbone = Fruum.libs.Backbone;
    //Document
    Fruum.models.Document = Backbone.Model.extend({
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
        //category or thread initials
        initials: '',
        //header e.g. category or thread/channel title
        header: '',
        //body e.g. description or post message
        body: '',
        //if category/thread is sticky
        sticky: false,
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
        //metadata
        meta: {}
      }
    });
    //UI state
    Fruum.models.UIState = Backbone.Model.extend({
      defaults: {
        breadcrumb: [],
        viewing: {},
        editing: {},
        online: {},

        total_entries: 0,
        viewing_from: 0,
        viewing_to: 0,

        search: '',
        loading: '',

        interacting: false,
        searching: false,
        visible: false,

        navigation_height: 0,
        interactions_height: 0,
        content_height: 0,
        panel_height: 0
      }
    });
    //User
    Fruum.user = {
      anonymous: true,
      admin: false
    };
    Fruum.userUtils = {
      watch: function(docid) {
        if (!docid) return;
        Fruum.user.watch = Fruum.user.watch || [];
        if (Fruum.user.watch.indexOf(docid) < 0)
          Fruum.user.watch.push(docid);
      },
      unwatch: function(docid) {
        if (!docid || !Fruum.user.watch) return;
        var index = Fruum.user.watch.indexOf(docid);
        if (index >= 0) Fruum.user.watch.splice(index, 1);
      },
      isWatching: function(docid) {
        return Fruum.user.watch && Fruum.user.watch.indexOf(docid) >= 0;
      }
    }
    //Application details
    Fruum.application = {
      fullpage_url: ''
    }
    //Cross view communication channel
    Fruum.io = _.clone(Backbone.Events);
  });
})();
