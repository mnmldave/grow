(function() {
  var Backbone = require('backbone'),
      BackboneLocalStorage = require('backbone/localStorage'),
      Generator = require('grow/generator'),
      Turtle = require('grow/turtle'),
      Vectorizor = require('grow/vectorizor');
  
  Backbone.sync = BackboneLocalStorage.sync;

  var TreeModel = Backbone.Model.extend({
  });
  
  var TreeCollection = Backbone.Collection.extend({
    model: TreeModel
  });
  
  var GardenView = Backbone.View.extend({
    initialize: function(options) {
      _.bindAll(this, 'hide', 'show', 'start', 'tick', 'stop', 'render', 'update', 'click');
      
      // set up canvas context
      this.fps = 30;
      this.grower = options.grower;
      this.running = false;
      
      // bind events
      $(this.el).click(this.click);
    },
    
    hide: function() {
      $(this.el).fadeOut();
      this.stop();
    },
    
    show: function() {
      this.start();
      $(this.el).fadeIn();
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
        tree.program = Generator.generate(tree.productions, tree.program);
        tree.vector = Vectorizor.vectorize(tree.program);
        
        console.log(tree.program);
        
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
        program: Turtle.parse('F(15)'),
        energy: 3,
        vector: [ 'm', 0, 0, 'l', 0, 20 ],
        productions: {
          'F': [
            {
              successor: function(n) {
                return [
                  { c: 'F', p: [n] },
                  [
                    { c: '+', p: [-25.7] },
                    { c: 'F', p: [n] }
                  ],
                  { c: 'F', p: [n] },
                  [
                    { c: '+', p: [25.7] },
                    { c: 'F', p: [n] }
                  ],
                  { c: 'F', p: [n] }
                ];
              }
            }
          ]
        },
        x: e.originalEvent.x + 0.5,
        y: e.originalEvent.y + 0.5
      };
      
      this.collection.add(tree);
    }
  });
  
  var Controller = Backbone.Controller.extend({
    routes: {
      '': 'index',
      'test': 'test'
    },

    initialize: function(options) {
      _.bindAll(this, 'index', 'test');
      
      this.grower = null; //new Worker('grower.js');
      
      this.garden = new TreeCollection();
      this.gardenView = new GardenView({
        el: document.getElementById('garden'),
        collection: this.garden,
        grower: this.grower
      });
      this.gardenView.render();
    },
    
    index: function() {
      this.gardenView.show();
    },
    
    test: function() {
      
    }
  });
  
  exports.Controller = Controller;
})();
