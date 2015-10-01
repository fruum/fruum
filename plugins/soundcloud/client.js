/******************************************************************************
 Soundcloud links processor plugin
*******************************************************************************/

(function() {
  'use strict';
  window.Fruum.plugins.push(function () {
    var $ = window.Fruum.libs.$,
        _ = window.Fruum.libs._,
        template = _.template($('#fruum-plugin-template-soundcloud').html()),
        re = /soundcloud.com\/[a-zA-Z0-9-_]+\/[a-zA-Z0-9-_]+/gi;

    this.post_content = function(markdown) {
      var match = markdown.match(re);
      var matches = re.exec(markdown);
      if (matches !== null) {
        markdown += '\n\n' + template({ channel: matches[0] });
      }
      return markdown;
    }
  });
})();
