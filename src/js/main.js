(function() {
  var GrowApp = require('grow/app'),
      Backbone = require('backbone');

  new GrowApp.AppController();
  Backbone.history.start();
})();
