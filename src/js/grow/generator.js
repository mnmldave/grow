/**
 * L-system implementations.
 * @author dave heaton <dave@bit155.com>
 */
(function() {
  
  /**
   * Returns the result of applying deterministic production rules to a 
   * string.
   *
   * @param (Object) productions map of single characters to words
   * @param (String) string to apply production rules to
   * @return the new string
   */
  exports.deterministic = function(productions, string) {
    var result = '', i, c, p;
    for (i = 0; i < string.length; i++) {
      c = string.charAt(i);
      p = productions[c];
      result = result + (p ? p : c);
    }
    return result;
  };
  
})();