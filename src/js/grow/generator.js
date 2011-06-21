/**
 * L-system generator function.
 * @author dave heaton <dave@bit155.com>
 */
(function($) {
  var turtle = require('grow/turtle');
  
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
    var result = [], i, program, productions;
    
    program = toProgram(options.program);
    productions = toProductionIndex(options.productions);

    for (i = 0; i < program.length; i++) {
      $.merge(result, expand(productions, program, i));
    }

    return result;
  }

  function expand(productions, program, index) {
    var prod, 
        stmt,
        result;
    
    stmt = program[index];
    if ('c' in stmt) {
      // module
      prod = findProduction(productions, program, index);
      if (prod) {
        if ('p' in stmt) {
          result = prod.successor.apply(null, stmt.p);
        } else {
          result = prod.successor();
        }

        if (!result) {
          result = [];
        }
      } else {
        result = [ stmt ];
      }
    } else {
      // branch
      result = [ generate(productions, stmt) ];
    }
    
    return result;
  }

  function findProduction(productions, program, index) {
    var i, module, result, options;
    
    module = program[index];
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
  
  
  
  exports.generate = generate;
})(jQuery);