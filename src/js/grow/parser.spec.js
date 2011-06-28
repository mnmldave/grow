describe("parser", function() {
  var parser = require('grow/parser');
  
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
  
  
  it("should parse empty", function() {
    var src = '';
    expect(parseProgram(src)).toEqual([]);
  });

  it("should parse single module", function() {
    var src = 'F';
    expect(parseProgram(src)).toEqual([ { c: 'F' } ]);
  });

  it("should parse single module with literal parameters", function() {
    expect(parseProgram('F(17)')).toEqual([ { c: 'F', p: [17] } ]);
    expect(parseProgram('F(-17)')).toEqual([ { c: 'F', p: [-17] } ]);
    expect(parseProgram('F(9.3456789)')).toEqual([ { c: 'F', p: [9.3456789] } ]);
    expect(parseProgram('F(-0.145)')).toEqual([ { c: 'F', p: [-0.145] } ]);
  });

  it("should parse single module with arithmetic parameters", function() {
    expect(parseProgram('F(a)')).toEqual([ { c: 'F', p: ['a'] } ]);
    expect(parseProgram('F( (a + 1))')).toEqual([ { c: 'F', p: [ { type: 'BinaryOperation', op: '+', left: 'a', right: 1 } ] } ]);
    expect(parseProgram('F((a-1))')).toEqual([ { c: 'F', p: [ { type: 'BinaryOperation', op: '-', left: 'a', right: 1 } ] } ]);
    expect(parseProgram('F((a* b))')).toEqual([ { c: 'F', p: [ { type: 'BinaryOperation', op: '*', left: 'a', right: 'b' } ] } ]);
    expect(parseProgram('F((a /b))')).toEqual([ { c: 'F', p: [ { type: 'BinaryOperation', op: '/', left: 'a', right: 'b' } ] } ]);
    expect(parseProgram('F((a^b ) )')).toEqual([ { c: 'F', p: [ { type: 'BinaryOperation', op: '^', left: 'a', right: 'b' } ] } ]);
    expect(parseProgram('F(  (a^( b* 12)))')).toEqual([ { c: 'F', p: [ { type: 'BinaryOperation', op: '^', left: 'a', right: { type: 'BinaryOperation', op: '*', left: 'b', right: 12 }  } ] } ]);
  });

  it("should parse production rule 1.24a", function() {
    var src = 'F(n)[+(-25.7)F(n)]F(n)[+(25.7)F(n)]F(n)';
    expect(parseProgram(src)).toEqual([
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
    expect(parseProductions(src)).toEqual([{ c: 'F', successor: [ { c: 'F' } ] }]);
  });

  it("should parse contextual productions", function() {
    expect(parseProductions('A < F -> F')).toEqual([{ c: 'F', pre: 'A', successor: [ { c: 'F' } ] }]);
    expect(parseProductions('F > B -> F')).toEqual([{ c: 'F', post: 'B', successor: [ { c: 'F' } ] }]);
    expect(parseProductions('A < F > B -> F')).toEqual([{ c: 'F', pre: 'A', post: 'B', successor: [ { c: 'F' } ] }]);
  });

  it("should parse conditional productions", function() {
    expect(parseProductions('F(t) : t>5 -> F(t)')).toEqual([{ c: 'F', variables: ['t'], condition: { type: 'BinaryOperation', op: '>', left: 't', right: 5 }, successor: [ { c: 'F', p: ['t'] } ] }]);
    expect(parseProductions('F(t,b) : t>5 -> F(t)')).toEqual([{ c: 'F', variables: ['t', 'b'], condition: { type: 'BinaryOperation', op: '>', left: 't', right: 5 }, successor: [ { c: 'F', p: ['t'] } ] }]);
  });

  it("should parse contextual and conditional productions", function() {
    expect(parseProductions('A < F(t) : t>5 -> F')).toEqual([{ c: 'F', variables: ['t'], condition: { type: 'BinaryOperation', op: '>', left: 't', right: 5 }, pre: 'A', successor: [ { c: 'F' } ] }]);
    expect(parseProductions('F(t) > B : t>5 -> F')).toEqual([{ c: 'F', variables: ['t'], condition: { type: 'BinaryOperation', op: '>', left: 't', right: 5 }, post: 'B', successor: [ { c: 'F' } ] }]);
    expect(parseProductions('A < F(t) > B : t>5 -> F')).toEqual([{ c: 'F', variables: ['t'], condition: { type: 'BinaryOperation', op: '>', left: 't', right: 5 }, pre: 'A', post: 'B', successor: [ { c: 'F' } ] }]);
  });
  
  it("should parse multiple contextual and conditional productions", function() {
    expect(parseProductions('A < F(t) : t>5 -> F\nF(t) > B : t>5 -> F;A < F(t) > B : t>5 -> F')).toEqual([
      { c: 'F', variables: ['t'], condition: { type: 'BinaryOperation', op: '>', left: 't', right: 5 }, pre: 'A', successor: [ { c: 'F' } ] },
      { c: 'F', variables: ['t'], condition: { type: 'BinaryOperation', op: '>', left: 't', right: 5 }, post: 'B', successor: [ { c: 'F' } ] },
      { c: 'F', variables: ['t'], condition: { type: 'BinaryOperation', op: '>', left: 't', right: 5 }, pre: 'A', post: 'B', successor: [ { c: 'F' } ] }
    ]);
  });
});