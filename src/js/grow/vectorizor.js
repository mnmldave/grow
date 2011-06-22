(function($) {
  var turtle = require('grow/turtle');
  
  var debug = false;
  var move = function(location, direction, distance) {
    location[0] = location[0] + (Math.cos(direction) * distance);
    location[1] = location[1] + (Math.sin(direction) * distance);
  };
  
  /**
   * Optimizes a program.
   */
  var optimize = function(program) {
    return compressDraws($.extend(true, [], program));
  };
  
  /**
   * Compresses adjacent drawing instructions.
   */
  var compressDraws = function(program) {
    var i, stmt;
    
    // TODO ignoring branches, replace all adjacent F operations with one,
    // then prefix each branch with an 'f' that will
    for (i = 0; i < program.length; i++) {
      stmt = program[i];
      if ('c' in stmt) {
        // module
        if (stmt.c === 'F') {
        }
      } else {
        // branch
      }
    }
    
    return program;
  };
  

  /**
   * Compiles a turtle program into an array of move and line instructions
   * suitable for rendering. The supported turtle modules are:
   *
   *   F(n) - move the turtle forward n points while drawing a line
   *   f(n) - move forward n points without drawing
   *   +(r) - rotate the turtle r degrees
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

    // traverse optimized program and append instructions
    turtle.iterateProgram(optimize(program), {
      onModule: function(c, p) {
        switch(c) {
          case 'F':
            // draw a line x points forward and then move
            result.push('p',
                        'm', state.loc[0], state.loc[1]);
            move(state.loc, state.dir, p[0]);
            result.push('l', state.loc[0], state.loc[1],
                        's');
            break;
          case 'f':
            // move x points
            move(state.loc, state.dir, p[0]);
            break;
          case '+':
            // rotate by x degrees
            state.dir += p[0] * Math.PI / 180;
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
  
  exports.debug = function(f) {
    debug = true;
    f.apply(null);
    debug = false;
  };
  exports.vectorize = vectorize;
})(jQuery);