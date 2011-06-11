(function() {
  var Backbone = require('backbone'),
      Grow = require('grow/system');
  
  Backbone.sync = require('backbone.localstorage').sync;

  var TreeModel = Backbone.Model.extend({
    
  });
  
  var TreeCollection = Backbone.Collection.extend({
    model: TreeModel
  });
  
  var garden = new TreeCollection();
  
  var GardenView = Backbone.View.extend({
    initialize: function() {
      var self = this;
      
      _.bindAll(self, 'render');
      require.ensure(['processing'], function(require) {
        var p = new (require('processing')).Processing(self.el, self.sketch);
      });
    },
    
    sketch: function(p) {
      var canvas = p.externals.canvas;
      var grower = new Grow.Bracketed({
        productions: {
          'X': 'F-[[X]+X]+F[+FX]-X',
          'F': 'FF'
        }
      });
      
      p.setup = function() {
        var $window = $(window);
        p.size($window.width(), $window.height());
        $window.resize(function(e) {
          p.size($window.width(), $window.height());
        });
      };
      
      p.draw = function() {
        p.background(245, 1);
        garden.each(function(model) {
          var tree = model.toJSON(),
              word = tree.word,
              i, c;
          
          if (tree.lifespan > 0) {
            word = grower.next(word);
            model.set({
              word: word,
              lifespan: tree.lifespan - 1
            });
          // } else {
          //   garden.remove(model);
          //   return;
          }
          
          // draw tree
          word = '[' + word + ']';
          p.stroke(200);
          p.fill(200);
          p.pushMatrix();
          p.translate(tree.x, tree.y);
          p.rotate(p.PI);
          for (i = 0; i < word.length; i++) {
            switch(word.charAt(i)) {
              case 'F':
                // draw line and move forward
                p.line(0,0,0, tree.growth);
                p.translate(0, tree.growth);
                break;
              case '[':
                // push stack
                p.pushMatrix();
                p.beginShape();
                break;
              case ']':
                // pop stack
                p.endShape();
                p.popMatrix();
                break;
              case '+':
                // turn right
                p.rotate(p.radians(tree.angle));
                break;
              case '-':
                // turn left
                p.rotate(p.radians(0 - tree.angle));
                break;
            }
          }
          p.popMatrix();
        });
      };
      
      p.mouseClicked = function() {
        garden.add({
          lifespan: 2 + (Math.random() * 2),
          angle: 22.5 + (Math.random() * 20),
          growth: 5 + (Math.random() * 5),
          
          word: 'X',
          x: p.mouseX,
          y: p.mouseY
        });
      };
    }
  });
  
  var Controller = Backbone.Controller.extend({
    routes: {
      '': 'index'
    },

    initialize: function(options) {
      _.bindAll(this, 'index');
      this.garden = new GardenView({
        el: document.getElementById('garden')
      }).render();
      
    },
    
    index: function() {
    }
  });
  
  exports.Controller = Controller;
})();
