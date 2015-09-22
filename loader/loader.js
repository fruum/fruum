(function() {
  //namespace
  window.Fruum = window.Fruum || {};
  //on document read
  function ready(fn) {
    if (document.readyState != 'loading'){
      fn();
    } else {
      document.addEventListener('DOMContentLoaded', fn);
    }
  }
  //initialize loader on document ready
  ready(function() {
    if (!window.fruumSettings) return;

    //replaced by server
    window.fruumSettings.app_id = '__app_id__';

    if (window.fruumSettings.container && window.fruumSettings.fullpage == undefined) {
      window.fruumSettings.fullpage = true;
    }

    if (!window.fruumSettings.fullpage) {
      //add css
      (function() {
        //this is replaced by server
        var css = '__css__';
        var style = document.createElement('style');
        style.type = 'text/css';
        if (style.styleSheet)
          style.styleSheet.cssText = css;
        else
          style.appendChild(document.createTextNode(css));
        (document.head || document.getElementsByTagName('head')[0]).appendChild(style);
      })();

      //add html
      (function() {
        //this is replaced by server
        var html = '__html__';
        var div = document.createElement('div');
        div.innerHTML = html;
        var frag = document.createDocumentFragment();
        var child;
        while(child = div.firstChild) {
          frag.appendChild(child);
        }
        (document.body || document.getElementsByTagName('body')[0]).appendChild(frag);
      })();
    }
    else {
      //force history api on full page
      if (window.fruumSettings.history == undefined)
        window.fruumSettings.history = true;
    }

    var el_preview = document.getElementById('fruum-preview');
    var loaded = false;

    //helpers
    function is_fruum_link(node) {
      if (!node || !node.getAttribute) return;
      var href = node.getAttribute('href');
      if (href && href.indexOf('#fruum:') == 0) {
        return href.replace('#fruum:', '');
      }
    }
    function is_fruum_attr(node) {
      if (!node || !node.getAttribute) return;
      return node.getAttribute('fruum-link');
    }
    function remove_class(el, className) {
      if (!el) return;
      if (el.classList)
        el.classList.remove(className);
      else
        el.className = el.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
    }
    function add_class(el, className) {
      if (!el) return;
      if (el.classList)
        el.classList.add(className);
      else
        el.className += ' ' + className;
    }
    function has_class(el, className) {
      if (!el) return false;
      if (el.classList)
        return el.classList.contains(className);
      else
        return new RegExp('(^| )' + className + '( |$)', 'gi').test(el.className);
    }
    function bind_event(selector, event, fn) {
      var elements = document.querySelectorAll(selector);
      Array.prototype.forEach.call(elements, function(el, i){
        el.addEventListener(event, fn);
      });
    }
    function launch_fruum() {
      if (!loaded) {
        loaded = true;
        add_class(el_preview, 'fruum-clicked');
        //this is replaced by server
        var url = '__url__';
        //append fruum
        var script = document.createElement("script")
        script.type = "text/javascript";
        script.src = url + (window.fruumSettings.slim?'/fruum_slim.js':'/fruum.js') + '?app_id=' + window.fruumSettings.app_id;
        (document.head || document.getElementsByTagName("head")[0]).appendChild(script);
      }
    }
    //expose launcher
    window.Fruum.launch = function(doc_id) {
      if (window.Fruum.api) {
        window.Fruum.api.open(doc_id);
      }
      else {
        window.fruumSettings.view_id = doc_id;
        launch_fruum();
      }
    }
    function process_click(event, link) {
      if (link) {
        event && event.preventDefault();
        window.Fruum.launch(link);
      }
    }
    function process_mouseover(event, link) {
      if (link) {
        var el = document.getElementById('fruum');
        if (el && !has_class(el, 'fruum-hide')) return;
        add_class(el_preview, 'fruum-peak');
      }
    }
    function process_mouseout(event, link) {
      if (link) {
        remove_class(el_preview, 'fruum-peak');
      }
    }
    //bind event
    bind_event('a[href]', 'click', function(e) {
      process_click(e, is_fruum_link(this));
    });
    bind_event('[fruum-link]', 'click', function(e) {
      process_click(e, is_fruum_attr(this));
    });
    if (!window.fruumSettings.fullpage) {
      bind_event('a[href]', 'mouseover', function(e) {
        process_mouseover(e, is_fruum_link(this));
      });
      bind_event('a[href]', 'mouseout', function(e) {
        process_mouseout(e, is_fruum_link(this));
      });
      bind_event('[fruum-link]', 'mouseover', function(e) {
        process_mouseover(e, is_fruum_attr(this));
      });
      bind_event('a[fruum-link]', 'mouseout', function(e) {
        process_mouseout(e, is_fruum_attr(this));
      });
      //check for fruum hastag no url
      if (window.location.hash && window.fruumSettings.history) {
        if (window.location.hash.indexOf('#v/') == 0) {
          window.fruumSettings.view_id = window.location.hash.replace('#v/', '');
          launch_fruum();
        }
      }
      //check session storage
      else if (window.sessionStorage && window.sessionStorage.getItem) {
        try {
          if (window.sessionStorage.getItem('fruum:open:' + window.fruumSettings.app_id)|0) {
            launch_fruum();
          }
        }
        catch(err) {}
      }
    }
    else launch_fruum();
  });
})();
