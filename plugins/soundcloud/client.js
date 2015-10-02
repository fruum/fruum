/******************************************************************************
 Soundcloud links processor plugin
*******************************************************************************/

(function() {
  'use strict';
  window.Fruum.plugins.push(function () {
    var $ = window.Fruum.libs.$,
        _ = window.Fruum.libs._,
        template = _.template($('#fruum-plugin-template-soundcloud').html()),
        re = /https:\/\/soundcloud.com\/[a-zA-Z0-9-_]+\/[a-zA-Z0-9-_]+/gi;

    this.post_content = function(markdown) {
      return markdown.replace(re, function(match) {
        return template({ channel: match });
      });
    }
  });
})();
