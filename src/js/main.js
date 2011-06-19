(function($) {
  var GrowApp = require('grow/app'),
      Backbone = require('backbone');

  new GrowApp.Controller();
  Backbone.history.start();
  
  $('#logo').delay(100).fadeIn(2000);
})(jQuery);
