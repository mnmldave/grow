/**
 * High-level encapsulation of the Turtle functionality, from parsing Turtle
 * grammars to producing vector instruction language, to rendering to a 
 * canvas.
 */
(function($) {
  var parser = require('grow/parser'),
      generator = require('grow/generator'),
      vectorizor = require('grow/vectorizor');

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
  
  var update = function(tree) {
    if (tree.iterations > 0) {
      tree.program = generator.generate({
        productions: tree.productions,
        program: tree.program
      });
      tree.vector = vectorizor.vectorize(tree.program);
      tree.iterations = tree.iterations - 1;
    }
    
    return tree;
  };

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
          default:
            throw new Error("Unrecognized instruction: " + c);
        }
      }
      ctx.restore();
    }
  };

  exports.update = update;
  exports.render = render;

  // private advanced api
  exports.parseProgram = parseProgram;
  exports.parseProductions = parseProductions;
  exports.iterateProgram = iterateProgram;
  exports.formatProgram = formatProgram;
})(jQuery);