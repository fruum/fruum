/******************************************************************************
 Twitch TV links processor plugin
*******************************************************************************/

(function() {
  'use strict';
  window.Fruum.plugins.push(function () {
    var $ = window.Fruum.libs.$,
        _ = window.Fruum.libs._,
        template = _.template($('#fruum-plugin-template-twitchtv').html()),
        re = /http:\/\/www.twitch.tv\/[a-zA_Z0-9_]+/gi;

    this.post_content = function(markdown) {
      return markdown.replace(re, function(match) {
        return template({ channel: match });
      });
    }
  });
})();
