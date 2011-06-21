(function($) {
  var app = require('grow/app');
  new app.Controller();
  require('backbone').history.start();
  
  $('.fadein').delay(100).fadeIn(1000);
  $('.fancybox').fancybox({
    width: 640,
    height: 480
  });
})(jQuery);
