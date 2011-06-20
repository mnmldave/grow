(function($) {
  require('grow/turtle.spec');
  require('grow/generator.spec');
  jasmine.getEnv().addReporter(new jasmine.TrivialReporter());
  jasmine.getEnv().execute();
})(jQuery);
