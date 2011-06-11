(function() {
  var Backbone = require('backbone'),
      GrowSystem = require('grow/system');
  
  exports.AppController = Backbone.Controller.extend({
    routes: {
      '': 'index'
    },

    initialize: function(options) {
      _.bindAll(this, 'index');
      this.system = new GrowSystem.Bracketed();
    },
    
    index: function() {
      console.log(this);
    }
  });
})();
