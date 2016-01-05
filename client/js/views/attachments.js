/******************************************************************************
 Attachments panel
*******************************************************************************/

(function() {
  'use strict';
  window.Fruum.require.push(function () {
    Fruum.views = Fruum.views || {};

    var $ = Fruum.libs.$,
        _ = Fruum.libs._,
        Backbone = Fruum.libs.Backbone,
        Marionette = Fruum.libs.Marionette;

    Fruum.views.AttachmentsView = Marionette.View.extend({
      $el_root: $('#fruum'),
      el: '.fruum-js-attachments',
      ui: {
        plus: '#fruum-file-upload',
        image: '[data-attachment]',
        close: '.fruum-js-close'
      },
      events: {
        'click @ui.close': 'hide',
        'click @ui.image': 'onSelect',
        'dragover': 'onDragOver',
        'dragleave': 'onDragLeave',
        'drop': 'onDrop',
        'change @ui.plus': 'onChange'
      },
      initialize: function(options) {
        _.bindAll(this, 'onKey', 'onPaste');
        this.ui_state = options.ui_state;
        this.interactions = options.interactions;
        this.template = _.template($('#fruum-template-attachments').html());
      },
      onSelect: function(event) {
        var attachment = $(event.target).closest('[data-attachment]').data('attachment');
        if (attachment) {
          this.interactions.ui.field_body.val(
            this.interactions.ui.field_body.val() + ' ' + attachment
          );
          this.hide();
          this.interactions.renderPreview();
        }
      },
      onDragOver: function(event) {
        event.preventDefault();
        event.stopPropagation();
        this.$el.find('.fruum-options-list').addClass('fruum-droppable');
      },
      onDragLeave: function(event) {
        event.preventDefault();
        event.stopPropagation();
        this.$el.find('.fruum-options-list').removeClass('fruum-droppable');
      },
      onDrop: function(event) {
        this.$el.find('.fruum-options-list').removeClass('fruum-droppable');
        if (event.originalEvent.dataTransfer){
          if(event.originalEvent.dataTransfer.files.length) {
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
      handleFiles: function(files) {
        if (!files) return;
        var editing = this.ui_state.get('editing'), that = this;
        _.each(files, function(file) {
          var reader = new FileReader()
          reader.onload = function(e) {
            var data = e.target.result;
            if (data.indexOf('data:image/png') == 0 ||
                data.indexOf('data:image/jpeg') == 0)
            {
              //resize image
              editing.attachments = editing.attachments || [];
              data = Fruum.utils.resizeImage(data, 800, 800);
              var attachment = {
                name: that.uniqueName(
                  (file.name || ('file' + editing.attachments.length)).replace(/ /g, '-'),
                  editing.attachments
                ),
                type: 'image',
                data: data
              }
              editing.attachments.push(attachment);
              that.render();
              that.interactions.ui.field_body.val(that.interactions.ui.field_body.val() + ' ' +
                '[[' + attachment.type + ':' + attachment.name + ']]'
              );
              that.interactions.renderPreview();
              that.hide();
            }
          }
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
          attachments: this.ui_state.get('editing').attachments || []
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
        if (this.$el.is(':visible'))
          this.hide();
        else
          this.show();
      }
    });
  });
})();
