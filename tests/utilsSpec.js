
var fs = require('fs'), window = {};

eval(fs.readFileSync(__dirname + '/../client/js/defs.js', 'utf8'));
window.Fruum.libs = window.Fruum.libs || {};
window.Fruum.libs.marked = require('marked');
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
