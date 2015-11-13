/******************************************************************************
 Mozilla persona login
*******************************************************************************/

(function() {
  'use strict';
  window.Fruum.plugins.push(function () {
    var $ = window.Fruum.libs.$;
    //called before the app is initialized
    this.init = function(root_view) {
      if (window.fruumSettings.sso) return;

      //load persona
      $('body').append('<script src="//login.persona.org/include.js"></script>');
      //link login button with persona login
      window.fruumSettings.login = 'javascript:window.Fruum.mozillaPersona();';
      //login callback
      window.Fruum.mozillaPersona = function() {
        navigator.id.watch({
          onlogin: function(assertion) {
            $.ajax({
              type: 'POST',
              url: window.fruumSettings.fruum_host + '/persona/login',
              data: {
                assertion: assertion,
                hostname: window.location.hostname,
                port: window.location.port,
                protocol: window.location.protocol,
                app_id: window.fruumSettings.app_id
              },
            }).done(function(data) {
              window.FruumData = window.FruumData || [];
              window.FruumData.push({
                user: data
              });
            }).fail(function() {
              navigator.id.logout();
            });
          },
          onlogout: function() {
            //noop
          }
        });
        navigator.id.request();
      }
    }
  });
})();
