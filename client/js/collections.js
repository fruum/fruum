/******************************************************************************
Collections
*******************************************************************************/

(function() {
  'use strict';
  window.Fruum.require.push(function () {
    var Backbone = Fruum.libs.Backbone;
    //collections
    Fruum.collections.Categories = Backbone.Collection.extend({
      model: Fruum.models.Document,
      comparator: 'order'
    });
    Fruum.collections.Threads = Backbone.Collection.extend({
      model: Fruum.models.Document,
      comparator: function(a, b) {
        return (b.get('sticky') - a.get('sticky')) ||
               (b.get('updated') - a.get('updated'));
      }
    });
    Fruum.collections.Articles = Backbone.Collection.extend({
      model: Fruum.models.Document,
      comparator: 'order'
    });
    Fruum.collections.Channels = Backbone.Collection.extend({
      model: Fruum.models.Document,
      comparator: 'header'
    });
    Fruum.collections.Posts = Backbone.Collection.extend({
      model: Fruum.models.Document,
      comparator: 'created'
    });
    Fruum.collections.Search = Backbone.Collection.extend({
      model: Fruum.models.Document
    });
    Fruum.collections.Notifications = Backbone.Collection.extend({
      model: Fruum.models.Document
    });
  });
})();
