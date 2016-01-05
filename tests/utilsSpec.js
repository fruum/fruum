
var fs = require('fs'), window = {};

eval(fs.readFileSync(__dirname + '/../client/js/defs.js', 'utf8'));
window.Fruum.libs = window.Fruum.libs || {};
window.Fruum.libs.marked = require('marked');
window.Fruum.libs._ = require('underscore');
Fruum = window.Fruum;
eval(fs.readFileSync(__dirname + '/../client/js/utils.js', 'utf8'));
Fruum.require[0]();

describe("Links", function() {
  it("are detected", function() {
    expect(Fruum.utils.isLink('http://foo.bar')).toBe(true);
    expect(Fruum.utils.isLink('HTTPS://foo.bar')).toBe(true);
    expect(Fruum.utils.isLink('HTPS://foo.bar')).toBe(false);
  });
});

describe("Initials", function() {
  it("are extracted", function() {
    expect(Fruum.utils.getInitials('Foo junior Bar')).toBe('FJB');
    expect(Fruum.utils.getInitials('foo')).toBe('F');
  });

  it("are displayed", function() {
    expect(Fruum.utils.printInitials('bgf')).toBe('BGF');
  });
});

describe("Tags", function() {
  it("are displayed", function() {
    expect(Fruum.utils.tagify('[Foo] junior [Bar][bar2]')).toBe(
      '<span class="fruum-tag" data-initials="F">Foo</span> junior ' +
      '<span class="fruum-tag" data-initials="B">Bar</span>' +
      '<span class="fruum-tag" data-initials="B">bar2</span>'
    );
  });
});

describe("Mentions", function() {
  it("are highlighted", function() {
    expect(Fruum.utils.mentions('Hello @foo @γιολο')).toBe(
      'Hello **@foo** **@γιολο**'
    );
  });
});

describe("Autocomplete", function() {
  it("works for @user", function() {
    expect(Fruum.utils.autocompleteUser('Hello @foo @γιολο')).toBe(
      '@γιολο'
    );
    expect(Fruum.utils.autocompleteUser('Hello @foo bar')).toBeUndefined();
  });
  it("works for :emoji", function() {
    expect(Fruum.utils.autocompleteEmoji('Hello :foo:')).toBeUndefined();
    expect(Fruum.utils.autocompleteEmoji('Hello :')).toBeUndefined();
    expect(Fruum.utils.autocompleteEmoji('Hello :f')).toBe(':f');
    expect(Fruum.utils.autocompleteEmoji('Hello :f: bar')).toBeUndefined();
  });
});

describe("Reactions", function() {
  it("are formated", function() {
    expect(Fruum.utils.printReaction(0)).toBe('');
    expect(Fruum.utils.printReaction(1)).toBe('1');
    expect(Fruum.utils.printReaction(10)).toBe('10');
    expect(Fruum.utils.printReaction(999)).toBe('999');
    expect(Fruum.utils.printReaction(1000)).toBe('1.0K');
    expect(Fruum.utils.printReaction(1100)).toBe('1.1K');
  });
});

describe("Attachments", function() {
  it("are displayed", function() {
    expect(Fruum.utils.print('foo [[image:yo]] bar')).toBe('<p>foo [[image:yo]] bar</p>\n');
    expect(Fruum.utils.print('[[image:yo]] foo bar', [])).toBe('<p>[[image:yo]] foo bar</p>\n');
    expect(Fruum.utils.print('foo bar [[image:yo]] space [[image:yo]]', [{
      name: 'yo',
      type: 'image',
      data: 'bar'
    }])).toBe('<p>foo bar <img src="bar" alt="yo"> space <img src="bar" alt="yo"></p>\n');
  });
  it("are detected", function() {
    expect(Fruum.utils.usesAttachment('foo [[image:yo]] bar', { type: 'image', name: 'yo' })).toBe(true);
    expect(Fruum.utils.usesAttachment('foo [[image:yo]] bar', { type: 'image', name: 'yo2' })).toBe(false);
    expect(Fruum.utils.usesAttachment('foo [[image:yo]] bar', { type: 'file', name: 'yo' })).toBe(false);
  });
});
