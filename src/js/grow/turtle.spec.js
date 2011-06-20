(function() {
  var turtle = require('grow/turtle');

  describe("turtle", function() {
    
    // ==========
    // = Parser =
    // ==========
    
    describe("parser", function() {
      it("should parse empty", function() {
        var src = '';
        expect(turtle.parseProgram(src)).toEqual([]);
      });

      it("should parse single module", function() {
        var src = 'F';
        expect(turtle.parseProgram(src)).toEqual([ { c: 'F' } ]);
      });

      it("should parse single module with literal parameters", function() {
        expect(turtle.parseProgram('F(17)')).toEqual([ { c: 'F', p: [17] } ]);
        expect(turtle.parseProgram('F(-17)')).toEqual([ { c: 'F', p: [-17] } ]);
        expect(turtle.parseProgram('F(9.3456789)')).toEqual([ { c: 'F', p: [9.3456789] } ]);
        expect(turtle.parseProgram('F(-0.145)')).toEqual([ { c: 'F', p: [-0.145] } ]);
      });

      it("should parse single module with arithmetic parameters", function() {
        expect(turtle.parseProgram('F(a)')).toEqual([ { c: 'F', p: ['a'] } ]);
        expect(turtle.parseProgram('F( (a + 1))')).toEqual([ { c: 'F', p: [ { type: 'BinaryOperation', op: '+', left: 'a', right: 1 } ] } ]);
        expect(turtle.parseProgram('F((a-1))')).toEqual([ { c: 'F', p: [ { type: 'BinaryOperation', op: '-', left: 'a', right: 1 } ] } ]);
        expect(turtle.parseProgram('F((a* b))')).toEqual([ { c: 'F', p: [ { type: 'BinaryOperation', op: '*', left: 'a', right: 'b' } ] } ]);
        expect(turtle.parseProgram('F((a /b))')).toEqual([ { c: 'F', p: [ { type: 'BinaryOperation', op: '/', left: 'a', right: 'b' } ] } ]);
        expect(turtle.parseProgram('F((a^b ) )')).toEqual([ { c: 'F', p: [ { type: 'BinaryOperation', op: '^', left: 'a', right: 'b' } ] } ]);
        expect(turtle.parseProgram('F(  (a^( b* 12)))')).toEqual([ { c: 'F', p: [ { type: 'BinaryOperation', op: '^', left: 'a', right: { type: 'BinaryOperation', op: '*', left: 'b', right: 12 }  } ] } ]);
      });

      it("should parse production rule 1.24a", function() {
        var src = 'F(n)[+(-25.7)F(n)]F(n)[+(25.7)F(n)]F(n)';
        expect(turtle.parseProgram(src)).toEqual([
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
        expect(turtle.parseProductions(src)).toEqual([{ c: 'F', successor: [ { c: 'F' } ] }]);
      });

      it("should parse contextual productions", function() {
        expect(turtle.parseProductions('A < F -> F')).toEqual([{ c: 'F', pre: 'A', successor: [ { c: 'F' } ] }]);
        expect(turtle.parseProductions('F > B -> F')).toEqual([{ c: 'F', post: 'B', successor: [ { c: 'F' } ] }]);
        expect(turtle.parseProductions('A < F > B -> F')).toEqual([{ c: 'F', pre: 'A', post: 'B', successor: [ { c: 'F' } ] }]);
      });

      it("should parse conditional productions", function() {
        expect(turtle.parseProductions('F(t) : t>5 -> F(t)')).toEqual([{ c: 'F', variables: ['t'], condition: { type: 'BinaryOperation', op: '>', left: 't', right: 5 }, successor: [ { c: 'F', p: ['t'] } ] }]);
        expect(turtle.parseProductions('F(t,b) : t>5 -> F(t)')).toEqual([{ c: 'F', variables: ['t', 'b'], condition: { type: 'BinaryOperation', op: '>', left: 't', right: 5 }, successor: [ { c: 'F', p: ['t'] } ] }]);
      });

      it("should parse contextual and conditional productions", function() {
        expect(turtle.parseProductions('A < F(t) : t>5 -> F')).toEqual([{ c: 'F', variables: ['t'], condition: { type: 'BinaryOperation', op: '>', left: 't', right: 5 }, pre: 'A', successor: [ { c: 'F' } ] }]);
        expect(turtle.parseProductions('F(t) > B : t>5 -> F')).toEqual([{ c: 'F', variables: ['t'], condition: { type: 'BinaryOperation', op: '>', left: 't', right: 5 }, post: 'B', successor: [ { c: 'F' } ] }]);
        expect(turtle.parseProductions('A < F(t) > B : t>5 -> F')).toEqual([{ c: 'F', variables: ['t'], condition: { type: 'BinaryOperation', op: '>', left: 't', right: 5 }, pre: 'A', post: 'B', successor: [ { c: 'F' } ] }]);
      });
    });
  });
})();