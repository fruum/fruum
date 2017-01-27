/******************************************************************************
 Youtube links processor plugin
*******************************************************************************/

(function() {
  'use strict';
  window.Fruum.plugins.push(function() {
    var re = /((?:http:\/\/|https:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=)?(.*?)([^\s]+))/g;
    this.post_content = function(markdown) {
      return markdown.replace(
        re,
        '<p class="fruum-youtube-container"><a href="$1">$1</a>' +
        '<iframe src="https://www.youtube.com/embed/$3" frameborder="0" class="fruum-youtube-iframe" allowfullscreen></iframe></p>\n'
      );
    };
  });
})();
