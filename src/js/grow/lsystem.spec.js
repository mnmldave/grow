(function() {
  var lsystem = require('grow/lsystem'),
      parser = require('grow/parser');

  describe("lsystem", function() {
    
    // ===========
    // = Rewrite =
    // ===========
    
    describe("rewrite", function() {
      // Utitility for generating some number of generations of a program.
      function generate(program, productions, generations) {
        var i, n = (generations ? generations : 1);

        for (i = 0; i < n; i++) {
          program = lsystem.rewrite({ program: program, productions: productions });
        }

        return program;
      }
      
      it("should die on production with no LHS", function() {
        expect(function() { generate('F', 'F'); }).toThrow();
      });

      it("should generate from identity", function() {
        expect(generate('F', 'F->F')).toEqual([ {c: 'F' } ]);
        expect(generate('F(7)', 'F(t)->F(t)')).toEqual([ {c: 'F', p: [7] } ]);
      });

      it("should generate from doubling", function() {
        expect(generate('F', 'F -> FF')).toEqual([
          { c: 'F' },
          { c: 'F' }
        ]);
        expect(generate('F(7)', 'F(t)->F(t)F(t)')).toEqual([
          { c: 'F', p: [7] },
          { c: 'F', p: [7] }
        ]);
      });

      it("should skip condition", function() {
        expect(generate('F(7)', 'F(t) : t > 8 -> F(t+1)')).toEqual([
          { 'c': 'F', 'p': [7] }
        ]);
      });

      it("should use condition", function() {
        expect(generate('F(7)', 'F(t) : t < 8 -> F(t+1)')).toEqual([
          { 'c': 'F', 'p': [8] }
        ]);
      });

      it('should generate example 1.24a', function() {
        expect(generate('F', 'F -> F[+F]F[-F]F'), 1).toEqual(
          parser.parse('F[+F]F[-F]F').elements
        );
        expect(generate('F', 'F -> F[+F]F[-F]F', 2)).toEqual(
          parser.parse('F[+F]F[-F]F[+F[+F]F[-F]F]F[+F]F[-F]F[-F[+F]F[-F]F]F[+F]F[-F]F').elements
        );
      });
      
      it('should generate simple doubling', function() {
        
      });
    });
    
    // ==========
    // = Turtle =
    // ==========
    
    describe("Turtle", function() {
      it("should generate single path", function() {
        var ctx = new lsystem.MockContext(),
            turtle = new lsystem.Turtle();
            
        turtle.draw(ctx, 'F(10)');
        expect(Math.round(turtle.x)).toEqual(0);
        expect(Math.round(turtle.y)).toEqual(10);
      });

      it("should generate double path (oh my god what does this mean?)", function() {
        var ctx = new lsystem.MockContext(),
            turtle = new lsystem.Turtle();
            
        turtle.draw(ctx, 'F(7)F(8)', 0, 1);
        expect(Math.round(turtle.x)).toEqual(0);
        expect(Math.round(turtle.y)).toEqual(7);
        turtle.draw(ctx, 'F(7)F(8)', 1, 2);
        expect(Math.round(turtle.x)).toEqual(0);
        expect(Math.round(turtle.y)).toEqual(15);
      });
    });
    
  });
})();