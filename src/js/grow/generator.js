/**
 * L-system generator function.
 * @author dave heaton <dave@bit155.com>
 */
(function($) {
  var turtle = require('grow/turtle'),
      debug = false;
  
  /**
   * Generates the next iteration of a program.
   *
   * @param (String|Array) program a turtle program to evolve (eg. 'F' or the 
   *        result of turtle.parseProgram)
   * @param (String|Array) productions a set of production statements (eg. 
   *        'F->FF' or the result of turtle.parseProductions)
   *
   * @returns a processed program object model
   */
  function generate(options) {
    return rewrite(toProductionIndex(options.productions), toProgram(options.program)).pop();
  }

  function rewrite(productions, stmt) {
    var i, production, result = stmt, branches, node;

    if (debug) {
      console.group('rewrite()');
      console.log('Statement: ', turtle.formatProgram(stmt));
    }
    
    if ('c' in stmt) {
      // module
      production = findProduction(productions, stmt);
      if (production) {
        result = production.successor.apply(null, stmt.p ? stmt.p : []);
      }
    } else {
      // branch - rewrite each member
      branches = [];
      for (i = 0; i < stmt.length; i++) {
        node = rewrite(productions, stmt[i]);
        if (node) {
          if ('c' in node) {
            branches.push(node);
          } else {
            $.merge(branches, node);
          }
        }
      }
      result = [ branches ];
    }

    if (debug) {
      console.log('Result: ', turtle.formatProgram(result));
      console.groupEnd();
    }
    
    return result;
  }

  function findProduction(productions, module) {
    var i, result, options;
    
    if (module.c in productions) {
      options = productions[module.c];
      for (i = 0; i < options.length; i++) {
        // make sure condition evaluates to true
        if ('condition' in options[i]) {
          if (options[i].condition.apply(null, module.p) !== true) {
            continue;
          }
        }
        
        result = options[i];
        break;
      }
    }
    
    return result;
  }
  
  // =============
  // = Utilities =
  // =============
  
  function toProgram(program) {
    if (typeof program === 'string') {
      program = turtle.parseProgram(program);
    }
    return program;
  }
  
  function toProductionIndex(productions) {
    var result = {}, i, prod, vars;
    
    // either parse or clone input productions since we'll be mutating
    if (typeof productions === 'string') {
      productions = turtle.parseProductions(productions);
    } else {
      productions = $.extend(true, [], productions);
    }
    
    for (i = 0; i < productions.length; i++) {
      prod = productions[i];
      
      // replace conditions with functions
      if ('condition' in prod) {
        vars = [];
        if ('variables' in prod) {
          $.extend(vars, prod.variables);
        }
        prod.condition = eval('(function(' + vars.join(',') + ') { return ' + formatExpressionAsJavaScript(prod.condition) + '; })'); 
      }
      
      // replace successors with functions
      prod.successor = eval(formatSuccessorAsJavaScript(prod.successor));
      
      // index by command
      if (!(prod.c in result)) {
        result[prod.c] = [];
      }
      result[prod.c].push(prod);
    }
    
    return result;
  }
  
  function formatSuccessorAsJavaScript(successor) {
    var variables = [], script = [];
    
    (function process(stmt) {
      var i;
      
      if (typeof stmt != 'object') {
        throw new Error("Illegal statement: " + stmt);
      }
      
      if ('c' in stmt) {
        // module
        script.push('{');
        script.push('c:"', stmt.c, '"'); // XXX escape?
        if ('p' in stmt) {
          script.push(',', 'p:[');
          for (i = 0; i < stmt.p.length; i++) {
            if (i > 0) {
              script.push(',');
            }
            script.push(formatExpressionAsJavaScript(stmt.p[i], variables));
          }
          script.push(']')
        }
        script.push('}');
        
      } else {
        // branch
        script.push('[');
        for (i = 0; i < stmt.length; i++) {
          if (i > 0) {
            script.push(',');
          }
          process(stmt[i]);
        }
        script.push(']');
      }
    })(successor);
    
    return '(function(' + variables.join(',') + ') { return ' + script.join('') + '; })';
  }
  
  function formatExpressionAsJavaScript(expression, variables) {
    if (typeof variables === 'undefined') {
      variables = []
    }
    
    return (function process(node, vars, script) {
      if (typeof node === 'string') {
        if (vars.indexOf(node) < 0) {
          vars.push(node);
        }
        script.push(node);
      } else if (typeof node === 'number') {
        script.push(node);
      } else if (node.type === 'BinaryOperation') {
        script.push('(');
        process(node.left, vars, script);
        script.push(node.op);
        process(node.right, vars, script);
        script.push(')');
      } else if (node.type === 'UnaryOperation') {
        script.push(node.op);
        process(node.element, vars, script);
      }

      return script;
    })(expression, variables, []).join('');
  }
  
  exports.debug = function(f) {
    debug = true;
    f.apply(null, []);
    debug = false;
  };
  exports.generate = generate;
})(jQuery);