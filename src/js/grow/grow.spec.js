(function() {
  var grow = require('grow/grow');

  describe("grow", function() {
    
    // ==========
    // = Parser =
    // ==========
    
    describe("parser", function() {
      it("should parse empty", function() {
        var src = '';
        expect(grow.parseProgram(src)).toEqual([]);
      });

      it("should parse single module", function() {
        var src = 'F';
        expect(grow.parseProgram(src)).toEqual([ { c: 'F' } ]);
      });

      it("should parse single module with literal parameters", function() {
        expect(grow.parseProgram('F(17)')).toEqual([ { c: 'F', p: [17] } ]);
        expect(grow.parseProgram('F(-17)')).toEqual([ { c: 'F', p: [-17] } ]);
        expect(grow.parseProgram('F(9.3456789)')).toEqual([ { c: 'F', p: [9.3456789] } ]);
        expect(grow.parseProgram('F(-0.145)')).toEqual([ { c: 'F', p: [-0.145] } ]);
      });

      it("should parse single module with arithmetic parameters", function() {
        expect(grow.parseProgram('F(a)')).toEqual([ { c: 'F', p: ['a'] } ]);
        expect(grow.parseProgram('F( (a + 1))')).toEqual([ { c: 'F', p: [ { type: 'BinaryOperation', op: '+', left: 'a', right: 1 } ] } ]);
        expect(grow.parseProgram('F((a-1))')).toEqual([ { c: 'F', p: [ { type: 'BinaryOperation', op: '-', left: 'a', right: 1 } ] } ]);
        expect(grow.parseProgram('F((a* b))')).toEqual([ { c: 'F', p: [ { type: 'BinaryOperation', op: '*', left: 'a', right: 'b' } ] } ]);
        expect(grow.parseProgram('F((a /b))')).toEqual([ { c: 'F', p: [ { type: 'BinaryOperation', op: '/', left: 'a', right: 'b' } ] } ]);
        expect(grow.parseProgram('F((a^b ) )')).toEqual([ { c: 'F', p: [ { type: 'BinaryOperation', op: '^', left: 'a', right: 'b' } ] } ]);
        expect(grow.parseProgram('F(  (a^( b* 12)))')).toEqual([ { c: 'F', p: [ { type: 'BinaryOperation', op: '^', left: 'a', right: { type: 'BinaryOperation', op: '*', left: 'b', right: 12 }  } ] } ]);
      });

      it("should parse production rule 1.24a", function() {
        var src = 'F(n)[+(-25.7)F(n)]F(n)[+(25.7)F(n)]F(n)';
        expect(grow.parseProgram(src)).toEqual([
          { c: 'F', p: [ 'n' ] },
          [
            { c: '+', p: [ -25.7 ] },
            { c: 'F', p: [ 'n' ] }
          ],
          { c: 'F', p: [ 'n' ] },
          [
            { c: '+', p: [ 25.7 ] },
            { c: 'F', p: [ 'n' ] }
          ],
          { c: 'F', p: [ 'n' ] }
        ]);
      });
      
      it("should parse deterministic production", function() {
        var src = 'F -> F';
        expect(grow.parseProductions(src)).toEqual([{ c: 'F', successor: [ { c: 'F' } ] }]);
      });

      xit("should parse contextual productions", function() {
        expect(grow.parseProductions('A < F -> F')).toEqual([{ c: 'F', pre: 'A', successor: [ { c: 'F' } ] }]);
        expect(grow.parseProductions('F > B -> F')).toEqual([{ c: 'F', post: 'B', successor: [ { c: 'F' } ] }]);
        expect(grow.parseProductions('A < F > B -> F')).toEqual([{ c: 'F', pre: 'A', post: 'B', successor: [ { c: 'F' } ] }]);
      });

      it("should parse conditional productions", function() {
        expect(grow.parseProductions('F(t) : t>5 -> F(t)')).toEqual([{ c: 'F', variables: ['t'], condition: { type: 'BinaryOperation', op: '>', left: 't', right: 5 }, successor: [ { c: 'F', p: ['t'] } ] }]);
        expect(grow.parseProductions('F(t,b) : t>5 -> F(t)')).toEqual([{ c: 'F', variables: ['t', 'b'], condition: { type: 'BinaryOperation', op: '>', left: 't', right: 5 }, successor: [ { c: 'F', p: ['t'] } ] }]);
      });

      xit("should parse contextual and conditional productions", function() {
        expect(grow.parseProductions('A < F(t) : t>5 -> F')).toEqual([{ c: 'F', variables: ['t'], condition: { type: 'BinaryOperation', op: '>', left: 't', right: 5 }, pre: 'A', successor: [ { c: 'F' } ] }]);
        expect(grow.parseProductions('F(t) > B : t>5 -> F')).toEqual([{ c: 'F', variables: ['t'], condition: { type: 'BinaryOperation', op: '>', left: 't', right: 5 }, post: 'B', successor: [ { c: 'F' } ] }]);
        expect(grow.parseProductions('A < F(t) > B : t>5 -> F')).toEqual([{ c: 'F', variables: ['t'], condition: { type: 'BinaryOperation', op: '>', left: 't', right: 5 }, pre: 'A', post: 'B', successor: [ { c: 'F' } ] }]);
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
          program = grow.generate({ program: program, productions: productions });
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

      it("should generate branches", function() {
        expect(generate('F', 'F -> F[F]')).toEqual([
          { c: 'F' },
          [
            { c: 'F' }
          ]
        ]);
        expect(generate('[F]', 'F -> FF')).toEqual([
          [
            { c: 'F' },
            { c: 'F' }
          ]
        ]);
        expect(generate('F', 'F -> F[FF]', 2)).toEqual(
          grow.parseProgram('F[FF][F[FF]F[FF]]')
        );
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
          grow.parseProgram('F[+F]F[-F]F')
        );
        expect(generate('F', 'F -> F[+F]F[-F]F', 2)).toEqual(
          grow.parseProgram('F[+F]F[-F]F[+F[+F]F[-F]F]F[+F]F[-F]F[-F[+F]F[-F]F]F[+F]F[-F]F')
        );
      });
    });
    
    // ==============
    // = Vectorizor =
    // ==============
    
    describe("vectorizor", function() {
      var round = function(vec) {
        for (var i = 0; i < vec.length; i++) {
          if (typeof vec[i] === 'number') {
            vec[i] = Math.round(vec[i]);
          }
        }
        return vec;
      };

      it("should generate single path", function() {
        var program = grow.parseProgram('F(10)'),
            vector = round(grow.vectorize(program));

        grow.debug(function() {
          expect(vector).toEqual([
            'p',
            'm', 0, 0,
            'l', 0, 10,
            's'
          ]);
        });
      });

      it("should generate double path", function() {
        var program = grow.parseProgram('F(10)F(10)'),
            vector = round(grow.vectorize(program));

        grow.debug(function() {
          expect(vector).toEqual([
            'p',
            'm', 0, 0,
            'l', 0, 10,
            's',
            'p',
            'm', 0, 10,
            'l', 0, 20,
            's'
          ]);
        });
      });

      it("should generate single branch", function() {
        var program = grow.parseProgram('F(10)[F(10)]'),
            vector = round(grow.vectorize(program));

        grow.debug(function() {
          expect(vector).toEqual([
            'p',
            'm', 0, 0,
            'l', 0, 10,
            's',
            'p',
            'm', 0, 10,
            'l', 0, 20,
            's'
          ]);
        });
      });
    });
    
    
  });
})();