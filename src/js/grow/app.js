(function() {
  var Backbone = require('backbone'),
      BackboneLocalStorage = require('backbone/localStorage'),
      generator = require('grow/generator'),
      vectorizor = require('grow/vectorizor'),
      turtle = require('grow/turtle');
  
  Backbone.sync = BackboneLocalStorage.sync;

  var TreeModel = Backbone.Model.extend({
  });
  
  var TreeCollection = Backbone.Collection.extend({
    model: TreeModel
  });
  
  var GardenView = Backbone.View.extend({
    initialize: function(options) {
      _.bindAll(this, 'start', 'tick', 'stop', 'render', 'update', 'click');
      
      // set up canvas context
      this.fps = 1;
      this.grower = options.grower;
      this.running = false;
      
      // bind events
      $(this.el).click(this.click);
    },
    
    start: function() {
      if (this.running != true) {
        this.running = true;
        setTimeout(this.tick, 1000/this.fps);
      }
    },
    
    tick: function() {
      this.update();
      this.render();
      
      if (this.running) {
        setTimeout(this.tick, 1000/this.fps);
      }
    },
    
    stop: function() {
      this.running = false;
    },
    
    update: function() {
      this.collection.each(function(model) {
        var tree = model.toJSON();
        
        // skip trees with no energy left
        if (tree.energy <= 0) {
          return;
        }
        tree.energy = tree.energy - 1;
        
        // generate a new version of the tree and compile vector instructions
        tree.program = generator.generate({
          productions: tree.productions,
          program: tree.program
        });
        tree.vector = vectorizor.vectorize(tree.program);
        
        // save
        model.set(tree);
      });
    },
    
    render: function() {
      var self = this,
          ctx;
      
      ctx = this.el.getContext('2d');
      ctx.canvas.width = window.innerWidth;
      ctx.canvas.height = window.innerHeight;
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

      self.collection.each(function(model) {
        var tree = model.attributes,
            vector = tree.vector,
            i, c;
        
        ctx.save();
        ctx.beginPath();
        ctx.translate(tree.x, ctx.canvas.height);
        ctx.rotate(Math.PI);
        for (i = 0; i < vector.length; i++) {
          c = vector[i];
          switch (c) {
            case 'm':
              // move to (x,y)
              ctx.moveTo(vector[++i], vector[++i]);
              break;
            case 'l':
              // draw a line to (x,y)
              ctx.lineTo(vector[++i], vector[++i]);
              break;
            default:
              throw new Error("Unrecognized instruction: " + c);
          }
          ctx.stroke();
        }
        ctx.restore();
      });
      
      return self;
    },
    
    click: function(e) {
      var tree = {
        energy: 3,
        program: 'F(5)',
        productions: 'F -> F(n+2)[+(-25.7)F(n)]F(n)[+(25.7)F(n)]F(n)',
        x: e.originalEvent.x + 0.5,
        y: e.originalEvent.y + 0.5
      };
      
      this.collection.add(tree);
    }
  });
  
  var Controller = Backbone.Controller.extend({
    routes: {
      '': 'index'
    },

    initialize: function(options) {
      _.bindAll(this, 'index');
      
      this.garden = new TreeCollection();
      this.gardenView = new GardenView({
        el: document.getElementById('garden'),
        collection: this.garden,
        grower: this.grower
      });
      this.gardenView.render().start();
    },
    
    index: function() {
    }
  });
  
  exports.Controller = Controller;
})();
