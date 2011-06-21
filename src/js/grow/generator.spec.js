(function() {
  var turtle = require('grow/turtle'),
      generator = require('grow/generator');
      
  // Utitility for generating some number of generations of a program.
  function generate(program, productions, generations) {
    var i, n = (generations ? generations : 1);

    for (i = 0; i < n; i++) {
      program = generator.generate({ program: program, productions: productions });
    }
    
    return program;
  }

  describe("generator", function() {
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
      // expect(generate('F(7)', 'F(t)->F(t)F(t)')).toEqual('F(7)F(7)');
    });

    it("should skip condition", function() {
      expect(generate('F(7)', 'F(t) : t > 8 -> F(t+1)')).toEqual([
        { 'c': 'F', 'p': [7] }
      ])
    });

    it("should use condition", function() {
      expect(generate('F(7)', 'F(t) : t < 8 -> F(t+1)')).toEqual([
        { 'c': 'F', 'p': [8] }
      ])
    });
  });
})();