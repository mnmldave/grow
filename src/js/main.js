(function($) {
  var app = require('grow/app');
  new app.Controller();
  require('backbone').history.start();
  
  $('.button').button();
  $('.fadeout').delay(2000).fadeOut(1000);
  $('.fancybox').fancybox({
    width: 640,
    height: 480
  });
})(jQuery);
