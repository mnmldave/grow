(function() {
  var Backbone = require('backbone'),
      BackboneLocalStorage = require('backbone/localStorage'),
      Turtle = require('grow/turtle');
      
  var debug = function() { console.log(arguments); };
  
  Backbone.sync = BackboneLocalStorage.sync;

  var TreeModel = Backbone.Model.extend({
  });
  
  var TreeCollection = Backbone.Collection.extend({
    model: TreeModel
  });
  
  var GardenView = Backbone.View.extend({
    initialize: function(options) {
      _.bindAll(this, 'hide', 'show', 'start', 'tick', 'stop', 'draw', 'render', 'update', 'click');
      
      // set up canvas context
      this.fps = 30;
      this.running = false;
      this.ctx = this.el.getContext('2d');
      
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
      try {
        this.update();
        this.render();
      } catch (e) {
        this.running = false;
        throw e;
      }
      
      if (this.running) {
        setTimeout(this.tick, 1000/this.fps);
      }
    },
    
    stop: function() {
      this.running = false;
    },
    
    update: function() {
      this.collection.each(function(model) {
        // TODO generate next iteration of model
      });
    },
    
    draw: function(program) {
      var ctx = this.ctx,
          i, 
          stmt;
      
      for (i = 0; i < program.length; i++) {
        stmt = program[i];
        if ('c' in stmt) {
          // command
          switch (stmt.c) {
            case 'F':
              // draw and move up n units
              ctx.moveTo(0, 0);
              ctx.lineTo(0, stmt.p[0]);
              ctx.stroke();
              ctx.translate(0, stmt.p[0]);
              break;
            case 'f':
              // only move up by n units
              ctx.translate(0, stmt.p[0]);
              break;
            case '+':
              // rotate by n degrees
              ctx.rotate(stmt.p[0] * Math.PI / 180);
              break;
          }
        } else {
          // branch
          ctx.save();
          this.draw(stmt);
          ctx.restore();
        }
      }
    },
    
    render: function() {
      var self = this,
          ctx = self.ctx;
          
      // TODO in window resize event
      ctx.canvas.width = window.innerWidth;
      ctx.canvas.height = window.innerHeight;

      // draw turtle program for each tree
      self.collection.each(function(model) {
        var tree = model.attributes;
        
        ctx.save();
        ctx.translate(tree.x, tree.y);
        ctx.rotate(Math.PI); // rotate 180 degrees so draw upwards :P
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 1.0;
        self.draw(tree.program);
        ctx.restore();
      });
      
      return self;
    },
    
    click: function(e) {
      var tree = {
        program: Turtle.parse('F(5)[+(45)F(5)]F(5)'),
        x: e.clientX,
        y: e.clientY
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
      
      this.garden = new TreeCollection();
      this.gardenView = new GardenView({
        el: document.getElementById('garden'),
        collection: this.garden
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
