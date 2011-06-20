(function($) {
  require('grow/turtle.spec');
  jasmine.getEnv().addReporter(new jasmine.TrivialReporter());
  jasmine.getEnv().execute();
})(jQuery);
