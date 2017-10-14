/******************************************************************************
 Attachments panel
*******************************************************************************/

/* globals Fruum */

(function() {
  'use strict';
  window.Fruum.require.push(function() {
    Fruum.views = Fruum.views || {};

    var $ = Fruum.libs.$,
        _ = Fruum.libs._,
        Marionette = Fruum.libs.Marionette;

    Fruum.views.AttachmentsView = Marionette.View.extend({
      template: _.noop,
      $el_root: $('#fruum'),
      el: '.fruum-js-attachments',
      ui: {
        plus: '#fruum-file-upload',
        image: '[data-attachment]',
        close: '.fruum-js-close',
      },
      events: {
        'click @ui.close': 'hide',
        'click @ui.image': 'onSelect',
        'dragover': 'onDragOver',
        'dragleave': 'onDragLeave',
        'drop': 'onDrop',
        'change @ui.plus': 'onChange',
      },
      initialize: function(options) {
        _.bindAll(this, 'onKey', 'onPaste');
        this.ui_state = options.ui_state;
        this.interactions = options.interactions;
        this.template = _.template($('#fruum-template-attachments').html());
        this.listenTo(this.ui_state, 'fruum:optimize', this.onOptimize);
        this.listenTo(this.ui_state, 'change:optimizing', this.render);
      },
      onSelect: function(event) {
        var attachment = $(event.target).closest('[data-attachment]').data('attachment');
        if (attachment) {
          var body = this.interactions.ui.field_body.val() || '';
          if (body.length) body += '\n';
          this.interactions.ui.field_body.val(
            body + attachment + '\n'
          );
          this.hide();
          this.interactions.renderPreview();
        }
      },
      onDragOver: function(event) {
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }
        this.$el.find('.fruum-options-list').addClass('fruum-droppable');
      },
      onDragLeave: function(event) {
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }
        this.$el.find('.fruum-options-list').removeClass('fruum-droppable');
      },
      onDrop: function(event) {
        this.$el.find('.fruum-options-list').removeClass('fruum-droppable');
        if (event.originalEvent.dataTransfer) {
          if (event.originalEvent.dataTransfer.files.length) {
            event.preventDefault();
            event.stopPropagation();
            this.handleFiles(event.originalEvent.dataTransfer.files);
            return false;
          }
        }
      },
      onChange: function(event) {
        this.handleFiles(event.target.files);
      },
      onOptimize: function(payload) {
        if (!payload) return;
        var editing = this.ui_state.get('editing');
        editing.attachments = editing.attachments || [];
        var attachment = {
          name: this.uniqueName(
            (payload.name || ('file' + editing.attachments.length)).replace(/ /g, '-'),
            editing.attachments
          ),
          type: payload.type,
          data: payload.data,
        };
        editing.attachments.push(attachment);
        this.render();
        var body = this.interactions.ui.field_body.val() || '';
        if (body.length) body += '\n';
        this.interactions.ui.field_body.val(body +
          '[[' + attachment.type + ':' + attachment.name + ']]\n'
        );
        this.interactions.renderPreview();
        if (!this.ui_state.get('optimizing')) this.hide();
      },
      handleFiles: function(files) {
        if (!files) return;
        _.each(files, function(file) {
          var reader = new FileReader();
          reader.onload = function(e) {
            var data = e.target.result;
            if (data.indexOf('data:image/png') == 0 ||
                data.indexOf('data:image/jpeg') == 0
            ) {
              // send it to server for minification
              Fruum.utils.resizeImage(data, 800, 800, function(resized_data) {
                Fruum.io.trigger('fruum:optimize', {
                  name: file.name || '',
                  type: 'image',
                  data: resized_data,
                });
              });
            }
          };
          reader.readAsDataURL(file);
        });
      },
      uniqueName: function(name, attachments) {
        for (var i = 0; i < attachments.length; ++i) {
          if (attachments[i].name === name) {
            return this.uniqueName(name + '_', attachments);
          }
        }
        return name;
      },
      onKey: function(event) {
        if (event.which == 27) this.hide();
      },
      onPaste: function(event) {
        var clipboard = event.originalEvent.clipboardData;
        if (clipboard && clipboard.items) {
          var files = [];
          _.each(clipboard.items, function(item) {
            if (item.type.indexOf('image') == 0) {
              item = item.getAsFile();
              if (item) files.push(item);
            }
          });
          if (files.length) this.handleFiles(files);
        }
      },
      render: function() {
        this.$el.html(this.template({
          attachments: this.ui_state.get('editing').attachments || [],
          optimizing: this.ui_state.get('optimizing'),
        }));
      },
      show: function() {
        if (!this.$el.hasClass('fruum-nodisplay')) return;
        this.$el.removeClass('fruum-nodisplay');
        $(document).on('keydown', this.onKey);
        $(document).on('paste', this.onPaste);
        this.render();
      },
      hide: function() {
        if (this.$el.hasClass('fruum-nodisplay')) return;
        this.$el.addClass('fruum-nodisplay');
        $(document).off('keydown', this.onKey);
        $(document).off('paste', this.onPaste);
      },
      toggle: function() {
        if (this.$el.is(':visible')) {
          this.hide();
        } else {
          this.show();
        }
      },
    });
  });
})();
