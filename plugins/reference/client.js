/******************************************************************************
 Reference client plugin that demonstrates the API
*******************************************************************************/

(function() {
  'use strict';
  window.Fruum.plugins.push(function () {
    //called before displaying the content of a post
    this.post_content = function(markdown) {
      //do some modifications to the post (markdown format)
      return markdown;
    }
    //called before a payload is sent to the server
    this.transmit = function(payload, action) {
      return payload;
    }
    //called when a payload is received from the sevrer
    this.receive = function(payload, action) {
      return payload;
    }
    //called before the app is initialized
    this.init = function(root_view) {
    }
  });
})();
