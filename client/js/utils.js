/******************************************************************************
Utilities
*******************************************************************************/

(function() {
  'use strict';
  window.Fruum.require.push(function () {
    var marked = Fruum.libs.marked,
        _ = Fruum.libs._,
        $ = Fruum.libs.$;

    //Make Marionette itemviews work without the parent div
    Fruum.utils.marionette_itemview_without_tag = function(view) {
      return view.extend({
        onRender: function() {
          this.$el = this.$el.children();
          this.$el.unwrap();
          this.setElement(this.$el);
        }
      });
    }
    //Item view with fade transition
    Fruum.utils.marionette_itemview_transition = function(view) {
      return view.extend({
        onBeforeAttach: function(){
          this.$el.hide();
        },
        onAttach: function() {
          if (this.__delay_transition) this.$el.delay(this.__delay_transition);
          this.$el.fadeIn('fast');
        }
      });
    }
    //Check if string is url
    Fruum.utils.isLink = function(url) {
      url = (url || '').trim().toLowerCase();
      return url.indexOf('http://') == 0 || url.indexOf('https://') == 0;
    }
    //Get initials from username
    Fruum.utils.getInitials = function(name) {
      name = (name || '').toUpperCase().split(' ');
      var response = '';
      for (var i = 0; i < name.length; ++i) {
        if (name[i]) response += name[i][0];
      }
      return response;
    }
    //Print initials
    Fruum.utils.printInitials = function(initials) {
      return (initials || '').toUpperCase();
    }
    //Print tags
    Fruum.utils.tagify = function(text) {
      return text.replace(/\[(.*?)\]/g, function(a,b) {
        return '<span class="fruum-tag" data-initials="' + b.toUpperCase()[0] + '">' + b + '</span>';
      });
    }
    //Markdown display
    Fruum.utils.print = function(post) {
      //remove escaping of > and ` used by markdown
      post = (post || '').replace(/&gt;/g, '>').replace(/&#x60;/g, '`');
      //process post through plugins
      post = Fruum.utils.chain(Fruum.processors.post, post);
      //emoji processing
      post = Fruum.emoji.convert(post);
      return marked(post);
    }
    Fruum.utils.printHeader = function(text) {
      //emojify
      text = Fruum.emoji.convert(_.escape(text || ''));
      //tagify
      text = Fruum.utils.tagify(text);
      return text;
    }
    Fruum.utils.permaLink = function(doc_id) {
      return Fruum.application.fullpage_url + '#!v/' + doc_id;
    }
    Fruum.utils.printSummary = function(text) {
      text = Fruum.utils.print(text).
        replace(/(<h[123456]\b[^>]*>)[^<>]*(<\/h[123456]>)/gi, '').
        replace(/<(?:.|\n)*?>/gm, '');
      if (text.length > 170)
        text = text.substr(0, 170) + '...';
      return text;
    }
    //If computer is mac
    Fruum.utils.isMac = function() {
      return (navigator.platform || '').match(/(Mac|iPhone|iPod|iPad)/i)?true:false;
    }
    //print shortcut using mac/win modifier
    Fruum.utils.shortcutModifier = function(key) {
      return (Fruum.utils.isMac()?'CMD':'CTRL') + '+' + key;
    }
    //chain execute array of functions
    Fruum.utils.chain = function(fn_array, data, params) {
      //process post through plugins
      if (fn_array.length) {
        _.each(fn_array, function(fn) {
          data = fn(data, params);
        });
      }
      return data;
    }
    //session storage
    Fruum.utils.sessionStorage = function(key, value) {
      if (window.sessionStorage &&
          window.sessionStorage.setItem &&
          window.sessionStorage.getItem)
      {
        try {
          if (value != undefined) window.sessionStorage.setItem(key, value);
          else return window.sessionStorage.getItem(key);
        }
        catch(err) {}
      }
    },
    //move categories/articles up/down
    Fruum.utils.orderUp = function(model, top) {
      if (!model || !model.collection) return;
      var collection = model.collection;
      var index = collection.models.indexOf(model);
      if (index <= 0) return;
      if (top) {
        var reorder = [{
          id: model.get('id'),
          order: 1
        }], order = 1;
        collection.each(function(m) {
          if (m != model) {
            order++;
            reorder.push({
              id: m.get('id'),
              order: order
            });
          }
        });
        _.each(reorder, function(entry) {
          Fruum.io.trigger('fruum:field', {
            id: entry.id, field: 'order', value: entry.order
          });
        });
      }
      else {
        var prev_model = collection.models[index - 1];
        Fruum.io.trigger('fruum:field', {
          id: model.get('id'), field: 'order', value: prev_model.get('order')
        });
        Fruum.io.trigger('fruum:field', {
          id: prev_model.get('id'), field: 'order', value: model.get('order')
        });
      }
    },
    Fruum.utils.orderDown = function(model, bottom) {
      if (!model || !model.collection) return;
      var collection = model.collection;
      var index = collection.models.indexOf(model);
      if (index + 1 >= collection.models.length) return;
      if (bottom) {
        var reorder = [], order = 0;
        collection.each(function(m) {
          if (m != model) {
            order++;
            reorder.push({
              id: m.get('id'),
              order: order
            });
          }
        });
        order++;
        reorder.push({
          id: model.get('id'),
          order: order
        });
        _.each(reorder, function(entry) {
          Fruum.io.trigger('fruum:field', {
            id: entry.id, field: 'order', value: entry.order
          });
        });
      }
      else {
        var next_model = collection.models[index + 1];
        Fruum.io.trigger('fruum:field', {
          id: model.get('id'), field: 'order', value: next_model.get('order')
        });
        Fruum.io.trigger('fruum:field', {
          id: next_model.get('id'), field: 'order', value: model.get('order')
        });
      }
    }
  });
})();
