/* globals window:true, describe, it, expect */

window = {};
window.Fruum = {};
window.Fruum.plugins = [];
eval(require('fs').readFileSync(__dirname + '/../../plugins/imagelinks/client.js', 'utf8'));
var plugin = new window.Fruum.plugins[0]();

describe('Imagelinks plugin', function() {
  it('to replace image links with markdown', function() {
    expect(plugin.post_content('https://foo.com/foo.jpg')).toEqual(
      ' ![https://foo.com/foo.jpg](https://foo.com/foo.jpg) '
    );
    expect(plugin.post_content('https://foo.com/foo.jpg?fooo')).toEqual(
      'https://foo.com/foo.jpg?fooo'
    );
    expect(plugin.post_content('foo https://foo.com/foo.gif bar')).toEqual(
      'foo ![https://foo.com/foo.gif](https://foo.com/foo.gif) bar'
    );
    expect(plugin.post_content('foo http://foo.com/foo.png')).toEqual(
      'foo ![http://foo.com/foo.png](http://foo.com/foo.png) '
    );
    expect(plugin.post_content('foo (https://foo.com/foo.png)')).toEqual(
      'foo (https://foo.com/foo.png)'
    );
  });
});
