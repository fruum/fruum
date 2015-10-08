window = {};
window.Fruum = {};
window.Fruum.plugins = [];
eval(require('fs').readFileSync(__dirname + '/../../plugins/dropbox/client.js', 'utf8'));
var plugin = new window.Fruum.plugins[0]();

describe("Dropbox plugin", function() {
  it("to replace images with markdown", function() {
    expect(plugin.post_content('https://www.dropbox.com/s/foo.png')).toEqual(
      'https://www.dropbox.com/s/foo.png\n\n![https://www.dropbox.com/s/foo.png](https://dl.dropbox.com/s/foo.png)'
    );
  });
  it("to not replace non-images", function() {
    expect(plugin.post_content('https://www.dropbox.com/s/foo.pdf')).toEqual(
      'https://www.dropbox.com/s/foo.pdf'
    );
  });
});
