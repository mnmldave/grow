(function() {
  var lsystem = require('grow/lsystem');

  describe("lsystem", function() {
    
    // ==========
    // = Parser =
    // ==========
    
    describe("parser", function() {
      it("should parse empty", function() {
        var src = '';
        expect(lsystem.parseProgram(src)).toEqual([]);
      });

      it("should parse single module", function() {
        var src = 'F';
        expect(lsystem.parseProgram(src)).toEqual([ { c: 'F' } ]);
      });

      it("should parse single module with literal parameters", function() {
        expect(lsystem.parseProgram('F(17)')).toEqual([ { c: 'F', p: [17] } ]);
        expect(lsystem.parseProgram('F(-17)')).toEqual([ { c: 'F', p: [-17] } ]);
        expect(lsystem.parseProgram('F(9.3456789)')).toEqual([ { c: 'F', p: [9.3456789] } ]);
        expect(lsystem.parseProgram('F(-0.145)')).toEqual([ { c: 'F', p: [-0.145] } ]);
      });

      it("should parse single module with arithmetic parameters", function() {
        expect(lsystem.parseProgram('F(a)')).toEqual([ { c: 'F', p: ['a'] } ]);
        expect(lsystem.parseProgram('F( (a + 1))')).toEqual([ { c: 'F', p: [ { type: 'BinaryOperation', op: '+', left: 'a', right: 1 } ] } ]);
        expect(lsystem.parseProgram('F((a-1))')).toEqual([ { c: 'F', p: [ { type: 'BinaryOperation', op: '-', left: 'a', right: 1 } ] } ]);
        expect(lsystem.parseProgram('F((a* b))')).toEqual([ { c: 'F', p: [ { type: 'BinaryOperation', op: '*', left: 'a', right: 'b' } ] } ]);
        expect(lsystem.parseProgram('F((a /b))')).toEqual([ { c: 'F', p: [ { type: 'BinaryOperation', op: '/', left: 'a', right: 'b' } ] } ]);
        expect(lsystem.parseProgram('F((a^b ) )')).toEqual([ { c: 'F', p: [ { type: 'BinaryOperation', op: '^', left: 'a', right: 'b' } ] } ]);
        expect(lsystem.parseProgram('F(  (a^( b* 12)))')).toEqual([ { c: 'F', p: [ { type: 'BinaryOperation', op: '^', left: 'a', right: { type: 'BinaryOperation', op: '*', left: 'b', right: 12 }  } ] } ]);
      });

      it("should parse production rule 1.24a", function() {
        var src = 'F(n)[+(-25.7)F(n)]F(n)[+(25.7)F(n)]F(n)';
        expect(lsystem.parseProgram(src)).toEqual([
          { c: 'F', p: [ 'n' ] },
          { c: '[' },
          { c: '+', p: [ -25.7 ] },
          { c: 'F', p: [ 'n' ] },
          { c: ']' },
          { c: 'F', p: [ 'n' ] },
          { c: '[' },
          { c: '+', p: [ 25.7 ] },
          { c: 'F', p: [ 'n' ] },
          { c: ']' },
          { c: 'F', p: [ 'n' ] }
        ]);
      });
      
      it("should parse deterministic production", function() {
        var src = 'F -> F';
        expect(lsystem.parseProductions(src)).toEqual([{ c: 'F', successor: [ { c: 'F' } ] }]);
      });

      it("should parse contextual productions", function() {
        expect(lsystem.parseProductions('A < F -> F')).toEqual([{ c: 'F', pre: 'A', successor: [ { c: 'F' } ] }]);
        expect(lsystem.parseProductions('F > B -> F')).toEqual([{ c: 'F', post: 'B', successor: [ { c: 'F' } ] }]);
        expect(lsystem.parseProductions('A < F > B -> F')).toEqual([{ c: 'F', pre: 'A', post: 'B', successor: [ { c: 'F' } ] }]);
      });

      it("should parse conditional productions", function() {
        expect(lsystem.parseProductions('F(t) : t>5 -> F(t)')).toEqual([{ c: 'F', variables: ['t'], condition: { type: 'BinaryOperation', op: '>', left: 't', right: 5 }, successor: [ { c: 'F', p: ['t'] } ] }]);
        expect(lsystem.parseProductions('F(t,b) : t>5 -> F(t)')).toEqual([{ c: 'F', variables: ['t', 'b'], condition: { type: 'BinaryOperation', op: '>', left: 't', right: 5 }, successor: [ { c: 'F', p: ['t'] } ] }]);
      });

      it("should parse contextual and conditional productions", function() {
        expect(lsystem.parseProductions('A < F(t) : t>5 -> F')).toEqual([{ c: 'F', variables: ['t'], condition: { type: 'BinaryOperation', op: '>', left: 't', right: 5 }, pre: 'A', successor: [ { c: 'F' } ] }]);
        expect(lsystem.parseProductions('F(t) > B : t>5 -> F')).toEqual([{ c: 'F', variables: ['t'], condition: { type: 'BinaryOperation', op: '>', left: 't', right: 5 }, post: 'B', successor: [ { c: 'F' } ] }]);
        expect(lsystem.parseProductions('A < F(t) > B : t>5 -> F')).toEqual([{ c: 'F', variables: ['t'], condition: { type: 'BinaryOperation', op: '>', left: 't', right: 5 }, pre: 'A', post: 'B', successor: [ { c: 'F' } ] }]);
      });
      
      it("should parse multiple contextual and conditional productions", function() {
        expect(lsystem.parseProductions('A < F(t) : t>5 -> F\nF(t) > B : t>5 -> F;A < F(t) > B : t>5 -> F')).toEqual([
          { c: 'F', variables: ['t'], condition: { type: 'BinaryOperation', op: '>', left: 't', right: 5 }, pre: 'A', successor: [ { c: 'F' } ] },
          { c: 'F', variables: ['t'], condition: { type: 'BinaryOperation', op: '>', left: 't', right: 5 }, post: 'B', successor: [ { c: 'F' } ] },
          { c: 'F', variables: ['t'], condition: { type: 'BinaryOperation', op: '>', left: 't', right: 5 }, pre: 'A', post: 'B', successor: [ { c: 'F' } ] }
        ]);
      });
    });
    
    // =============
    // = Generator =
    // =============
    
    describe("generator", function() {
      // Utitility for generating some number of generations of a program.
      function generate(program, productions, generations) {
        var i, n = (generations ? generations : 1);

        for (i = 0; i < n; i++) {
          program = lsystem.generate({ program: program, productions: productions });
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
          lsystem.parseProgram('F[+F]F[-F]F')
        );
        expect(generate('F', 'F -> F[+F]F[-F]F', 2)).toEqual(
          lsystem.parseProgram('F[+F]F[-F]F[+F[+F]F[-F]F]F[+F]F[-F]F[-F[+F]F[-F]F]F[+F]F[-F]F')
        );
      });
    });
    
    // ==========
    // = Turtle =
    // ==========
    
    describe("Turtle", function() {
      it("should generate single path", function() {
        var ctx = new lsystem.MockContext(),
            turtle = new lsystem.Turtle().draw(ctx, 'F(10)');

        expect(Math.round(turtle.x)).toEqual(0);
        expect(Math.round(turtle.y)).toEqual(10);
      });

      it("should generate double path", function() {
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