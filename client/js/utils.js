/******************************************************************************
Utilities
*******************************************************************************/

(function() {
  'use strict';
  window.Fruum.require.push(function () {
    var marked = Fruum.libs.marked,
        _ = Fruum.libs._;

    var at_user = ['@[.+-_0-9A-Za-z\xaa\xb5\xba\xc0-\xd6\xd8-\xf6',
      '\xf8-\u02c1\u02c6-\u02d1\u02e0-\u02e4\u02ec\u02ee\u0370-\u0374\u0376',
      '-\u0377\u037a-\u037d\u0386\u0388-\u038a\u038c\u038e-\u03a1\u03a3-',
      '\u03f5\u03f7-\u0481\u048a-\u0527\u0531-\u0556\u0559\u0561-\u0587\u05d0',
      '-\u05ea\u05f0-\u05f2\u0620-\u064a\u066e-\u066f\u0671-\u06d3\u06d5',
      '\u06e5-\u06e6\u06ee-\u06ef\u06fa-\u06fc\u06ff\u0710\u0712-\u072f\u074d',
      '-\u07a5\u07b1\u07ca-\u07ea\u07f4-\u07f5\u07fa\u0800-\u0815\u081a\u0824',
      '\u0828\u0840-\u0858\u08a0\u08a2-\u08ac\u0904-\u0939\u093d\u0950\u0958-',
      '\u0961\u0971-\u0977\u0979-\u097f\u0985-\u098c\u098f-\u0990\u0993-',
      '\u09a8\u09aa-\u09b0\u09b2\u09b6-\u09b9\u09bd\u09ce\u09dc-\u09dd\u09df-',
      '\u09e1\u09f0-\u09f1\u0a05-\u0a0a\u0a0f-\u0a10\u0a13-\u0a28\u0a2a-',
      '\u0a30\u0a32-\u0a33\u0a35-\u0a36\u0a38-\u0a39\u0a59-\u0a5c\u0a5e\u0a72',
      '-\u0a74\u0a85-\u0a8d\u0a8f-\u0a91\u0a93-\u0aa8\u0aaa-\u0ab0\u0ab2',
      '-\u0ab3\u0ab5-\u0ab9\u0abd\u0ad0\u0ae0-\u0ae1\u0b05-\u0b0c\u0b0f-',
      '\u0b10\u0b13-\u0b28\u0b2a-\u0b30\u0b32-\u0b33\u0b35-\u0b39\u0b3d\u0b5c',
      '-\u0b5d\u0b5f-\u0b61\u0b71\u0b83\u0b85-\u0b8a\u0b8e-\u0b90\u0b92-',
      '\u0b95\u0b99-\u0b9a\u0b9c\u0b9e-\u0b9f\u0ba3-\u0ba4\u0ba8-\u0baa\u0bae',
      '-\u0bb9\u0bd0\u0c05-\u0c0c\u0c0e-\u0c10\u0c12-\u0c28\u0c2a-\u0c33',
      '\u0c35-\u0c39\u0c3d\u0c58-\u0c59\u0c60-\u0c61\u0c85-\u0c8c\u0c8e-',
      '\u0c90\u0c92-\u0ca8\u0caa-\u0cb3\u0cb5-\u0cb9\u0cbd\u0cde\u0ce0-\u0ce1',
      '\u0cf1-\u0cf2\u0d05-\u0d0c\u0d0e-\u0d10\u0d12-\u0d3a\u0d3d\u0d4e\u0d60',
      '-\u0d61\u0d7a-\u0d7f\u0d85-\u0d96\u0d9a-\u0db1\u0db3-\u0dbb\u0dbd',
      '\u0dc0-\u0dc6\u0e01-\u0e30\u0e32-\u0e33\u0e40-\u0e46\u0e81-\u0e82',
      '\u0e84\u0e87-\u0e88\u0e8a\u0e8d\u0e94-\u0e97\u0e99-\u0e9f\u0ea1-\u0ea3',
      '\u0ea5\u0ea7\u0eaa-\u0eab\u0ead-\u0eb0\u0eb2-\u0eb3\u0ebd\u0ec0-\u0ec4',
      '\u0ec6\u0edc-\u0edf\u0f00\u0f40-\u0f47\u0f49-\u0f6c\u0f88-\u0f8c\u1000',
      '-\u102a\u103f\u1050-\u1055\u105a-\u105d\u1061\u1065-\u1066\u106e-',
      '\u1070\u1075-\u1081\u108e\u10a0-\u10c5\u10c7\u10cd\u10d0-\u10fa\u10fc-',
      '\u1248\u124a-\u124d\u1250-\u1256\u1258\u125a-\u125d\u1260-\u1288\u128a',
      '-\u128d\u1290-\u12b0\u12b2-\u12b5\u12b8-\u12be\u12c0\u12c2-\u12c5',
      '\u12c8-\u12d6\u12d8-\u1310\u1312-\u1315\u1318-\u135a\u1380-\u138f',
      '\u13a0-\u13f4\u1401-\u166c\u166f-\u167f\u1681-\u169a\u16a0-\u16ea',
      '\u1700-\u170c\u170e-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176c',
      '\u176e-\u1770\u1780-\u17b3\u17d7\u17dc\u1820-\u1877\u1880-\u18a8\u18aa',
      '\u18b0-\u18f5\u1900-\u191c\u1950-\u196d\u1970-\u1974\u1980-\u19ab',
      '\u19c1-\u19c7\u1a00-\u1a16\u1a20-\u1a54\u1aa7\u1b05-\u1b33\u1b45-',
      '\u1b4b\u1b83-\u1ba0\u1bae-\u1baf\u1bba-\u1be5\u1c00-\u1c23\u1c4d-',
      '\u1c4f\u1c5a-\u1c7d\u1ce9-\u1cec\u1cee-\u1cf1\u1cf5-\u1cf6\u1d00-',
      '\u1dbf\u1e00-\u1f15\u1f18-\u1f1d\u1f20-\u1f45\u1f48-\u1f4d\u1f50-',
      '\u1f57\u1f59\u1f5b\u1f5d\u1f5f-\u1f7d\u1f80-\u1fb4\u1fb6-\u1fbc\u1fbe\u1fc2',
      '-\u1fc4\u1fc6-\u1fcc\u1fd0-\u1fd3\u1fd6-\u1fdb\u1fe0-\u1fec\u1ff2',
      '-\u1ff4\u1ff6-\u1ffc\u2071\u207f\u2090-\u209c\u2102\u2107\u210a-\u2113',
      '\u2115\u2119-\u211d\u2124\u2126\u2128\u212a-\u212d\u212f-\u2139\u213c-',
      '\u213f\u2145-\u2149\u214e\u2183-\u2184\u2c00-\u2c2e\u2c30-\u2c5e\u2c60',
      '-\u2ce4\u2ceb-\u2cee\u2cf2-\u2cf3\u2d00-\u2d25\u2d27\u2d2d\u2d30-',
      '\u2d67\u2d6f\u2d80-\u2d96\u2da0-\u2da6\u2da8-\u2dae\u2db0-\u2db6\u2db8',
      '-\u2dbe\u2dc0-\u2dc6\u2dc8-\u2dce\u2dd0-\u2dd6\u2dd8-\u2dde\u2e2f',
      '\u3005-\u3006\u3031-\u3035\u303b-\u303c\u3041-\u3096\u309d-\u309f',
      '\u30a1-\u30fa\u30fc-\u30ff\u3105-\u312d\u3131-\u318e\u31a0-\u31ba',
      '\u31f0-\u31ff\u3400-\u4db5\u4e00-\u9fcc\ua000-\ua48c\ua4d0-\ua4fd',
      '\ua500-\ua60c\ua610-\ua61f\ua62a-\ua62b\ua640-\ua66e\ua67f-\ua697',
      '\ua6a0-\ua6e5\ua717-\ua71f\ua722-\ua788\ua78b-\ua78e\ua790-\ua793',
      '\ua7a0-\ua7aa\ua7f8-\ua801\ua803-\ua805\ua807-\ua80a\ua80c-\ua822',
      '\ua840-\ua873\ua882-\ua8b3\ua8f2-\ua8f7\ua8fb\ua90a-\ua925\ua930-',
      '\ua946\ua960-\ua97c\ua984-\ua9b2\ua9cf\uaa00-\uaa28\uaa40-\uaa42\uaa44',
      '-\uaa4b\uaa60-\uaa76\uaa7a\uaa80-\uaaaf\uaab1\uaab5-\uaab6\uaab9-',
      '\uaabd\uaac0\uaac2\uaadb-\uaadd\uaae0-\uaaea\uaaf2-\uaaf4\uab01-\uab06',
      '\uab09-\uab0e\uab11-\uab16\uab20-\uab26\uab28-\uab2e\uabc0-\uabe2',
      '\uac00-\ud7a3\ud7b0-\ud7c6\ud7cb-\ud7fb\uf900-\ufa6d\ufa70-\ufad9',
      '\ufb00-\ufb06\ufb13-\ufb17\ufb1d\ufb1f-\ufb28\ufb2a-\ufb36\ufb38-',
      '\ufb3c\ufb3e\ufb40-\ufb41\ufb43-\ufb44\ufb46-\ufbb1\ufbd3-\ufd3d\ufd50',
      '-\ufd8f\ufd92-\ufdc7\ufdf0-\ufdfb\ufe70-\ufe74\ufe76-\ufefc\uff21',
      '-\uff3a\uff41-\uff5a\uff66-\uffbe\uffc2-\uffc7\uffca-\uffcf\uffd2',
      '-\uffd7\uffda-\uffdc]+'].join('');

    var re_mention = new RegExp('(^|\\s)' + at_user, 'g'),
        re_autocomplete_user = new RegExp('\\B' + at_user + '$');

    //Escape regex
    Fruum.utils.escape_regex = function(re) {
      return re.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
    }

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
          this.$el.css('opacity', 0);
        },
        onAttach: function() {
          this.$el.delay(this.__delay_transition || 10).
                  animate({ opacity: 1 }, 400);
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
    //Highlight user mentions
    Fruum.utils.mentions = function(text) {
      var matched = re_mention.exec(text);
      text = text.replace(re_mention,function(matched) {
        var ret = '**' + matched.trim() + '**';
        if (matched[0] === '\n' || matched[0] === ' ')
          ret = matched[0] + ret;
        return ret;
      });
      return text;
    }
    //get autocomplete for @user
    Fruum.utils.autocompleteUser = function(text) {
      var m = (text || '').match(re_autocomplete_user);
      if (m) return m[0];
    }
    //get autocomplete for emoji
    Fruum.utils.autocompleteEmoji = function(text) {
      var m = (text || '').match(/\B:([\-+\w]*)$/);
      if (m && m[0].length > 1) return m[0];
    }
    //analyze url
    Fruum.utils.getLocation = function(href) {
      var match = href.match(/^(https?\:)\/\/(([^:\/?#]*)(?:\:([0-9]+))?)(\/[^?#]*)(\?[^#]*|)(#.*|)$/);
      if (match) {
        return {
          protocol: match[1],
          host: match[2],
          hostname: match[3],
          port: match[4],
          pathname: match[5],
          search: match[6],
          hash: match[7]
        }
      }
      else {
        return {
          protocol: '',
          host: '',
          hostname: '',
          port: '',
          pathname: '',
          search: '',
          hash: ''
        }
      }
    }
    //Markdown display
    Fruum.utils.print = function(post, attachments) {
      //remove escaping of > and ` used by markdown
      post = (post || '').replace(/&gt;/g, '>').replace(/&#x60;/g, '`');
      //process post through plugins
      post = Fruum.utils.chain(Fruum.processors.post, post);
      //emoji processing
      post = Fruum.emoji.convert(post);
      //user mentions processing
      post = Fruum.utils.mentions(post);
      //attachments processing
      if (attachments && attachments.length) {
        _.each(attachments, function(attachment) {
          if (attachment.type == 'image') {
            post = post.replace(
              new RegExp(Fruum.utils.escape_regex('[[' + attachment.type + ':' + attachment.name + ']]'), 'g'),
              '![' + attachment.name + '](' + attachment.data + ')'
            )
          }
        });
      }
      return marked(post);
    }
    Fruum.utils.printHeader = function(text) {
      //emojify
      text = Fruum.emoji.convert(_.escape(text || ''));
      return text;
    }
    Fruum.utils.printReaction = function(count) {
      if (!count) return '';
      if (count < 1000) return '' + count;
      return (count / 1000).toFixed(1) + 'K';
    }
    //if message contains attachment
    Fruum.utils.usesAttachment = function(message, attachment) {
      return Boolean(message.match(new RegExp(Fruum.utils.escape_regex('[[' + attachment.type + ':' + attachment.name + ']]'), 'g')));
    }
    Fruum.utils.permaLink = function(doc_id, post_index) {
      var ret = Fruum.application.fullpage_url +
                (Fruum.application.pushstate?'':'#') +
                'v/' + doc_id;
      if (post_index > 0) ret += '/' + post_index;
      return ret;
    }
    Fruum.utils.printSummary = function(text) {
      text = Fruum.utils.print(text).
        replace(/(<h[123456]\b[^>]*>)[^<>]*(<\/h[123456]>)/gi, '').
        replace(/<(?:.|\n)*?>/gm, '').
        replace(/\[\[\b\S+?\b\]\]/g, '');
      if (text.length > 170)
        text = text.substr(0, 170) + '...';
      return text;
    }
    Fruum.utils.printSearch = function(text) {
      text = Fruum.utils.printSummary(text);
      //do some highlighting
      return text.replace(/\{\{\{(.+?)\}\}\}/g, '<span class="highlight">$1</span>');
    }
    //If computer is Mac or IOS
    Fruum.utils.isMacLike = function() {
      return (navigator.platform || '').match(/(Mac|iPhone|iPod|iPad)/i)?true:false;
    }
    //If computer is Mac
    Fruum.utils.isMac = function() {
      return (navigator.platform || '').match(/(Mac)/i)?true:false;
    }
    //If computer is Windows
    Fruum.utils.isWindows = function() {
      return (navigator.platform || '').match(/(Win)/i)?true:false;
    }
    //If computer is Linux
    Fruum.utils.isLinux = function() {
      return (navigator.platform || '').match(/(Linux)/i)?true:false;
    }
    //If computer is desktop
    Fruum.utils.isDesktop = function() {
      return (navigator.platform || '').match(/(Linux|Win|Mac)/i)?true:false;
    }
    //If browser is Chrome
    Fruum.utils.isChrome = function() {
      return !!window.chrome;
    }
    //print shortcut using mac/win modifier
    Fruum.utils.shortcutModifier = function(key) {
      return (Fruum.utils.isMacLike()?'Cmd':'Ctrl') + '+' + key;
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
    }
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
    }
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
    Fruum.utils.resizeImage = function(base64, max_width, max_height, done) {
      var img = document.createElement('img');
      img.onload = function() {
        try {
          var width = img.width,
              height = img.height;
          if (width <= max_width && height <=max_height) {
            done(base64);
            return;
          }

          var canvas = document.createElement('canvas'),
              ctx = canvas.getContext('2d');

          ctx.drawImage(img, 0, 0);

          if (width > height) {
            if (width > max_width) {
              height *= max_width / width;
              width = max_width;
            }
          }
          else {
            if (height > max_height) {
              width *= max_height / height;
              height = max_height;
            }
          }
          canvas.width = width;
          canvas.height = height;
          ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          var mime = base64.indexOf('data:image/jpeg') == 0?'image/jpeg':'image/png';
          done(canvas.toDataURL(mime));
        }
        catch(err) {
          done(base64);
        }
      }
      img.src = base64;
    }
  });
})();
