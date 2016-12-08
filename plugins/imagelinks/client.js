/******************************************************************************
 Image links processor plugin
*******************************************************************************/

(function() {
  'use strict';
  window.Fruum.plugins.push(function() {
    var re = /(?:^|\s)https?:\/\/.*?\.(?:png|jpg|jpeg|gif)(?:$|\s)/ig;

    this.post_content = function(markdown) {
      return markdown.replace(re, function(match) {
        match = match.trim();
        return ' ![' + match + '](' + match + ') ';
      });
    };
  });
})();
