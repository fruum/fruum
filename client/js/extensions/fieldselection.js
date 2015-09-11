/******************************************************************************
Field selection jquery plugin
*******************************************************************************/

(function() {
  'use strict';
  window.Fruum.require.push(function () {
    var $ = Fruum.libs.$;
    /*
     * $ plugin: fieldSelection - v0.1.1 - last change: 2006-12-16
     * (c) 2006 Alex Brem <alex@0xab.cd> - http://blog.0xab.cd
     */
  	var fieldSelection = {
  		getSelection: function() {
  			var e = (this.jquery) ? this[0] : this;
        if ('selectionStart' in e) {
          var l = e.selectionEnd - e.selectionStart;
          return { start: e.selectionStart, end: e.selectionEnd, length: l, text: e.value.substr(e.selectionStart, l) };
        }
        else if (document.selection) {
          e.focus();
          var r = document.selection.createRange();
          if (r === null) {
            return { start: 0, end: e.value.length, length: 0 }
          }
          var re = e.createTextRange();
          var rc = re.duplicate();
          re.moveToBookmark(r.getBookmark());
          rc.setEndPoint('EndToStart', re);
          return { start: rc.text.length, end: rc.text.length + r.text.length, length: r.text.length, text: r.text };
        }
        else return null;
  		},
  		replaceSelection: function() {
  			var e = (this.jquery) ? this[0] : this;
  			var text = arguments[0] || '';
        if ('selectionStart' in e) {
          e.value = e.value.substr(0, e.selectionStart) + text + e.value.substr(e.selectionEnd, e.value.length);
          return this;
        }
        else if (document.selection) {
          e.focus();
          document.selection.createRange().text = text;
          return this;
        }
        else {
          e.value += text;
          return $(e);
        }
  		}
  	};
  	$.each(fieldSelection, function(i) { $.fn[i] = this; });
  });
})();
