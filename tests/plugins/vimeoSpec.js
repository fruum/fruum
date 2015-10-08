window = {};
window.Fruum = {};
window.Fruum.plugins = [];
eval(require('fs').readFileSync(__dirname + '/../../plugins/vimeo/client.js', 'utf8'));
var plugin = new window.Fruum.plugins[0]();

describe("Vimeo plugin", function() {
  it("to replace vimeo links with embed", function() {
    expect(plugin.post_content('https://vimeo.com/140161428')).toEqual(
      '<iframe src="//player.vimeo.com/video/140161428" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>'
    );

    expect(plugin.post_content('foo https://vimeo.com/140161428 bar')).toEqual(
      'foo <iframe src="//player.vimeo.com/video/140161428" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe> bar'
    );

    expect(plugin.post_content('foo https://vimeo.com/140161428 bar https://vimeo.com/140161428')).toEqual(
      'foo <iframe src="//player.vimeo.com/video/140161428" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe> bar <iframe src="//player.vimeo.com/video/140161428" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>'
    );
  });
});
