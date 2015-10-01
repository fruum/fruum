window = {};
window.Fruum = {};
window.Fruum.libs = {
  _: {
    template: function() { return '' }
  },
  $: function() { this.html = function() {}; return this; }
};
window.Fruum.plugins = [];
eval(require('fs').readFileSync(__dirname + '/../plugins/soundcloud/client.js', 'utf8'));
var plugin = new window.Fruum.plugins[0]();

describe("Soundcloud plugin", function() {
});
