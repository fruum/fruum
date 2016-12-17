/******************************************************************************
 Imgur links processor plugin
*******************************************************************************/

(function() {
  'use strict';
  window.Fruum.plugins.push(function() {
    var $ = window.Fruum.libs.$,
        _ = window.Fruum.libs._,
        template = _.template($('#fruum-plugin-template-imgur').html()),
        re = /https?:\/\/[w\.]*imgur\.[^\/]*\/([^?][^\s]*)/gi; // eslint-disable-line

    function endsWith(str, suffix) {
      return str.indexOf(suffix, str.length - suffix.length) !== -1;
    }

    this.post_content = function(markdown) {
      return markdown.replace(re, function(match, id) {
        if (endsWith(match, '.png') ||
            endsWith(match, '.gif') ||
            endsWith(match, '.jpg') ||
            id.indexOf('gallery/') >= 0
        ) return match;
        return template({ id: id });
      });
    };
  });
})();
