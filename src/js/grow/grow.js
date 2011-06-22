/**
 * Module that provides `update` and `render` methods for updating the state 
 * of a "tree" object and rendering it to a canvas, respectively.
 *
 * A tree object is typically instantiated with the number of rewrite 
 * iterations, the initial program string, and a string of production rules.
 * For example, a simple tree that just produces a long vertical line:
 *
 *     { iterations: 5, program: 'F(5)', productions: 'F -> F(n)F(n)' }
 *
 * After passing through update, the tree's program and productions will be
 * replaced with a compiled tree representation and a 'vector' attribute will
 * be added indicating rendering instructions.
 *
 * @author Dave Heaton <dave@bit155.com>
 */
(function($) {
  var parser = require('grow/parser'),
      debug = false;

  // =========
  // = Utils =
  // =========

  /**
   * Function for a DFS of a program using onModule, onBranchStart and 
   * onBranchEnd callbacks.
   */
  var iterateProgram = function(program, args) {
    var i, stmt, options = { onModule: function(){}, onBranchStart: function(){}, onBranchEnd: function(){} };
    
    $.extend(options, args);
    if (program && 'c' in program) {
      // module
      options.onModule(program.c, program.p);
    } else {
      // branch
      for (i = 0; i < program.length; i++) {
        stmt = program[i];
        if ('c' in stmt) {
          // module
          options.onModule(stmt.c, stmt.p);
        } else {
          // branch
          options.onBranchStart();
          iterateProgram(stmt, options);
          options.onBranchEnd();
        }
      }
    }
  };
  
  /**
   * Formats a single turtle program as a string.
   */
  var formatProgram = function(program) {
    var result = [];
    
    iterateProgram(program, {
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
    
    return tree.elements;
  };
  
  var parseProductions = function(str) {
    var tree = parser.parse(str);
    
    if (!(tree && tree.type === 'ProductionList')) {
      throw new Error("Not a production list.");
    }
    
    return tree.elements;
  };
  
  var toProgram = function(program) {
    if (typeof program === 'string') {
      program = parseProgram(program);
    }
    return program;
  };
  
  var toProductionIndex = function(productions) {
    var result = {}, i, prod, vars;
    
    // either parse or clone input productions since we'll be mutating
    if (typeof productions === 'string') {
      productions = parseProductions(productions);
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
  };
  
  /**
   * Returns a javascript function (as a string) that can be applied to a
   * turtle module (eg. "F(2)") to get the rewritten version.
   */
  var formatSuccessorAsJavaScript = function(successor) {
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
          script.push(']');
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
  };
  
  var formatExpressionAsJavaScript = function(expression, variables) {
    if (typeof variables === 'undefined') {
      variables = [];
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
  };
  
  // ============
  // = Generate =
  // ============
  
  /**
   * Generates the next iteration of a program.
   *
   * @param (String|Array) program a turtle program to evolve (eg. 'F' or the 
   *        result of parseProgram)
   * @param (String|Array) productions a set of production statements (eg. 
   *        'F->FF' or the result of parseProductions)
   *
   * @returns a processed program object model
   */
  var generate = function(options) {
    return rewrite(toProductionIndex(options.productions), toProgram(options.program)).pop();
  };

  /**
   * Rewrites a statement using the specified productions.
   */
  var rewrite = function(productions, stmt) {
    var i, production, result = stmt, branches, node;

    if (debug) {
      console.group('rewrite()');
      console.log('Statement: ', formatProgram(stmt));
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
      console.log('Result: ', formatProgram(result));
      console.groupEnd();
    }
    
    return result;
  };

  var findProduction = function(productions, module) {
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
  };

  // =============
  // = Vectorize =
  // =============

  /**
   * Compiles a turtle program into an array of move and line instructions
   * suitable for rendering. The supported turtle modules are:
   *
   *   F(n) - move the turtle forward n points while drawing a line
   *   f(n) - move forward n points without drawing
   *   +(r) - rotate the turtle r degrees
   *   w(n) - set the stroke width to n pixels
   *
   * The output array simply consists of instructions where each instruction
   * is followed by some prescribed number of arguments. The only instructions
   * are:
   *
   *   m - move cursor to point (x,y)
   *   l - draw a line to point (x,y)
   *
   * For example, the array [ 'm', 0, 0, 'l', 20, 20 ] would indicate to the
   * renderer to draw a line from the origin (0,0) to point (20,20).
   */
  var vectorize = function(program) {
    var result = [], 
        stack = [],
        state = {
          loc: [0, 0],
          dir: Math.PI / 2
        };

    var move = function(location, direction, distance) {
      location[0] = location[0] + (Math.cos(direction) * distance);
      location[1] = location[1] + (Math.sin(direction) * distance);
    };

    // traverse optimized program and append instructions
    iterateProgram(program, {
      onModule: function(c, p) {
        switch(c) {
          case 'F':
            // draw a line x points forward and then move
            result.push('p', 'm', state.loc[0], state.loc[1]);
            move(state.loc, state.dir, p[0]);
            result.push('l', state.loc[0], state.loc[1], 's');
            break;
          case 'f':
            // move x points
            move(state.loc, state.dir, p[0]);
            break;
          case '+':
            // rotate by x degrees
            state.dir += p[0] * Math.PI / 180;
            break;
          case '-':
            // rotate by -x degrees
            state.dir += p[0] * Math.PI / -180;
            break;
          case 'w':
            // set stroke width
            result.push('w', p[0]);
            break;
        }
      }, 
      
      onBranchStart: function() {
        stack.push($.extend(true, {}, state));
      },
      
      onBranchEnd: function() {
        state = stack.pop();
      }
    });
    
    return result;
  };

  // ==========
  // = Update =
  // ==========
  
  var update = function(tree) {
    if (tree.iterations > 0) {
      tree.program = generate({
        productions: tree.productions,
        program: tree.program
      });
      tree.vector = vectorize(tree.program);
      tree.iterations = tree.iterations - 1;
    }
    
    return tree;
  };

  // ==========
  // = Render =
  // ==========

  var render = function(tree, canvas) {
    var self = this,
        ctx,
        vector = tree.vector,
        i, c;

    if (vector) {
      ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.save();
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 0.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.translate(ctx.canvas.width / 2, ctx.canvas.height);
      ctx.rotate(Math.PI);
    
      for (i = 0; i < vector.length; i++) {
        c = vector[i];
        switch (c) {
          case 'p':
            ctx.beginPath();
            break;
          case 's':
            ctx.stroke();
            break;
          case 'm':
            // move to (x,y)
            ctx.moveTo(vector[++i], vector[++i]);
            break;
          case 'l':
            // draw a line to (x,y)
            ctx.lineTo(vector[++i], vector[++i]);
            break;
          case 'w':
            // set stroke width
            ctx.lineWidth = vector[++i];
            break;
          default:
            throw new Error("Unrecognized instruction: " + c);
        }
      }
      ctx.restore();
    }
  };

  exports.parseProgram = parseProgram;
  exports.parseProductions = parseProductions;
  exports.generate = generate;
  exports.vectorize = vectorize;
  exports.update = update;
  exports.render = render;
  exports.debug = function(f) {
    debug = true;
    try {
      f();
    } finally {
      debug = false;
    }
  };
})(jQuery);