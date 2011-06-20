(function() {
  var turtle = require('grow/turtle');

  describe("turtle", function() {
    describe("parser", function() {
      it("should parse empty", function() {
        var src = 'F(n)[+(-25.7)F(n)]F(n)[+(25.7)F(n)]F(n)',
            obj = turtle.parse(src),
            formatted = turtle.format(obj);

        console.log(src);
        console.log(obj);
        console.log(formatted);
      });
    });
  });
})();