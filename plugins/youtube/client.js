/******************************************************************************
 Youtube links processor plugin
*******************************************************************************/

(function() {
  'use strict';
  window.Fruum.plugins.push(function() {
    var re = /(?:http:\/\/|https:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=)?(.*?)([^\s]+)/g;
    this.post_content = function(markdown) {
      return markdown.replace(re, '<iframe src="https://www.youtube.com/embed/$2" frameborder="0" allowfullscreen></iframe>');
    };
  });
})();
