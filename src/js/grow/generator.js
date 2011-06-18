/**
 * L-system generator function.
 * @author dave heaton <dave@bit155.com>
 */
(function($) {
  
  function generate(productions, program) {
    var result = [], i, j;

    for (i = 0; i < program.length; i++) {
      $.merge(result, expand(productions, program, i));
    }

    return result;
  }

  /**
   * Expands a program module using the given production rules.
   */
  function expand(productions, program, index) {
    var p, 
        stmt,
        result;
    
    stmt = program[index];
    if ('c' in stmt) {
      // module
      p = production(productions, program, index);
      if (p) {
        if ('p' in stmt) {
          result = p.successor.apply(null, stmt.p);
        } else {
          result = p.successor();
        }

        if (!result) {
          result = [];
        }
      } else {
        result = [ stmt ];
      }
    } else {
      // branch
      result = generate(productions, stmt);
    }
    
    return result;
  }

  /**
   * Returns the production rule pertaining to a particular program module.
   */
  function production(productions, program, index) {
    var i, module, result, options;
    
    module = program[index];
    if (module.c in productions) {
      options = productions[module.c];
      for (i = 0; i < options.length; i++) {
        // TODO probability support
        if ('condition' in options[i]) {
          if (options[i]['condition'].apply(null, module.p) === true) {
            result = options[i];
            break;
          }
        } else {
          result = options[i];
          break;
        }
      }
    }
    
    return result;
  }
  
  /**
   * Returns the result of applying deterministic production rules to a 
   * string.
   *
   * @param (Object) productions mapping
   * @param (Array) program to apply the productions to
   */
  exports.generate = generate;
  
})(jQuery);