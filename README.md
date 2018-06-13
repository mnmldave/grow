grow.js
=======

Grow.js is a simple javascript implementation of a [Lindenmayer System](http://en.wikipedia.org/wiki/L-system) based on the book [The Algorithmic Beauty of Plants](http://algorithmicbotany.org/papers/#abop). About two chapters into reading this, I got so excited about it I had to try building my own simulator.

* [http://bit155.com/projects/grow](http://bit155.com/projects/grow)
* [http://bit155.com/projects/grow/spec.html](http://bit155.com/projects/grow/spec.html)

Support
-------

Only tested on Firefox 5, Chrome 12-13 and Safari 5 so far. A very small set of tests can be run via the `spec.html` page.

Technologies
------------

This project uses HTML5's `canvas` element to do the drawing, plus `localStorage` for saving and loading presets, but the bulk of the Javascript is built upon the shoulders of:

  * [Backbone](http://documentcloud.github.com/backbone/) and [Backbone.localStorage](https://github.com/valentin-nemcev/Backbone.localStorage)
  * [PEG.js](http://pegjs.majda.cz/) for parsing
  * [yabble](https://github.com/jbrantly/yabble) for CommonJS dependency management
  * [underscore](http://documentcloud.github.com/underscore/)
  * [jquery](http://jquery.com/)
  * [jquery-ui](http://jqueryui.com/)
  * [Aristo](https://github.com/taitems/Aristo-jQuery-UI-Theme) jquery ui theme
  * [Jasmine](https://jasmine.github.io/) for testing
  * [modernizr](http://www.modernizr.com/)
  * [HTML5 Boilerplate](http://html5boilerplate.com/)
