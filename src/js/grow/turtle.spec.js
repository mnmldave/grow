(function() {
  var turtle = require('grow/turtle');

  describe("turtle", function() {
    
    // ==========
    // = Parser =
    // ==========
    
    describe("parser", function() {
      it("should parse empty", function() {
        var src = '';
        expect(turtle.parse(src)).toEqual([[]]);
      });

      it("should parse single module", function() {
        var src = 'F';
        expect(turtle.parse(src)).toEqual([[ { c: 'F' } ]]);
      });

      it("should parse single module with literal parameters", function() {
        expect(turtle.parse('F(17)')).toEqual([[ { c: 'F', p: [17] } ]]);
        expect(turtle.parse('F(-17)')).toEqual([[ { c: 'F', p: [-17] } ]]);
        expect(turtle.parse('F(9.3456789)')).toEqual([[ { c: 'F', p: [9.3456789] } ]]);
        expect(turtle.parse('F(-0.145)')).toEqual([[ { c: 'F', p: [-0.145] } ]]);
      });

      it("should parse single module with arithmetic parameters", function() {
        expect(turtle.parse('F(a)')).toEqual([[ { c: 'F', p: ['a'] } ]]);
        expect(turtle.parse('F( (a + 1))')).toEqual([[ { c: 'F', p: ['(a+1)'] } ]]);
        expect(turtle.parse('F((a-1))')).toEqual([[ { c: 'F', p: ['(a-1)'] } ]]);
        expect(turtle.parse('F((a* b))')).toEqual([[ { c: 'F', p: ['(a*b)'] } ]]);
        expect(turtle.parse('F((a /b))')).toEqual([[ { c: 'F', p: ['(a/b)'] } ]]);
        expect(turtle.parse('F((a^b ) )')).toEqual([[ { c: 'F', p: ['(a^b)'] } ]]);
        expect(turtle.parse('F(  (a^( b* 12)))')).toEqual([[ { c: 'F', p: ['(a^(b*12))'] } ]]);
      });

      it("should parse production rule 1.24a", function() {
        var src = 'F(n)[+(-25.7)F(n)]F(n)[+(25.7)F(n)]F(n)';
        expect(turtle.parse(src)).toEqual([[
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
        ]]);
      });
      
      it("should parse deterministic production", function() {
        var src = 'F -> F';
        expect(turtle.parse(src)).toEqual([{ c: 'F', successor: [ { c: 'F' } ] }]);
      });

      it("should parse contextual productions", function() {
        expect(turtle.parse('A < F -> F')).toEqual([{ c: 'F', pre: 'A', successor: [ { c: 'F' } ] }]);
        expect(turtle.parse('F > B -> F')).toEqual([{ c: 'F', post: 'B', successor: [ { c: 'F' } ] }]);
        expect(turtle.parse('A < F > B -> F')).toEqual([{ c: 'F', pre: 'A', post: 'B', successor: [ { c: 'F' } ] }]);
      });

      it("should parse conditional productions", function() {
        expect(turtle.parse('F(t>5) -> F(t)')).toEqual([{ c: 'F', condition: 't>5', successor: [ { c: 'F', p: ['t'] } ] }]);
        expect(turtle.parse('F(t>(5*b)) -> F(t)')).toEqual([{ c: 'F', condition: 't>(5*b)', successor: [ { c: 'F', p: ['t'] } ] }]);
      });

      it("should parse contextual and conditional productions", function() {
        expect(turtle.parse('A < F(t>5) -> F')).toEqual([{ c: 'F', condition: 't>5', pre: 'A', successor: [ { c: 'F' } ] }]);
        expect(turtle.parse('F(t>5) > B -> F')).toEqual([{ c: 'F', condition: 't>5', post: 'B', successor: [ { c: 'F' } ] }]);
        expect(turtle.parse('A < F(t>5) > B -> F')).toEqual([{ c: 'F', condition: 't>5', pre: 'A', post: 'B', successor: [ { c: 'F' } ] }]);
      });
    });
  });
})();