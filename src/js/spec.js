(function($) {
  require('grow/parser.spec');
  require('grow/lsystem.spec');
  jasmine.getEnv().addReporter(new jasmine.TrivialReporter());
  jasmine.getEnv().execute();
})(jQuery);
