(function() {
  var GrowApp = require('grow/app'),
      Backbone = require('backbone');

  new GrowApp.Controller();
  Backbone.history.start();
})();
