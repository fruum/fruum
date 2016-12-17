/* globals window:true, describe, it, expect */

window = {};
window.Fruum = {};
window.Fruum.plugins = [];
window.Fruum.libs = {
  _: {
    template: function() {
      return function(context) {
        return '<embed>' + context.id + '</embed>';
      };
    },
  },
  $: function() {
    this.html = function() {};
    return this;
  },
};
eval(require('fs').readFileSync(__dirname + '/../../plugins/imgur/client.js', 'utf8'));
var plugin = new window.Fruum.plugins[0]();

describe('Imgur plugin', function() {
  it('to replace links with embed', function() {
    expect(plugin.post_content('http://imgur.com/foobar')).toEqual(
      '<embed>foobar</embed>'
    );

    expect(plugin.post_content('http://imgur.com/foobar bar')).toEqual(
      '<embed>foobar</embed> bar'
    );

    expect(plugin.post_content('http://imgur.com/foobar.png bar')).toEqual(
      'http://imgur.com/foobar.png bar'
    );

    expect(plugin.post_content('foo http://imgur.com/foobar bar')).toEqual(
      'foo <embed>foobar</embed> bar'
    );

    expect(plugin.post_content('http://imgur.com/gallery/foobar')).toEqual(
      'http://imgur.com/gallery/foobar'
    );

    expect(plugin.post_content('foo http://imgur.com/foobar bar and http://imgur.com/foobar')).toEqual(
      'foo <embed>foobar</embed> bar and <embed>foobar</embed>'
    );
  });
});
