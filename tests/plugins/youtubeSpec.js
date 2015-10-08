window = {};
window.Fruum = {};
window.Fruum.plugins = [];
eval(require('fs').readFileSync(__dirname + '/../../plugins/youtube/client.js', 'utf8'));
var plugin = new window.Fruum.plugins[0]();

describe("Youtube plugin", function() {
  it("to replace youtube links with embed", function() {
    expect(plugin.post_content('https://www.youtube.com/watch?v=EgqUJOudrcM')).toEqual(
      '<iframe src="https://www.youtube.com/embed/EgqUJOudrcM" frameborder="0" allowfullscreen></iframe>'
    );

    expect(plugin.post_content('https://youtu.be/EgqUJOudrcM')).toEqual(
      '<iframe src="https://www.youtube.com/embed/EgqUJOudrcM" frameborder="0" allowfullscreen></iframe>'
    );

    expect(plugin.post_content('foo https://youtu.be/EgqUJOudrcM bar')).toEqual(
      'foo <iframe src="https://www.youtube.com/embed/EgqUJOudrcM" frameborder="0" allowfullscreen></iframe> bar'
    );

    expect(plugin.post_content('foo https://youtu.be/EgqUJOudrcM bar https://youtu.be/EgqUJOudrcM')).toEqual(
      'foo <iframe src="https://www.youtube.com/embed/EgqUJOudrcM" frameborder="0" allowfullscreen></iframe> bar <iframe src="https://www.youtube.com/embed/EgqUJOudrcM" frameborder="0" allowfullscreen></iframe>'
    );

    expect(plugin.post_content('https://youtu.be/MoOijqT6j6o\nAce combat...nice\nhttps://youtu.be/9FyKSUgT5OI\nnice as well\n')).toEqual(
      '<iframe src="https://www.youtube.com/embed/MoOijqT6j6o" frameborder="0" allowfullscreen></iframe>\nAce combat...nice\n<iframe src="https://www.youtube.com/embed/9FyKSUgT5OI" frameborder="0" allowfullscreen></iframe>\nnice as well\n'
    );

  });
});
