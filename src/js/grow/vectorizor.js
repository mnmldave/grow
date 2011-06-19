(function($) {
  var Turtle = require('grow/turtle');
  
  var move = function(location, direction, distance) {
    location[0] = location[0] + (Math.cos(direction) * distance);
    location[1] = location[1] + (Math.sin(direction) * distance);
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

    // always move to the origin first
    result.push('m', 0, 0);
    
    // traverse program and append instructions
    Turtle.iterate(program, {
      onModule: function(c, p) {
        switch(c) {
          case 'F':
            // draw a line x points forward and then move
            move(state.loc, state.dir, p[0]);
            result.push('l', state.loc[0], state.loc[1], 
                        'm', state.loc[0], state.loc[1]);
            break;
          case 'f':
            // move x points
            move(state.loc, state.dir, p[0]);
            result.push('m', state.loc[0], state.loc[1]);
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
  
  exports.vectorize = vectorize;
})(jQuery);