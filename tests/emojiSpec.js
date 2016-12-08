/* globals describe, it, expect */

var fs = require('fs'), window = {};

eval(fs.readFileSync(__dirname + '/../client/js/defs.js', 'utf8'));
eval(fs.readFileSync(__dirname + '/../client/js/emoji.js', 'utf8'));

describe('Emoji', function() {
  it('to be replacing icon', function() {
    expect(window.Fruum.emoji.convert(':D')).toBe('<span data-fruumemoji="' + window.Fruum.emoji.symbols[':D'] + '"></span>');
    expect(window.Fruum.emoji.convert(':sadface:')).toBe('<span data-fruumemoji="' + window.Fruum.emoji.symbols[':sadface:'] + '"></span>');
    expect(window.Fruum.emoji.convert('foo :sadface: bar')).toBe(
      'foo ' +
      '<span data-fruumemoji="' + window.Fruum.emoji.symbols[':sadface:'] + '"></span> ' +
      'bar'
    );
    expect(window.Fruum.emoji.convert('foo:sadface:')).toBe('foo:sadface:');
    expect(window.Fruum.emoji.convert(':sadface: :sadface:')).toBe(
      '<span data-fruumemoji="' + window.Fruum.emoji.symbols[':sadface:'] + '"></span> ' +
      '<span data-fruumemoji="' + window.Fruum.emoji.symbols[':sadface:'] + '"></span>'
    );
    expect(window.Fruum.emoji.convert(':sadface: foo :sadface:')).toBe(
      '<span data-fruumemoji="' + window.Fruum.emoji.symbols[':sadface:'] + '"></span> foo ' +
      '<span data-fruumemoji="' + window.Fruum.emoji.symbols[':sadface:'] + '"></span>'
    );
  });
});
