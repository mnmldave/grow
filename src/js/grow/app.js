(function() {
  var Backbone = require('backbone'),
      BackboneLocalStorage = require('backbone/localStorage'),
      lsystem = require('grow/lsystem'),
      util = require('grow/util'),
      presets = require('grow/presets').presets;
  
  Backbone.sync = BackboneLocalStorage.sync;
  
  var SeedModel = Backbone.Model.extend({
    initialize: function() {
      var self = this;
      
      _.bindAll(self, 'validate', 'grow');
    },
    
    validate: function(attributes) {
      if (!attributes.name) {
        return { field: 'name', message: 'A name is required.' };
      }
      
      return false;
    },
    
    /**
     * Returns an object with a fully-generated `program`, compiled 
     * `productions` and with its `x` and `y` attributes set to the midpoints
     * of the visual rendering.
     *
     * This will take quite some time to run.
     */
    grow: function() {
      var self = this,
          tree = self.toJSON(),
          ctx, xMin = 0, xMax = 0, yMin = 0, yMax = 0,
          turtle;
      
      // generate the tree
      tree.program = tree.axiom;
      for (i = 0; i < tree.iterations; i++) {
        tree.program = lsystem.generate({
          program: tree.program,
          productions: tree.productions
        });
      }
      
      // virtually render the tree so we can calculate width/height
      ctx = new lsystem.MockContext();
      ctx.lineTo = function(x,y) {
        xMin = x < xMin ? x : xMin;
        xMax = x > xMax ? x : xMax;
        yMin = y < yMin ? y : yMin;
        yMax = y > yMax ? y : yMax;
      };
      turtle = new lsystem.Turtle();
      turtle.draw(ctx, tree.program);
      tree.width = xMax - xMin;
      tree.height = yMax - yMin;
      tree.x = xMin + (0.5 * (xMax - xMin));
      tree.y = yMin + (0.5 * (yMax - yMin));
      
      return tree;
    }
  });
  
  var SeedCollection = Backbone.Collection.extend({
    localStorage: new BackboneLocalStorage.Store('SeedCollection'),
    model: SeedModel
  });
  
  var TreeCollection = Backbone.Collection.extend({
    localStorage: new BackboneLocalStorage.Store('TreeCollection'),
    model: Backbone.Model,
    
    initialize: function() {
      var self = this;
      
      _.bindAll(self, 'plant');
    },
    
    plant: function(tree) {
      var self = this;
      
      self.remove(self.models);
      self.add(tree);
      return self;
    }
  });
  
  var SeedPresetView = Backbone.View.extend({
    initialize: function(options) {
      var self = this;
      
      _.bindAll(self, 'render', 'update', 'show', 'hide', 'remove', 'load');
      
      self.treeCollection = options.treeCollection;
      self.collection.bind('all', self.update);
    },
    
    show: function() {
      $(this.el).dialog('open');
      return this;
    },
    
    hide: function() {
      $(this.el).dialog('close');
      return this;
    },
    
    load: function(model) {
      var self = this;
      
      self.treeCollection.plant(model.grow());
      $(self.el).dialog('close');
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
          tags = self.collection.chain().map(function(model) { return model.get('tags'); }).flatten().uniq().value(),
          presets = this.$('#seed-preset-list');
      
      presets.children().remove();
      _(tags).each(function(tag) {
        var item = $('<li>').append($('<h3>').text(tag)).appendTo(presets),
            list = $('<ul></ul>').appendTo(item);
        
        self.collection.each(function(seed) {
          if (seed.get('tags').indexOf(tag) >= 0) {
            $('<li>')
                .append($('<button type="button"></button>')
                    .text(seed.get('name') || '(Unnamed)')
                    .button()
                    .click(function() {
                      self.load(seed);
                      return false;
                    }))
                .buttonset()
                .appendTo(list);
          }
        });
      });
      
      return self;
    },
    
    render: function() {
      var self = this,
          form = $('#seed-editor-form');
      
      $(self.el).dialog({
        autoOpen: false,
        modal: true,
        show: 'fade',
        hide: 'fade',
        title: 'Seeds',
        width: 640
      }).removeClass('hidden');
      
      return self;
    }
  });
  
  // ==================
  // = SeedEditorView =
  // ==================
  
  var SeedEditorView = Backbone.View.extend({
    initialize: function(options) {
      var self = this;
      _.bindAll(this, 'render', 'edit', 'close', 'finish', 'error', 'seed');
    },
    
    seed: function() {
      var self = this,
          form = $('#seed-editor-form'), 
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
    
    edit: function(model, success) {
      var self = this;
      
      self.model = model;
      _.each(model.attributes, function(value, key) {
        self.$('*[name="' + key + '"]').val(value);
      });
      
      $(this.el).dialog('open');
      self.success = success;
    },
    
    close: function() {
      $(this.el).dialog('close');
    },
    
    finish: function() {
      var self = this,
          seed = self.seed(),
          model,
          error;
      
      try {
        self.model.set(seed, { error: function(model, e) { error = e; } });
      } catch(e) {
        error = e;
      }
      
      if (error) {
        $('<p>').text(error.message || error).dialog({
          modal: true,
          title: 'Error',
          buttons: {
            'Close': function() { 
              $(this).dialog('close'); 
              if (error.field) {
                self.$('*[name="' + error.field + '"]').focus();
              }
            }
          }
        });
      } else {
        $(self.el).dialog('close');
      }
    },
    
    render: function() {
      var self = this,
          form = $('#seed-editor-form');
      
      $(self.el).dialog({
        autoOpen: false,
        show: 'fade',
        hide: 'fade',
        title: 'Edit seed',
        width: 640,
        buttons: {
          'Cancel': self.close,
          'Save': self.finish
        }
      }).removeClass('hidden');
      
      // set dirty flag whenever input is changed
      form.find('input, textarea, select').change(function() {
        self.dirty = true;
      });
      
      return self;
    }
  });
  
  // ======================
  // = TreeCollectionView =
  // ======================
  
  /**
   * Renders all members of a TreeCollection in a canvas.
   */
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
          turtle: {}
        });
      });
    },
    
    render: function() {
      var self = this,
          turtle = new lsystem.Turtle(),
          ctx;
      
      ctx = self.el.getContext('2d');
      self.collection.each(function(model) {
        var tree = model.toJSON(),
            index = tree.index || 0,
            steps,
            scaleX = 1, scaleY = 1, scale = 1;
        
        if (index < tree.program.length) {
          steps = Math.round(tree.program.length / 166);
          
          // shift, scale and rotate canvas so turtle is drawn in centre,
          // pointing upwards, and so that everything fits in the canvas
          ctx.save();
          if (tree.width > ctx.canvas.width) {
            scaleX = ctx.canvas.width / tree.width;
          }
          if (tree.height > ctx.canvas.height) {
            scaleY = ctx.canvas.height / tree.height;
          }
          if (scaleX < 1 || scaleY < 1) {
            scale = scaleX < scaleY ? scaleX : scaleY;
          } else {
            scale = 1;
          }
          ctx.translate(Math.round((ctx.canvas.width/2) + (tree.x * scale)), Math.round((ctx.canvas.height/2) + (tree.y * scale)));
          ctx.scale(scale, scale);
          ctx.rotate(Math.PI);
          
          // draw turtle
          turtle.set(tree.turtle || {});
          turtle.draw(ctx, tree.program, index, index + steps);
          ctx.restore();
          
          // store turtle state in our tree model
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
        if (ctx.canvas.width != window.innerWidth || ctx.canvas.height != window.innerHeight) {
          ctx.canvas.width = window.innerWidth;
          ctx.canvas.height = window.innerHeight;
          self.clear();
        }
      }, 100);
    }
    
  });
  
  // ===============
  // = ToolbarView =
  // ===============
  
  var ToolbarView = Backbone.View.extend({
    initialize: function(options) {
      var self = this;
      
      _.bindAll(self, 'update', 'render');
      
      self.seedPresetView = options.seedPresetView;
      self.seedEditorView = options.seedEditorView;
      
      self.collection.bind('change:name', self.update);
      self.collection.bind('add', self.update);
      self.collection.bind('remove', self.update);
    },
    
    update: function() {
      var self = this;
      
      $(self.el).children().remove();
      self.collection.each(function(model) {
        var edit = $('<button>&nbsp;</button>')
                .text(model.get('name') || '(Untitled)')
                .button()
                .click(function() {
                  var seedModel;
            
                  // create intermediate seed model
                  seedModel = new SeedModel(model.toJSON());
                  seedModel.bind('change', function() {
                    self.collection.plant(seedModel.grow());
                  });
            
                  self.seedEditorView.edit(seedModel);
                }),
            open = $('<button>&nbsp;</button>')
                .button({
                  text: false,
                  icons: {
                    primary: 'ui-icon-folder-open'
                  }
                })
                .click(function() {
                  self.seedPresetView.show();
                });
        
        $(self.el).append($('<div>').append(edit, open).buttonset());
      });
      
      return self;
    },
    
    render: function() {
      var self = this;
      return self;
    }
  });
  
  var Controller = Backbone.Controller.extend({
    initialize: function(options) {
      var self = this;
      
      _.bindAll(this, 'loop', 'reset');
      
      // tree
      self.treeCollection = new TreeCollection();
      self.treeCollection.fetch();
      
      self.treeCollectionView = new TreeCollectionView({
        el: document.getElementById('tree-collection-view'),
        collection: self.treeCollection
      });
      
      // seed
      self.seedCollection = new SeedCollection();
      self.seedCollection.fetch();
      
      self.seedPresetView = new SeedPresetView({
        el: document.getElementById('seed-preset-view'),
        collection: self.seedCollection,
        treeCollection: self.treeCollection
      }).render().update();
      
      self.seedEditorView = new SeedEditorView({
        el: document.getElementById('seed-editor-view')
      }).render();
      
      // toolbar
      self.toolbarView = new ToolbarView({
        el: document.getElementById('toolbar'),
        collection: self.treeCollection,
        seedPresetView: self.seedPresetView,
        seedEditorView: self.seedEditorView
      }).render().update();
            
      // reset if new
      if (self.seedCollection.length === 0) {
        self.reset();
      }
      
      // plant initial tree
      self.treeCollection.plant(self.seedCollection.at(0).grow());
      
      // show presets
      self.seedPresetView.show();
      
      // start run loop
      requestAnimFrame(self.loop);
    },
    
    loop: function() {
      requestAnimFrame(this.loop);
      this.treeCollectionView.render();
    },
    
    reset: function() {
      var self = this;
      
      self.treeCollection.remove(self.treeCollection.models, { silent: true });
      self.seedCollection.remove(self.seedCollection.models, { silent: true });
      localStorage.clear();
      self.seedCollection.add(presets);
    }
  });
  
  exports.Controller = Controller;
})();
