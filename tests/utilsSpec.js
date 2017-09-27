/* globals describe, it, expect */

var fs = require('fs'),
    JSDom = require('jsdom'),
    window = {};

eval(fs.readFileSync(__dirname + '/../client/js/defs.js', 'utf8'));
window.Fruum.libs = window.Fruum.libs || {};
window.Fruum.libs.Remarkable = require('remarkable');
window.Fruum.libs._ = require('underscore');
window.Fruum.libs.DOMPurify = require('dompurify')((new JSDom.JSDOM()).window);
var Fruum = window.Fruum;
eval(fs.readFileSync(__dirname + '/../client/js/utils.js', 'utf8'));
Fruum.require[0]();
Fruum.user = {};

describe('Links', function() {
  it('are detected', function() {
    expect(Fruum.utils.isLink('http://foo.bar')).toBe(true);
    expect(Fruum.utils.isLink('HTTPS://foo.bar')).toBe(true);
    expect(Fruum.utils.isLink('HTPS://foo.bar')).toBe(false);
  });
});

describe('Initials', function() {
  it('are extracted', function() {
    expect(Fruum.utils.getInitials('Foo junior Bar')).toBe('FJB');
    expect(Fruum.utils.getInitials('A B C D E')).toBe('ABC');
    expect(Fruum.utils.getInitials('foo')).toBe('F');
  });

  it('are displayed', function() {
    expect(Fruum.utils.printInitials('bgf')).toBe('BGF');
  });
});

describe('Tags', function() {
  it('are displayed', function() {
    expect(Fruum.utils.tagify('[Foo] junior [Bar][bar2]')).toBe(
      '<span class="fruum-tag" data-initials="F">Foo</span> junior ' +
      '<span class="fruum-tag" data-initials="B">Bar</span>' +
      '<span class="fruum-tag" data-initials="B">bar2</span>'
    );
  });
});

describe('Mentions', function() {
  it('are highlighted', function() {
    expect(Fruum.utils.mentions('Hello @foo @γιολο')).toBe(
      'Hello **@foo** **@γιολο**'
    );
  });
});

describe('Search', function() {
  it('is highlighted', function() {
    expect(Fruum.utils.printSearch('Hello {{{foo}}} {{{γιολο}}}')).toBe(
      'Hello <span class="highlight">foo</span> <span class="highlight">γιολο</span>\n'
    );
  });
});

describe('Autocomplete', function() {
  it('works for @user', function() {
    expect(Fruum.utils.autocompleteUser('Hello @foo @γιολο')).toBe(
      '@γιολο'
    );
    expect(Fruum.utils.autocompleteUser('Hello @foo bar')).toBeUndefined();
  });

  it('works for :emoji', function() {
    expect(Fruum.utils.autocompleteEmoji('Hello :foo:')).toBeUndefined();
    expect(Fruum.utils.autocompleteEmoji('Hello :')).toBeUndefined();
    expect(Fruum.utils.autocompleteEmoji('Hello :f')).toBe(':f');
    expect(Fruum.utils.autocompleteEmoji('Hello :f: bar')).toBeUndefined();
  });
});

describe('Reactions', function() {
  it('are formated', function() {
    expect(Fruum.utils.printReaction(0)).toBe('');
    expect(Fruum.utils.printReaction(1)).toBe('1');
    expect(Fruum.utils.printReaction(10)).toBe('10');
    expect(Fruum.utils.printReaction(999)).toBe('999');
    expect(Fruum.utils.printReaction(1000)).toBe('1.0K');
    expect(Fruum.utils.printReaction(1100)).toBe('1.1K');
  });
});

describe('Attachments', function() {
  it('are displayed', function() {
    expect(Fruum.utils.print('foo [[image:yo]] bar')).toBe('<p>foo [[image:yo]] bar</p>\n');
    expect(Fruum.utils.print('[[image:yo]] foo bar', [])).toBe('<p>[[image:yo]] foo bar</p>\n');
    expect(Fruum.utils.print('foo bar [[image:yo]] space [[image:yo]]', [{
      name: 'yo',
      type: 'image',
      data: 'bar',
    }])).toBe('<p>foo bar <img src="bar" alt="yo"> space <img src="bar" alt="yo"></p>\n');
  });

  it('are detected', function() {
    expect(Fruum.utils.usesAttachment('foo [[image:yo]] bar', { type: 'image', name: 'yo' })).toBe(true);
    expect(Fruum.utils.usesAttachment('foo [[image:yo]] bar', { type: 'image', name: 'yo2' })).toBe(false);
    expect(Fruum.utils.usesAttachment('foo [[image:yo]] bar', { type: 'file', name: 'yo' })).toBe(false);
  });
});

