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
  Turtle.prototype.width = 1;
  
  /**
   * Returns some turtle properties as a JSON-friendly object.
   */
  Turtle.prototype.toJSON = function() {
    var self = this;
    return {
      x: self.x,
      y: self.y,
      direction: self.direction,
      color: self.color,
      width: self.width,
      stack: $.extend(true, [], self.stack)
    };
  };
  
  /**
   * Sets properties of the turtle from the given object.
   */
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
    var self = this;
    self.stack.push({ 
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
    var self = this,
        state = self.stack.pop();
        
    if (state) {
      $.extend(self, state);
    }
  };
  
  /**
   * Draws a turtle program, or program segment, to a canvas context.
   *
   * @param (Context) ctx canvas context
   * @param (Array|String) program to draw
   * @param (Integer) from where in the program to start drawing (inclusive)
   * @param (Integer) to program index the turtle should draw up to (exclusive)
   */
  Turtle.prototype.draw = function(ctx, program, from, to) {
    var self = this,
        i,
        module,
        command;
    
    program = toProgram(program);
    
    from = Math.max(0, from || 0);
    to = Math.min(program.length, to || program.length);
    
    ctx.strokeStyle = self.color;
    ctx.lineWidth = self.width;
    ctx.moveTo(self.x, self.y);
    
    for (i = from; i < to; i++) {
      module = program[i];
      command = self.commands[module.c];
      if (command) {
        command.execute(self, module.p || [], ctx);
      }
    }
    
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
   *   - `description` (optional) a brief description of what the command does
   *   - `params` (optional) an array of objects, each describing a parameter
   *      - `alias` an alias for the parameter
   *      - `description` a brief description of the parameter
   *
   * @param (Number) distance in units
   */
  Turtle.prototype.commands = {
    '[': {
      description: 'Starts a branch.',
      execute: function(turtle, params, ctx) {
        turtle.save();
      }
    },
    
    ']': {
      description: 'Ends a branch.',
      execute: function(turtle, params, ctx) {
        turtle.restore();
        ctx.moveTo(turtle.x, turtle.y);
      }
    },
    
    'F': {
      description: 'Moves the turtle forward and draws a line.',
      params: [ 
        { alias: 'n', description: 'number of points to move (default: 10)' } 
      ],
      execute: function(turtle, params, ctx) {
        ctx.beginPath();
        ctx.moveTo(Math.round(turtle.x), Math.round(turtle.y));
        turtle.move(params.length > 0 ? params[0] : 5);
        ctx.lineTo(Math.round(turtle.x), Math.round(turtle.y));
        ctx.stroke();
      }
    },
    
    'f': {
      description: 'Moves the turtle forward without drawing a line.',
      params: [ 
        { alias: 'n', description: 'number of points to move (default: 10)' } 
      ],
      execute: function(turtle, params) {
        turtle.move(params.length > 0 ? params[0] : 5);
      }
    },
    
    '+': {
      description: 'Turns the turtle right.',
      params: [ 
        { alias: 'n', description: 'number of degrees to turn (default: 90)' } 
      ],
      execute: function(turtle, params) {
        turtle.rotate((params.length > 0 ? params[0] : 90) * (Math.PI / 180) * -1);
      }
    },
    
    '-': {
      description: 'Turns the turtle left.',
      params: [ 
        { alias: 'n', description: 'number of degrees to turn (default: 90)' } 
      ],
      execute: function(turtle, params) {
        turtle.rotate((params.length > 0 ? params[0] : 90) * (Math.PI / 180));
      }
    }
  };
  
  // ============
  // = Generate =
  // ============
  
  /**
   * Generates the next iteration of a program by applying rewrite rules
   * (productions) to a program.
   *
   * @param (String|Array) program a turtle program to evolve (eg. 'F' or the 
   *        result of parseProgram)
   * @param (String|Array) productions a set of production statements (eg. 
   *        'F->FF' or the result of parseProductions)
   *
   * @returns the new rewritten program
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

  // Parses a program string and returns the array representing that program's
  // modules.
  var parseProgram = function(str) {
    var tree = parser.parse(str);
    
    if (!(tree && tree.type === 'Program')) {
      throw new Error("Not a program.");
    }
    
    return tree.elements;
  };
  
  // Parses a productions string and returns an array containing production
  // rules.
  var parseProductions = function(str) {
    var tree = parser.parse(str);
    
    if (!(tree && tree.type === 'ProductionList')) {
      throw new Error("Not a production list.");
    }
    
    return tree.elements;
  };
  
  // Returns the parsed version of a program. If the input is already parsed,
  // just returns it verbatim.
  var toProgram = function(program) {
    if (typeof program === 'string') {
      program = parseProgram(program);
    }
    return program;
  };
  
  // Returns an index of productions, keyed by command.
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
  
  // Returns eval'able javascript containing a function which, when called
  // with the parameters of a module, will return an array of replacement 
  // modules.
  var formatSuccessorAsJavaScript = function(successor) {
    var variables = [], script = [], module, i, j;
    
    script.push('[');
    for (i = 0; i < successor.length; i++) {
      module = successor[i];
      
      if (i > 0) {
        script.push(',');
      }
      
      script.push('{');
      script.push('c:"', module.c, '"');
      if ('p' in module) {
        script.push(',p:[');
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
  
  // Returns eval'able javascript that evaluates some expression (such as
  // "a+2" or "a||b" or "x>y"). Records all unbound variables in the given 
  // variables array.
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
  
  // Returns a production that applies to some module.
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
  
  // A mock canvas context object that can be used by a Turtle when you don't
  // want to actually draw anything. Don't use this please.
  var MockContext = function() {
    var self = this,
        methods = [
              'save', 'restore',
              'scale', 'rotate', 'translate', 'transform', 'setTransform',
              'clearRect', 'fillRect', 'strokeRect',
              'beginPath', 'moveTo', 'closePath', 'lineTo', 'quadraticCurveTo', 'bezierCurveTo', 'arcTo', 'arc', 'rect', 'fill', 'stroke', 'clip'
            ];
    _.each(methods, function(m) {
      self[m] = (function() {});
    });
  };
  MockContext.prototype.__noSuchMethod__ = function() {};
  
  // ===========
  // = Exports =
  // ===========
  
  exports.Turtle = Turtle;
  exports.MockContext = MockContext;
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