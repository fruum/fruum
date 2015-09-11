window.Fruum = window.Fruum || {};
window.Fruum.libs = window.Fruum.libs || {};
window.Fruum.libs.$ = $.noConflict(true);
window.Fruum.libs._ = _.noConflict();
window.Fruum.libs.Backbone = Backbone.noConflict();
window.Fruum.libs.Marionette = Marionette.noConflict();
window.Fruum.libs.io = window.io;
window.Fruum.libs.moment = window.moment;
window.Fruum.libs.marked = window.marked;

delete window.io;
delete window.moment;
delete window.marked;
if (window.___socket_io___)
  window.io = window.___socket_io___;
if (window.__momentjs__)
  window.moment = window.__momentjs__;
if (window.__markedjs__)
  window.marked = window.__markedjs__;
delete window.___socket_io___;
delete window.__momentjs__;
delete window.__markedjs__;
