(function() {
  var turtle = require('grow/turtle'),
      vectorizor = require('grow/vectorizor');
  
  var round = function(vec) {
    for (var i = 0; i < vec.length; i++) {
      if (typeof vec[i] === 'number') {
        vec[i] = Math.round(vec[i]);
      }
    }
    return vec;
  };
  
  describe("vectorizor", function() {
    it("should generate single path", function() {
      var program = turtle.parseProgram('F(10)'),
          vector = round(vectorizor.vectorize(program));

      vectorizor.debug(function() {
        expect(vector).toEqual([
          'p',
          'm', 0, 0,
          'l', 0, 10,
          's'
        ]);
      });
    });
    
    it("should generate double path", function() {
      var program = turtle.parseProgram('F(10)F(10)'),
          vector = round(vectorizor.vectorize(program));

      vectorizor.debug(function() {
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
      var program = turtle.parseProgram('F(10)[F(10)]'),
          vector = round(vectorizor.vectorize(program));

      vectorizor.debug(function() {
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
  
})();
