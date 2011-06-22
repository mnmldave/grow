(function($) {
  require('grow/turtle.spec');
  require('grow/generator.spec');
  require('grow/vectorizor.spec');
  jasmine.getEnv().addReporter(new jasmine.TrivialReporter());
  jasmine.getEnv().execute();
})(jQuery);
