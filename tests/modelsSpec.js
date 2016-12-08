/* globals describe, it, expect */

var Models = require('../server/models');

describe('Application model', function() {
  it('share url works', function() {
    var app = new Models.Application({
      pushstate: false,
      fullpage_url: 'www.example.com',
    });
    expect(app.getShareURL('foo')).toBe('www.example.com#v/foo');

    app.set('pushstate', true);
    expect(app.getShareURL('foo')).toBe('www.example.com/v/foo');

    app.set('fullpage_url', 'www.example.com/bar/');
    expect(app.getShareURL('foo')).toBe('www.example.com/bar/v/foo');
  });
});
