/**
 * L-system implementations.
 * @author dave heaton <dave@bit155.com>
 */
(function() {
  exports.Bracketed = function(options) {
    if (options) {
      this.productions = options.productions;
    }
  };
  _.extend(exports.Bracketed.prototype, {
    next: function(string) {
      var result = '', i, c, p;
      for (i = 0; i < string.length; i++) {
        c = string.charAt(i);
        p = this.productions[c];
        result = result + (p ? p : c);
      }
      return result;
    }
  });
})();