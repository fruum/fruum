/* globals describe, it, expect */

var email = require('../../server/backends/email/base');
email = new email(); // eslint-disable-line

describe('inlineCSS', function() {
  it('works', function() {
    var html = '<html><head><style>body { color: red; }</style></head><body>foo</body></html>';
    expect(email.inlineCSS(html)).toBe(
      '<html><head></head><body style="color: red;">foo</body></html>'
    );
  });
});
