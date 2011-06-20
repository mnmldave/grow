(function() {
  var turtle = require('grow/turtle'),
      generator = require('grow/generator');
      
  // Utitility for generating some number of generations of a program.
  function generate(seed, productions, generations) {
    var program = turtle.parse(seed), k, i, n = (generations ? generations : 1);
    
    for (k in productions) {
      productions[k] = turtle.parse(productions[k]);
    }
    
    for (i = 0; i < generations; i++) {
      generator.generate(program, productions);
    }
    
    return program;
  }

  describe("generator", function() {
    it("should generate from identity", function() {
      expect(generate('F', { 'F' : ' -> F' })).toEqual([ 
        { c: 'F' } 
      ]);
      expect(generate('F(1)', { 'F' : ' -> F(t)' })).toEqual([ 
        { c: 'F', p: [1] } 
      ]);
    });

    it("should generate from doubling", function() {
      expect(generate('F', { 'F' : '->FF' })).toEqual([ 
        { c: 'F' },
        { c: 'F' } 
      ]);
      expect(generate('F(1)', { 'F' : '->F(t)F(t)' })).toEqual([ 
        { c: 'F', p: [1] },
        { c: 'F', p: [1] } 
      ]);
    });
  });
})();