/**
 * Pretty much just a Turtle class.
 *
 * @author Dave Heaton <dave@bit155.com>
 */
(function($) {
  var parser = require('grow/parser'),
      debug = false;

  // ==========
  // = Turtle =
  // ==========

  var Turtle = function(opts) {
    var self = this;
    self.stack = [];
  };
  
  Turtle.prototype.x = 0;
  Turtle.prototype.y = 0;
  Turtle.prototype.direction = Math.PI / 2;
  Turtle.prototype.color = '#888';
  Turtle.prototype.width = 0.5;
  
  Turtle.prototype.toJSON = function() {
    return {
      x: self.x,
      y: self.y,
      direction: self.direction,
      color: self.color,
      width: self.width,
      stack: $.extend(true, [], self.stack)
    };
  };
  
  Turtle.prototype.set = function(opts) {
    var self = this,
        attr = $.extend(true, {
          x: Turtle.prototype.x,
          y: Turtle.prototype.y,
          direction: Turtle.prototype.direction,
          color: Turtle.prototype.color,
          width: Turtle.prototype.width,
          stack: []
        }, opts);
    
    self.x = attr.x;
    self.y = attr.y;
    self.direction = attr.direction;
    self.color = attr.color;
    self.width = attr.width;
    self.stack = attr.stack;
  };
  
  /**
   * Save the current state of the turtle to its stack.
   */
  Turtle.prototype.save = function() {
    this.stack.push({ 
      x: self.x,
      y: self.y,
      direction: self.direction,
      color: self.color,
      width: self.width
    });
  };
  
  /**
   * Restore the turtle to it's previous saved state on the stack.
   */
  Turtle.prototype.restore = function() {
    var state = this.stack.pop();
    if (state) {
      $.extend(this, state);
    }
  };
  
  Turtle.prototype.draw = function(ctx, program, from, to) {
    var self = this,
        i,
        module,
        command;
    
    program = toProgram(program);
    
    from = from || 0;
    to = to || program.length;
    
    ctx.save();
    ctx.strokeStyle = self.color;
    ctx.lineWidth = self.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.rotate(Math.PI);
    for (i = from; i < to; i++) {
      module = program[i];
      command = self.commands[module.c];
      if (command) {
        command.execute(self, module.p || [], ctx);
      }
    }
    ctx.restore();
    
    return self;
  };
  
  /**
   * Move the turtle forward by some number of units.
   *
   * @param (Number) distance in units
   */
  Turtle.prototype.move = function(distance) {
    this.x = this.x + (Math.cos(this.direction) * distance);
    this.y = this.y + (Math.sin(this.direction) * distance);
  };
  
  /**
   * Rotate the turtle by some radians.
   *
   * @param (Number) radians
   */
  Turtle.prototype.rotate = function(radians) {
    this.direction += radians;
  };

  /**
   * A map of commands the turtle can perform. You can extend this map however
   * you want. The options for a command are:
   *
   *   - `execute` (required) is a function that accepts a turtle, params, and
   *      canvas context as arguments and updates the turtle state and/or
   *      the context accordingly
   *
   * @param (Number) distance in units
   */
  Turtle.prototype.commands = {
    '[': {
      execute: function(turtle) {
        turtle.save();
      }
    },
    ']': {
      execute: function(turtle) {
        turtle.restore();
      }
    },
    'F': {
      execute: function(turtle, params, ctx) {
        ctx.beginPath();
        ctx.moveTo(turtle.x, turtle.y);
        turtle.move(params.length > 0 ? params[0] : 10);
        ctx.lineTo(turtle.x, turtle.y);
        ctx.stroke();
      }
    },
    'f': {
      execute: function(turtle, params) {
        turtle.move(params.length > 0 ? params[0] : 10);
      }
    },
    '+': {
      execute: function(turtle, params) {
        turtle.rotate((params.length > 0 ? params[0] : 90) * (Math.PI / 180));
      }
    },
    '-': {
      execute: function(turtle, params) {
        turtle.rotate((params.length > 0 ? params[0] : 90) * (Math.PI / 180) * -1);
      }
    }
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
    var productions = toProductionIndex(options.productions), 
        program = toProgram(options.program),
        result = [],
        i,
        module,
        production,
        replacement;

    for (i = 0; i < program.length; i++) {
      module = program[i];
      production = findProduction(productions, module);
      if (production) {
        replacement = production.successor.apply(null, module.p ? module.p : []);
        if (replacement) {
          Array.prototype.push.apply(result, replacement);
        }
      } else {
        result.push(module);
      }
    }
    
    return result;
  };

  // =========
  // = Utils =
  // =========

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
  
  var formatSuccessorAsJavaScript = function(successor) {
    var variables = [], script = [], module, i, j;
    
    script.push('[');
    for (i = 0; i < successor.length; i++) {
      module = successor[i];
      
      if (i > 0) {
        script.push(',');
      }
      script.push('{');
      script.push('c:"', module.c, '"'); // XXX escape?
      if ('p' in module) {
        script.push(',', 'p:[');
        for (j = 0; j < module.p.length; j++) {
          if (j > 0) {
            script.push(',');
          }
          script.push(formatExpressionAsJavaScript(module.p[j], variables));
        }
        script.push(']');
      }
      script.push('}');
    }
    script.push(']');
    
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
  
  var findProduction = function(productions, module) {
    var i, nodes, node;
    
    if (module.c in productions) {
      nodes = productions[module.c];
      
      for (i = 0; i < nodes.length; i++) {
        node = nodes[i];
        
        // make sure condition evaluates to true
        if ('condition' in node) {
          if (node.condition.apply(null, module.p) !== true) {
            continue;
          }
        }
        
        // make sure pre/post are valid
        if ('pre' in node) {
          if (i > 0 && nodes[i - 1].c !== node.pre) {
            continue;
          }
        }
        if ('post' in node) {
          if (i < (nodes.length - 1) && nodes[i + 1].c !== node.post) {
            continue;
          }
        }
        
        return node;
      }
    }
    
    return false;
  };
  
  // ===========
  // = Exports =
  // ===========
  
  exports.Turtle = Turtle;
  exports.parseProgram = parseProgram;
  exports.parseProductions = parseProductions;
  exports.generate = generate;
  exports.debug = function(f) {
    debug = true;
    try {
      f();
    } finally {
      debug = false;
    }
  };
})(jQuery);