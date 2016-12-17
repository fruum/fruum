/******************************************************************************
 Dropbox image links processor plugin
*******************************************************************************/

(function() {
  'use strict';
  window.Fruum.plugins.push(function() {
    var re = /\.(jpe?g|png|gif|bmp)$/i;
    this.post_content = function(markdown) {
      if (markdown.indexOf('https://www.dropbox.com/s/') == 0 &&
          re.test(markdown.replace('?dl=0', ''))
      ) {
        markdown += '\n\n![' + markdown + '](' + markdown.replace('www.dropbox.com', 'dl.dropbox.com') + ')';
      }
      return markdown;
    };
  });
})();
