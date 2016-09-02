window.Fruum = window.Fruum || {};
window.Fruum.libs = window.Fruum.libs || {};
window.Fruum.libs.$ = $.noConflict(true);
window.Fruum.libs._ = _.noConflict();
window.Fruum.libs.Backbone = Backbone.noConflict();
window.Fruum.libs.Marionette = Marionette.noConflict();
window.Fruum.libs.io = window.io;
window.Fruum.libs.moment = window.moment;
window.Fruum.libs.Remarkable = window.Remarkable;
window.Fruum.libs.DOMPurify = window.DOMPurify;
window.Fruum.libs.toMarkdown = window.toMarkdown;

delete window.io;
delete window.moment;
delete window.Remarkable;
delete window.DOMPurify;
delete window.toMarkdown;

if (window.___socket_io___)
  window.io = window.___socket_io___;
if (window.__momentjs__)
  window.moment = window.__momentjs__;
if (window.__remarkablejs__)
  window.Remarkable = window.__remarkablejs__;
if (window.__dompurify__)
  window.DOMPurify = window.__dompurify__;
if (window.__toMarkdown__)
  window.toMarkdown = window.__toMarkdown__;

delete window.___socket_io___;
delete window.__momentjs__;
delete window.__remarkablejs__;
delete window.__dompurify__;
delete window.__toMarkdown__;

if (window.__define__) {
	window.define = window.__define__;
	delete window.__define__;
}
if (window.__exports__) {
	window.exports = window.__exports__;
	delete window.__exports__;
}
