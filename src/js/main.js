(function($) {
  var app = require('grow/app');
  new app.Controller();
  require('backbone').history.start();

  // via http://paulirish.com/2011/requestanimationframe-for-smart-animating/
  // shim layer with setTimeout fallback
  window.requestAnimFrame = (function(){
        return  window.requestAnimationFrame       || 
                window.webkitRequestAnimationFrame || 
                window.mozRequestAnimationFrame    || 
                window.oRequestAnimationFrame      || 
                window.msRequestAnimationFrame     || 
                function(/* function */ callback, /* DOMElement */ element){
                  window.setTimeout(callback, 1000 / 60);
                };
      })();

  $('.button').button();
  $('.fadeout').delay(2000).fadeOut(1000);
})(jQuery);
