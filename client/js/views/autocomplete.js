/******************************************************************************
 Autocomplete
*******************************************************************************/

/* globals Fruum */

(function() {
  'use strict';
  window.Fruum.require.push(function() {
    Fruum.views = Fruum.views || {};

    var $ = Fruum.libs.$,
        _ = Fruum.libs._,
        Marionette = Fruum.libs.Marionette;

    Fruum.views.AutocompleteView = Marionette.View.extend({
      template: _.noop,
      $el_root: $('#fruum'),
      el: '.fruum-js-autocomplete',
      template_autocomplete_user: _.template($('#fruum-template-autocomplete-user').html()),
      template_autocomplete_emoji: _.template($('#fruum-template-autocomplete-emoji').html()),
      events: {
        'mousedown [data-item]': 'onSelect',
      },
      initialize: function(options) {
        _.bindAll(this, 'onTimer');
        this.interactions = options.interactions;
        this.listenTo(Fruum.io, 'fruum:autocomplete_results', this.onResults);
        this.match = '';
        this.items = [];
      },
      onKey: function(event) {
        // reset timer
        if (this.timer) {
          clearTimeout(this.timer);
          this.timer = null;
        }
        switch (event.which) {
          case 38: // up
          case 40: // down
          case 37: // left
          case 39: // right
          case 13: // enter
          case 27: // escape
            this.onShortcut(event);
            break;
          default:
            this.timer = setTimeout(this.onTimer, 250);
            break;
        }
      },
      onShortcut: function(event) {
        if (!this.$el.is(':visible')) return;
        event.preventDefault();
        var el;
        switch (event.which) {
          case 27: { // escape
            event._autocomplete_consumed = true;
            this.$el.addClass('fruum-nodisplay');
            this.match = '';
            break;
          }
          case 13: // enter
            el = this.$('.fruum-option-selected');
            if (el.length) {
              this.onSelect({ target: el });
              this.hide();
              event._autocomplete_consumed = true;
            }
            break;
          case 38: // up
          case 40: // down
          case 37: // left
          case 39: // right
            el = this.$('.fruum-option-selected');
            if (!el.length) {
              // select first element
              this.$('[data-item]:first').addClass('fruum-option-selected');
            } else {
              var last_item = el.data('item');
              var index = this.items.indexOf(last_item);
              switch (event.which) {
                case 38: // up
                  index = Math.max(0, index - 2);
                  break;
                case 40: // down
                  index = Math.min(this.items.length - 1, index + 2);
                  break;
                case 37: // left
                  index = Math.max(0, index - 1);
                  break;
                case 39: // right
                  index = Math.min(this.items.length - 1, index + 1);
                  break;
              }
              if (this.items[index]) {
                el.removeClass('fruum-option-selected');
                this.$('[data-item="' + this.items[index] + '"]').addClass('fruum-option-selected');
              }
            }
            event._autocomplete_consumed = true;
            break;
        }
      },
      hide: function() {
        this.$el.addClass('fruum-nodisplay');
        this.match = '';
        if (this.timer) {
          clearTimeout(this.timer);
          this.timer = null;
        }
      },
      onResults: function(payload) {
        // are we still relevant?
        if (payload.q !== this.match) return;
        // do we have results?
        if (payload && payload.results && payload.results.length) {
          var list = [], hash = {};
          this.items = [];
          _.each(payload.results, function(item) {
            if (hash[item.username]) return;
            hash[item.username] = true;
            list.push({
              key: '@' + item.username,
              username: item.username,
              displayname: item.displayname || item.username,
            });
            this.items.push('@' + item.username);
          }, this);
          this.$el.html(
            this.template_autocomplete_user({
              list: list,
            })
          ).removeClass('fruum-nodisplay');
          this.positionPanel();
        } else {
          this.$el.addClass('fruum-nodisplay');
        }
      },
      onSelect: function(event) {
        var item = $(event.target).closest('[data-item]').data('item'),
            field = this.interactions.ui.field_body,
            text = field.val(),
            curret = field.prop('selectionStart');
        if (text && item && this.match && curret) {
          var start_index = text.lastIndexOf(this.match, curret);
          text = text.substr(0, start_index) + item +
            ' ' + text.substr(curret);
          field.val(text);
          _.defer(function() {
            field.focus();
            Fruum.utils.setCaretPosition(field, start_index + item.length + 1);
          });
        }
      },
      onTimer: function() {
        this.timer = null;
        var text = this.interactions.ui.field_body.val() || '',
            curret = this.interactions.ui.field_body.prop('selectionStart') || text.length,
            match;
        // check from curret position
        text = text.substr(0, curret);
        // find emoji
        match = Fruum.utils.autocompleteEmoji(text);
        if (match) {
          this.match = match;
          var list = [];
          this.items = [];
          _.each(Fruum.emoji.symbols, function(value, key) {
            if (key.indexOf(match) === 0) {
              this.items.push(key);
              list.push({
                key: key,
                emoji: key,
                icon: value,
              });
            }
          }, this);
          if (list.length) {
            this.$el.html(
              this.template_autocomplete_emoji({ list: list })
            ).removeClass('fruum-nodisplay');
            this.positionPanel();
          } else {
            this.$el.addClass('fruum-nodisplay');
          }
          return;
        }
        // find user
        match = Fruum.utils.autocompleteUser(text);
        if (match) {
          this.match = match;
          Fruum.io.trigger('fruum:autocomplete', { q: match });
          return;
        }
        // nothing found
        this.match = '';
        this.$el.addClass('fruum-nodisplay');
      },
      positionPanel: function() {
        this.$el.css('top', (
          this.interactions.ui.field_body.offset().top -
          this.$el_root.offset().top -
          this.$el.outerHeight()
        ) + 'px');
      },
    });
  });
})();
