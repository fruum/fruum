var plugin = require('../../plugins/notify/server');
plugin = new plugin();

describe("Notify plugin", function() {
  it("extracts mentioned users", function() {
    expect(plugin.find_mentions('@foo @bar')).toContain('foo');
    expect(plugin.find_mentions('@foo @bar')).toContain('bar');
    expect(plugin.find_mentions('@foo @bar').length).toEqual(2);
    expect(plugin.find_mentions('Hi @foo and @bar yo')).toContain('foo');
    expect(plugin.find_mentions('Hi @foo and @bar yo')).toContain('bar');
    expect(plugin.find_mentions('Hi @foo and @bar yo').length).toEqual(2);
    expect(plugin.find_mentions('@foo and @foo').length).toEqual(1);
  });
});
