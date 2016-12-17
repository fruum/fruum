/* globals window:true, describe, it, expect */

window = {};
window.Fruum = {};
window.Fruum.plugins = [];
window.Fruum.libs = {
  _: {
    template: function() {
      return function(context) {
        return '<embed>' + context.channel + '</embed>';
      };
    },
  },
  $: function() {
    this.html = function() {};
    return this;
  },
};
eval(require('fs').readFileSync(__dirname + '/../../plugins/twitchtv/client.js', 'utf8'));
var plugin = new window.Fruum.plugins[0]();

describe('Twitchtv plugin', function() {
  it('properly embeds', function() {
    var share = 'http://www.twitch.tv/tarik_tv';
    expect(plugin.post_content(share)).toEqual(
      '<embed>' + share + '</embed>'
    );

    expect(plugin.post_content('foo ' + share)).toEqual(
      'foo <embed>' + share + '</embed>'
    );

    expect(plugin.post_content('foo ' + share + ' bar')).toEqual(
      'foo <embed>' + share + '</embed> bar'
    );

    expect(plugin.post_content('foo ' + share + ' bar ' + share)).toEqual(
      'foo <embed>' + share + '</embed> bar <embed>' + share + '</embed>'
    );
  });
});
