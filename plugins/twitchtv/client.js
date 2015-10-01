/******************************************************************************
 Twitch TV links processor plugin
*******************************************************************************/

(function() {
  'use strict';
  window.Fruum.plugins.push(function () {
    var $ = window.Fruum.libs.$,
        _ = window.Fruum.libs._,
        template = _.template($('#fruum-plugin-template-twitchtv').html()),
        re = /www.twitch.tv\/[a-zA_Z0-9_]+/gi;

    this.post_content = function(markdown) {
      var match = markdown.match(re);
      var matches = re.exec(markdown);
      if (matches !== null) {
        markdown += '\n\n' + template({ channel: matches[0].split('/')[1] });
      }
      return markdown;
    }
  });
})();
