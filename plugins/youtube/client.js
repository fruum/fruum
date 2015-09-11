/******************************************************************************
 Youtube links processor plugin
*******************************************************************************/

(function() {
  'use strict';
  window.Fruum.plugins.push(function () {
    var re = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    this.post_content = function(markdown) {
      var match = markdown.match(re);
      if (match && match[2].length == 11) {
        markdown += '\n\n<iframe src="https://www.youtube.com/embed/' + match[2] + '" frameborder="0" allowfullscreen></iframe>';
      }
      return markdown;
    }
  });
})();
