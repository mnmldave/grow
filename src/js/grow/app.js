(function() {
  var Backbone = require('backbone'),
      BackboneLocalStorage = require('backbone/localStorage'),
      lsystem = require('grow/lsystem'),
      util = require('grow/util');
  
  var presets = [
    {
      name: '1.6 Koch Island',
      description: 'From page 8 of "Algorithmic Beauty of Plants".',
      iterations: 3,
      program: 'F-F-F-F',
      productions: 'F -> F-F+F+FF-F-F+F'
    },
    {
      name: '1.7a Quadratic Koch Island',
      description: 'From page 9 of "Algorithmic Beauty of Plants".',
      iterations: 2,
      program: 'F-F-F-F',
      productions: 'F -> F+FF-FF-F-F+F+FF-F-F+F+FF+FF-F'
    },
    {
      name: '1.7b Quadratic Snowflake Curve',
      description: 'From page 9 of "Algorithmic Beauty of Plants".',
      iterations: 4,
      program: '-F',
      productions: 'F -> F+F-F-F+F'
    },
    {
      name: '1.8 Combination of Islands and Lakes',
      description: 'From page 9 of "Algorithmic Beauty of Plants".',
      iterations: 2,
      program: 'F+F+F+F',
      productions: 'F -> F+f-FF+F+FF+Ff+FF-f+FF-F-FF-Ff-FFF\nf->ffffff'
    },
    {
      name: '1.9a',
      description: 'From page 10 of "Algorithmic Beauty of Plants".',
      iterations: 4,
      program: 'F-F-F-F',
      productions: 'F -> FF-F-F-F-F-F+F'
    },
    {
      name: '1.9b',
      description: 'From page 10 of "Algorithmic Beauty of Plants".',
      iterations: 4,
      program: 'F-F-F-F',
      productions: 'F -> FF-F-F-F-FF'
    },
    {
      name: '1.9c',
      description: 'From page 10 of "Algorithmic Beauty of Plants".',
      iterations: 3,
      program: 'F-F-F-F',
      productions: 'F -> FF-F+F-F-FF'
    },
    {
      name: '1.9d',
      description: 'From page 10 of "Algorithmic Beauty of Plants".',
      iterations: 4,
      program: 'F-F-F-F',
      productions: 'F -> FF-F--F-F'
    },
    {
      name: '1.9e',
      description: 'From page 10 of "Algorithmic Beauty of Plants".',
      iterations: 5,
      program: 'F-F-F-F',
      productions: 'F -> F-FF--F-F'
    },
    {
      name: '1.9f',
      description: 'From page 10 of "Algorithmic Beauty of Plants".',
      iterations: 4,
      program: 'F-F-F-F',
      productions: 'F -> F-F+F-F-F'
    },
    {
      name: '1.24',
      description: 'From',
      iterations: 4,
      program: 'F(3)',
      productions: 'F -> F(n)[+(-25.7)F(n)]F(n)[+(25.7)F(n)]F(n)'
    }
  ];
  
  Backbone.sync = BackboneLocalStorage.sync;
  
  var SeedModel = Backbone.Model.extend({
    validate: function(attributes) {
      if (!attributes.name) {
        return "A name is required.";
      }
    }
  });
  
  var SeedCollection = Backbone.Collection.extend({
    localStorage: new BackboneLocalStorage.Store('SeedCollection'),
    model: SeedModel
  });
  
  var TreeCollection = Backbone.Collection.extend({
    localStorage: new BackboneLocalStorage.Store('TreeCollection'),
    model: Backbone.Model
  });
  
  var SeedCollectionView = Backbone.View.extend({
    initialize: function(options) {
      _.bindAll(this, 'update', 'render', 'show', 'hide', 'plant', 'load', 'save', 'remove', 'error', 'seed');
      this.treeCollection = options.treeCollection;
      this.collection.bind('all', this.update);
      this.dirty = false;
    },
    
    seed: function() {
      var self = this,
          form = self.$('form'), 
          seed = {};
      
      // construct seed from values
      form.find('input, textarea, select').each(function(i, el) {
        var field = $(el),
            name = field.attr('name');
            
        if (name) {
          seed[name] = field.val();
        }
      });
      
      return seed;
    },
    
    error: function(model, error) {
      alert(error);
    },
    
    show: function() {
      $(this.el).dialog('open');
    },
    
    hide: function() {
      $(this.el).dialog('close');
    },
    
    plant: function() {
      var self = this,
          tree = $.extend(true, {}, self.seed()),
          ctx,
          turtle;
      
      // generate the tree
      for (i = 0; i < tree.iterations; i++) {
        tree.program = lsystem.generate({
          program: tree.program,
          productions: tree.productions
        });
      }
      
      // virtually render the tree so we can get its visual bounds and compute
      // the center
      ctx = new lsystem.MockContext();
      $.extend(ctx, { xMax: 0, xMin: 0, yMax: 0, yMin: 0 });
      ctx.lineTo = function(x,y) {
        this.xMin = Math.min(this.xMin, x);
        this.yMin = Math.min(this.yMin, y);
        this.xMax = Math.max(this.xMax, x);
        this.yMax = Math.max(this.yMax, y);
      };
      turtle = new lsystem.Turtle();
      turtle.draw(ctx, tree.program);
      tree.x = ctx.xMin + (0.5 * (ctx.xMax - ctx.xMin));
      tree.y = ctx.yMin + (0.5 * (ctx.yMax - ctx.yMin));
      
      // set tree as only one in collection
      self.treeCollection.remove(self.treeCollection.models);
      self.treeCollection.add($.extend(true, {}, tree));
      
      $(this.el).dialog('close');
    },
    
    load: function(seed) {
      var self = this,
          form = this.$('form'),
          confirm,
          load = function() {
            _.each(seed.attributes, function(v, k) {
              form.find('*[name="' + k + '"]').val(v);
            });
            self.dirty = false;
          };
      
      if (self.dirty) {
        $('<div><p>Are you sure you want to load this preset? Any changes you have made will be lost.</p></div>').dialog({
          title: 'Load preset',
          modal: true,
          buttons: {
            'Cancel': function() {
              $(this).dialog('close');
            },
            'Load': function() {
              load();
              $(this).dialog('close');
            }
          }
        });
      } else {
        load();
      }
    },
    
    save: function() {
      var self = this,
          seed = self.seed(),
          model;
      
      // find or create model
      model = self.collection.find(function(m) { return m.get('name') === seed.name; });
      if (model) {
        model.save(seed, {
          error: function(m, e) {
            alert(e);
          },
          success: function() {
            self.dirty = false;
          }
        });
      } else {
        model = new SeedModel();
        if (model.set(seed, { error: self.error })) {
          self.collection.add(model);
          model.save(seed, { error: self.error, success: function() { self.dirty = false; } });
        }
      }
    },
    
    remove: function(seed) {
      var self = this;
      
      $('<div><p>Are you sure you want to delete this preset?</p></div>').dialog({
        title: 'Delete preset?',
        modal: true,
        buttons: {
          'Cancel': function() {
            $(this).dialog('close');
          },
          'Delete': function() {
            seed.destroy();
            self.collection.remove(seed);
            $(this).dialog('close');
          }
        }
      });
    },
    
    update: function() {
      var self = this,
          presets = this.$('#seed-preset-list');
      
      // update presets
      presets.children().remove();
      self.collection.each(function(seed) {
        var load = $('<button type="button"></button>')
                .text(seed.get('name'))
                .button()
                .click(function() {
                  self.load(seed);
                  return false;
                }),
            remove = $('<button type="button">&nbsp;</button>')
                .button({
                  icons: {
                    primary: 'ui-icon-close'
                  },
                  text: false
                })
                .click(function() {
                  self.remove(seed);
                  return false;
                }),
            li = $('<li>').append(load).append(remove).buttonset().appendTo(presets);
      });
      
      return self;
    },
    
    render: function() {
      var self = this,
          form = self.$('form');
      
      $(self.el).dialog({
        autoOpen: false,
        show: 'fade',
        hide: 'fade',
        title: 'Configure',
        width: 640,
        height: 500,
        buttons: {
          'Cancel': self.hide,
          'Render': self.plant
        }
      }).removeClass('hidden');
      
      // set dirty flag whenever input is changed
      form.find('input, textarea, select').change(function() {
        self.dirty = true;
      });
      
      // bind save button
      self.$('#seed-save').click(function() {
        self.save();
        return false;
      });
      
      return self;
    }
  });
  
  var TreeCollectionView = Backbone.View.extend({
    initialize: function(options) {
      _.bindAll(this, 'render', 'resize', 'clear');
      this.collection.bind('add', this.clear);
      this.collection.bind('remove', this.clear);
      $(window).resize(this.resize).resize();
    },
    
    clear: function() {
      var self = this,
          ctx = self.el.getContext('2d');

      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      self.collection.each(function(model) {
        model.set({ 
          index: 0,
          tree: {}
        });
      });
    },
    
    render: function() {
      var self = this,
          turtle = new lsystem.Turtle(),
          steps,
          ctx;
      
      ctx = self.el.getContext('2d');
      self.collection.each(function(model) {
        var tree = model.toJSON(),
            index = tree.index || 0;
        
        if (index < tree.program.length) {
          steps = Math.round(tree.program.length / 166);
          ctx.save();
          ctx.translate((ctx.canvas.width / 2) + tree.x, (ctx.canvas.height / 2) + tree.y);
          ctx.rotate(Math.PI);
          turtle.set(tree.turtle || {});
          turtle.draw(ctx, tree.program, index, index + steps);
          ctx.restore();
          
          model.set({
            turtle: turtle.toJSON(),
            index: index + steps
          });
        }
      });
    },
    
    resize: function(e) {
      var self = this;
      
      if (self.resizeTimer) {
        clearTimeout(self.resizeTimer);
      }
      
      self.resizeTimer = setTimeout(function() {
        var ctx = self.el.getContext('2d');
        ctx.canvas.width = window.innerWidth;
        ctx.canvas.height = window.innerHeight;
        self.clear();
      }, 100);
    }
    
  });
  
  var Controller = Backbone.Controller.extend({
    routes: {
      '': 'index',
      'reset': 'reset'
    },

    initialize: function(options) {
      _.bindAll(this, 'loop', 'index', 'reset');
      
      this.treeCollection = new TreeCollection();
      this.treeCollection.fetch();
      
      this.treeCollectionView = new TreeCollectionView({
        el: document.getElementById('tree-collection-view'),
        collection: this.treeCollection
      });
      
      this.seedCollection = new SeedCollection();
      this.seedCollection.fetch();
      
      this.seedCollectionView = new SeedCollectionView({
        el: document.getElementById('seed-collection-view'),
        collection: this.seedCollection,
        treeCollection: this.treeCollection
      }).render().update();
      
      // event bindings
      $('#main').click(this.seedCollectionView.show);
      
      // reset if new
      if (this.seedCollection.length === 0) {
        this.reset();
      }
      
      requestAnimFrame(this.loop);
    },
    
    loop: function() {
      requestAnimFrame(this.loop);
      this.treeCollectionView.render();
    },
    
    reset: function() {
      this.seedCollection.each(function(m) {
        m.destroy();
      });
      this.seedCollection.remove(this.seedCollection.models);
      this.seedCollection.add(presets);
      this.seedCollection.each(function(model) {
        model.save();
      });
    },
    
    index: function() {
    }
  });
  
  exports.Controller = Controller;
})();
