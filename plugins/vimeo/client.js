/******************************************************************************
 Vimeo links processor plugin
*******************************************************************************/

(function() {
  'use strict';
  window.Fruum.plugins.push(function() {
    var re = /(?:http:\/\/|https:\/\/)?(?:www\.)?(?:vimeo\.com)\/([^\s]+)/g;
    this.post_content = function(markdown) {
      return markdown.replace(re, '<iframe src="//player.vimeo.com/video/$1" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>');
    };
  });
})();
