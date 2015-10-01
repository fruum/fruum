window = {};
window.Fruum = {};
window.Fruum.plugins = [];
window.Fruum.libs = {
  _: {
    template: function() { return '' }
  },
  $: function() { this.html = function() {}; return this; }
};
eval(require('fs').readFileSync(__dirname + '/../plugins/twitchtv/client.js', 'utf8'));
var plugin = new window.Fruum.plugins[0]();

describe("Twitchtv plugin", function() {
});