describe('Reaction tooltips', function() {
  it('are displayed', function() {
    Fruum.user.username = undefined;
    expect(Fruum.utils.printReactionTooltip('+1', [])).toBe('');
    expect(Fruum.utils.printReactionTooltip('+1', ['Joe'])).toBe('+1 by Joe');
    expect(Fruum.utils.printReactionTooltip('+1', ['Joe', 'Mike'])).toBe('+1 by Joe and Mike');
    expect(Fruum.utils.printReactionTooltip('+1', ['Joe', 'Mike', 'Nick'])).toBe('+1 by Joe, Mike and Nick');
    expect(Fruum.utils.printReactionTooltip('+1', ['Joe', 'Mike', 'Nick', 'Paul', 'Mary'])).toBe('+1 by Joe, Mike, Nick, Paul and Mary');
    expect(Fruum.utils.printReactionTooltip('+1', ['Joe', 'Mike', 'Nick', 'Paul', 'Mary', 'Rebecca'])).toBe('+1 by Joe, Mike, Nick, Paul, Mary and 1 more');
    Fruum.user.username = 'Joe';
    expect(Fruum.utils.printReactionTooltip('+1', ['Joe'])).toBe('+1 by you. Click to revoke');
    expect(Fruum.utils.printReactionTooltip('+1', ['Joe', 'Mike'])).toBe('+1 by you and Mike. Click to revoke');
    expect(Fruum.utils.printReactionTooltip('+1', ['Joe', 'Mike', 'Nick'])).toBe('+1 by you, Mike and Nick. Click to revoke');
    expect(Fruum.utils.printReactionTooltip('+1', ['Joe', 'Mike', 'Nick', 'Paul', 'Mary'])).toBe('+1 by you, Mike, Nick, Paul and Mary. Click to revoke');
    expect(Fruum.utils.printReactionTooltip('+1', ['Joe', 'Mike', 'Nick', 'Paul', 'Mary', 'Rebecca'])).toBe('+1 by you, Mike, Nick, Paul, Mary and 1 more. Click to revoke');
  });
});

describe('String utils', function() {
  it('injectString works', function() {
    expect(Fruum.utils.injectString('foo', 'bar')).toBe('foobar');
    expect(Fruum.utils.injectString('foo', 'bar', 1)).toBe('fbaroo');
    expect(Fruum.utils.injectString('foo', 'bar', 1000)).toBe('foobar');
  });

  it('padFactory works', function() {
    expect(Fruum.utils.padFactory('x', 0)).toBe('');
    expect(Fruum.utils.padFactory('x', 2)).toBe('xx');
  });

  it('startsWith works', function() {
    expect(Fruum.utils.startsWith('http://foo.com', 'http://')).toBe(true);
    expect(Fruum.utils.startsWith('http://foo.com', 'https://')).toBe(false);
    expect(Fruum.utils.startsWith('', 'https://')).toBe(false);
  });

  it('endsWith works', function() {
    expect(Fruum.utils.endsWith('http://foo.com', 'http://')).toBe(false);
    expect(Fruum.utils.endsWith('http://foo.com', '.com')).toBe(true);
    expect(Fruum.utils.endsWith('', 'https://')).toBe(false);
    expect(Fruum.utils.endsWith('yo', 'yo')).toBe(true);
  });

  it('truncateString works', function() {
    expect(Fruum.utils.truncateString('foobar', 0, 3)).toBe('bar');
    expect(Fruum.utils.truncateString('foobar', 5, 10)).toBe('fooba');
    expect(Fruum.utils.truncateString('foobar', 1, 3, '00')).toBe('f00bar');
  });
});
