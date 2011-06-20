(function($) {

  var parser = require('grow/parser');

  /**
   * Function for a DFS of a program using onModule, onBranchStart and 
   * onBranchEnd callbacks.
   */
  var iterateProgram = function(program, args) {
    var i, stmt, options = { onModule: function(){}, onBranchStart: function(){}, onBranchEnd: function(){} };
    
    $.extend(options, args);
    for (i = 0; i < program.length; i++) {
      stmt = program[i];
      if ('c' in stmt) {
        // module
        options.onModule(stmt.c, stmt.p);
      } else {
        // branch
        options.onBranchStart();
        iterate(stmt, options);
        options.onBranchEnd();
      }
    }
  };
  
  /**
   * Formats a single turtle program as a string.
   */
  var formatProgram = function(program) {
    var result = [];
    
    iterate(program, {
      onModule: function(c,p) { 
        result.push(c);
        if (p && p.length) {
          result.push('(');
          for (var i = 0; i < p.length; i++) {
            if (i > 0) {
              result.push(',');
            }
            // NOTE strings will need escaping if ever support strings
            result.push(p[i]);
          }
          result.push(')');
        }
      },
      onBranchStart: function() { result.push('['); }, 
      onBranchEnd: function() { result.push(']'); }
    });
    
    return result.join('');
  };
  
  var parseProgram = function(str) {
    var tree = parser.parse(str);
    
    if (!(tree && tree.type === 'Program')) {
      throw new Error("Not a program.");
    }
    
    return tree.elements[0];
  }
  
  var parseProductions = function(str) {
    var tree = parser.parse(str);
    
    if (!(tree && tree.type === 'ProductionList')) {
      throw new Error("Not a production list.");
    }
    
    return tree.elements;
  }

  exports.parseProgram = parseProgram;
  exports.parseProductions = parseProductions;
  exports.iterate = iterate;
  exports.format = format;
})(jQuery);