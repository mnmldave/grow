(function($) {
  /**
   * Utility for making DOM elements.
   */
  var make = function() {
    var args = Array.prototype.slice.call(arguments), result;

    // create element
    result = $(document.createElement(args.shift()));

    // set attributes
    if (args.length > 0) {
      if ($.isPlainObject(args[0])) {
        result.attr(args.shift());
      }
    }

    // append content
    if (args.length === 1) {
      if ($.isArray(args[0])) {
        result['append'].apply(result, args[0]);
      } else if ($.isFunction(args[0])) {
        args[0].apply(result, [ _.bind(result.append, result) ]);
      } else {
        result.append(args[0]);
      }
    } else if (args.length > 1) {
      result['append'].apply(result, args);
    }

    return result;
  };
  
  exports.make = make;
})(jQuery);