/* globals window:true, describe, it, expect */

window = {};
window.Fruum = {};
window.Fruum.plugins = [];
eval(require('fs').readFileSync(__dirname + '/../../plugins/youtube/client.js', 'utf8'));
var plugin = new window.Fruum.plugins[0]();

describe('Youtube plugin', function() {
  it('to replace youtube links with embed', function() {
    expect(plugin.post_content('https://www.youtube.com/watch?v=EgqUJOudrcM')).toEqual(
      '<p class="fruum-youtube-container"><a href="https://www.youtube.com/watch?v=EgqUJOudrcM">https://www.youtube.com/watch?v=EgqUJOudrcM</a>' +
      '<iframe src="https://www.youtube.com/embed/EgqUJOudrcM" frameborder="0" class="fruum-youtube-iframe" allowfullscreen></iframe></p>\n'
    );

    expect(plugin.post_content('https://youtu.be/EgqUJOudrcM')).toEqual(
      '<p class="fruum-youtube-container"><a href="https://youtu.be/EgqUJOudrcM">https://youtu.be/EgqUJOudrcM</a>' +
      '<iframe src="https://www.youtube.com/embed/EgqUJOudrcM" frameborder="0" class="fruum-youtube-iframe" allowfullscreen></iframe></p>\n'
    );

    expect(plugin.post_content('foo https://youtu.be/EgqUJOudrcM bar')).toEqual(
      'foo ' +
      '<p class="fruum-youtube-container"><a href="https://youtu.be/EgqUJOudrcM">https://youtu.be/EgqUJOudrcM</a>' +
      '<iframe src="https://www.youtube.com/embed/EgqUJOudrcM" frameborder="0" class="fruum-youtube-iframe" allowfullscreen></iframe></p>\n' +
      ' bar'
    );

    expect(plugin.post_content('foo https://youtu.be/EgqUJOudrcM bar https://youtu.be/EgqUJOudrcM')).toEqual(
      'foo ' +
      '<p class="fruum-youtube-container"><a href="https://youtu.be/EgqUJOudrcM">https://youtu.be/EgqUJOudrcM</a>' +
      '<iframe src="https://www.youtube.com/embed/EgqUJOudrcM" frameborder="0" class="fruum-youtube-iframe" allowfullscreen></iframe></p>\n' +
      ' bar ' +
      '<p class="fruum-youtube-container"><a href="https://youtu.be/EgqUJOudrcM">https://youtu.be/EgqUJOudrcM</a>' +
      '<iframe src="https://www.youtube.com/embed/EgqUJOudrcM" frameborder="0" class="fruum-youtube-iframe" allowfullscreen></iframe></p>\n'
    );

    expect(plugin.post_content('https://youtu.be/MoOijqT6j6o\nAce combat...nice\nhttps://youtu.be/9FyKSUgT5OI\nnice as well\n')).toEqual(
      '<p class="fruum-youtube-container"><a href="https://youtu.be/MoOijqT6j6o">https://youtu.be/MoOijqT6j6o</a>' +
      '<iframe src="https://www.youtube.com/embed/MoOijqT6j6o" frameborder="0" class="fruum-youtube-iframe" allowfullscreen></iframe></p>\n' +
      '\nAce combat...nice\n' +
      '<p class="fruum-youtube-container"><a href="https://youtu.be/9FyKSUgT5OI">https://youtu.be/9FyKSUgT5OI</a>' +
      '<iframe src="https://www.youtube.com/embed/9FyKSUgT5OI" frameborder="0" class="fruum-youtube-iframe" allowfullscreen></iframe></p>\n' +
      '\nnice as well\n'
    );
  });
});
