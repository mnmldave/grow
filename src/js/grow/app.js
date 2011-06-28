(function() {
  var Backbone = require('backbone'),
      BackboneLocalStorage = require('backbone/localStorage'),
      lsystem = require('grow/lsystem'),
      util = require('grow/util'),
      presets = require('grow/presets').presets;
  
  Backbone.sync = BackboneLocalStorage.sync;
  
  // Encapsulates a "seed" which is essentially just the axiom, productions,
  // and number of iterations. Also contains meta data like name, description
  // and tags array.
  var SeedModel = Backbone.Model.extend({
    initialize: function() {
      var self = this;
      
      _.bindAll(self, 'validate');
    },
    
    validate: function(attributes) {
      if (!attributes.name) {
        return { field: 'name', message: 'A name is required.' };
      }
      
      return false;
    }
  });
  
  // Collection of SeedModels.
  var SeedCollection = Backbone.Collection.extend({
    localStorage: new BackboneLocalStorage.Store('SeedCollection'),
    model: SeedModel
  });
  
  // Encapsulates the data needed to render a "tree", which is just a 
  // compiled and rewritten seed. The essential data is the program, which is
  // an array of module objects each containing a 'c' command and 'p' 
  // parameters to be interpreted by an lsystem.Turtle() instance for drawing.
  // You can easily convert a seed into a tree with the included "grow" method
  // which will set the tree data by compiling a seed.
  var TreeModel = Backbone.Model.extend({
    initialize: function() {
      var self = this;
      
      _.bindAll(self, 'grow');
    },
    
    grow: function(model) {
      var self = this,
          tree = model.toJSON(),
          ctx, xMin = 0, xMax = 0, yMin = 0, yMax = 0,
          turtle;
      
      // generate the tree
      tree.seed = model.id || model.cid;
      tree.program = tree.axiom;
      for (i = 0; i < tree.iterations; i++) {
        tree.program = lsystem.rewrite({
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
      
      self.set(tree);
    }
  });
  
  var SeedPresetView = Backbone.View.extend({
    initialize: function(options) {
      var self = this;
      
      _.bindAll(self, 'render', 'update', 'show', 'hide', 'remove', 'grow');
      
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
    
    grow: function(seedModel) {
      this.model.grow(seedModel);
      $(this.el).dialog('close');
    },
    
    remove: function(seedModel) {
      var self = this;
      
      $('<div><p>Are you sure you want to delete the preset "' + seedModel.get('name') + '"?</p></div>').dialog({
        title: 'Delete preset?',
        modal: true,
        buttons: {
          'Cancel': function() {
            $(this).dialog('close');
          },
          'Delete': function() {
            seedModel.destroy();
            self.collection.remove(seedModel);
            $(this).dialog('close');
          }
        }
      });
    },
    
    update: function() {
      var self = this,
          tags = self.collection.chain().map(function(seedModel) { return seedModel.get('tags'); }).flatten().uniq().value(),
          presets = this.$('#seed-preset-list');
      
      presets.children().remove();
      _(tags).each(function(tag) {
        var item = $('<li>').append($('<h3>').text(tag)).appendTo(presets),
            list = $('<ul></ul>').appendTo(item);
        
        self.collection.each(function(seedModel) {
          if (seedModel.get('tags').indexOf(tag) >= 0) {
            $('<li>')
                .append($('<button type="button"></button>')
                    .text(seedModel.get('name') || '(Unnamed)')
                    .button()
                    .click(function() {
                      self.grow(seedModel);
                      return false;
                    }))
                .append($('<button type="button">&nbsp;</button>')
                    .button({
                      text: false,
                      icons: { primary: 'ui-icon-close' }
                    })
                    .click(function() {
                      self.remove(seedModel);
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
      _.bindAll(this, 'render', 'edit', 'close', 'finish', 'error', 'createSeed');
    },
    
    createSeed: function() {
      var self = this,
          form = $('#seed-editor-form'),
          seed;
      
      // construct seed from values
      seed = {
        name: self.$('#seed-name').val(),
        description: self.$('#seed-description').val(),
        tags: _(self.$('#seed-tags').val().split(','))
            .chain()
            .map(function(t) { return $.trim(t); })
            .compact()
            .value(),
        axiom: self.$('#seed-axiom').val(),
        productions: self.$('#seed-productions').val(),
        iterations: parseInt(self.$('#seed-iterations').val(), 10)
      };
      
      return seed;
    },
    
    error: function(model, error) {
      alert(error);
    },
    
    edit: function(model, success) {
      var self = this,
          seed = model.attributes;

      self.model = model;
      self.$('#seed-id').val(model.id);
      self.$('#seed-name').val(seed.name);
      self.$('#seed-description').val(seed.description);
      self.$('#seed-tags').val((seed.tags || []).join(', '));
      self.$('#seed-axiom').val(seed.axiom);
      self.$('#seed-productions').val(seed.productions);
      self.$('#seed-iterations').val(seed.iterations);
      
      $(this.el).dialog('open');
      self.success = success;
    },
    
    close: function() {
      $(this.el).dialog('close');
    },
    
    finish: function() {
      var self = this,
          model,
          error;
      
      try {
        self.model.set(self.createSeed(), { error: function(model, e) { error = e; } });
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
        if (self.success) {
          self.success(self.model);
        }
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
  
  // ============
  // = TreeView =
  // ============
  
  var TreeView = Backbone.View.extend({
    initialize: function(options) {
      _.bindAll(this, 'render', 'resize', 'clear');
      this.model.bind('change:program', this.clear);
      $(window).resize(this.resize).resize();
    },
    
    clear: function() {
      var self = this,
          ctx = self.el.getContext('2d');

      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      self.model.set({ 
        index: 0,
        turtle: {}
      });
    },
    
    render: function() {
      var self = this,
          turtle = new lsystem.Turtle(),
          model = self.model,
          ctx,
          tree = model.toJSON(),
          index = tree.index || 0,
          steps,
          scaleX = 1, scaleY = 1, scale = 1;
      
      ctx = self.el.getContext('2d');
      if (index < tree.program.length) {
        // compute number of steps to draw per frame to draw entire thing in 
        // 8s, assuming 60fps ((1000/60) * s)
        steps = Math.round(tree.program.length / 133);
        
        // shift, scale and rotate canvas so turtle is drawn in centre,
        // pointing upwards, and with everything inside the canvas
        scaleX = ctx.canvas.width / (tree.width || 1);
        scaleY = ctx.canvas.height / (tree.height || 1);
        scale = scaleX < scaleY ? scaleX : scaleY;
        scale = scale < 1 ? scale : 1;

        ctx.save();
        ctx.translate(Math.round((ctx.canvas.width/2) + (tree.x * scale)), Math.round((ctx.canvas.height/2) + (tree.y * scale)));
        ctx.scale(scale, scale);
        ctx.rotate(Math.PI);
        
        // draw turtle draw!
        turtle.set(tree.turtle || {});
        turtle.draw(ctx, tree.program, index, index + steps);
        ctx.restore();
        
        // save turtle state to tree model
        model.set({
          turtle: turtle.toJSON(),
          index: index + steps
        });
      }
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
  
  // ===================
  // = TreeToolbarView =
  // ===================
  
  var TreeToolbarView = Backbone.View.extend({
    initialize: function(options) {
      var self = this;
      
      _.bindAll(self, 'update');
      
      self.seedCollection = options.seedCollection;
      self.seedPresetView = options.seedPresetView;
      self.seedEditorView = options.seedEditorView;
      
      self.model.bind('change:name', self.update);
      self.model.bind('change:seed', self.update);
    },
    
    update: function() {
      var self = this,
          treeModel = self.model,
          seedModel,
          buttons = $('<div>');
      
      // current tree's seed button
      seedModel = self.seedCollection.get(treeModel.get('seed')) || self.seedCollection.getByCid(treeModel.get('seed'));
      if (seedModel) {
        buttons.append($('<button>&nbsp;</button>')
            .text(treeModel.get('name') || '(Untitled)')
            .attr('title', 'Edit tree options.')
            .button()
            .click(function() {
              self.seedEditorView.edit(seedModel, function() {
                treeModel.grow(seedModel);
              });
            }));
      }
      
      // browse button
      buttons.append($('<button>&nbsp;</button>')
          .attr('title', 'Load a tree.')
          .button({
            text: false,
            icons: {
              primary: 'ui-icon-folder-open'
            }
          })
          .click(function() {
            self.seedPresetView.show();
          }));
      buttons.buttonset();

      $(self.el).children().remove();
      $(self.el).append(buttons);
      
      return self;
    }
  });
  
  var Controller = Backbone.Controller.extend({
    initialize: function(options) {
      var self = this;
      
      _.bindAll(this, 'loop', 'reset');
      
      // tree model and view
      self.treeModel = new TreeModel();
      self.treeView = new TreeView({
        el: document.getElementById('tree-view'),
        model: self.treeModel
      });
      
      // seed collection and views
      self.seedCollection = new SeedCollection();
      self.seedCollection.fetch();
      self.seedPresetView = new SeedPresetView({
        el: document.getElementById('seed-preset-view'),
        collection: self.seedCollection,
        model: self.treeModel
      }).render().update();
      self.seedEditorView = new SeedEditorView({
        el: document.getElementById('seed-editor-view')
      }).render();
      
      // tree toolbar
      self.treeToolbarView = new TreeToolbarView({
        el: document.getElementById('tree-toolbar-view'),
        model: self.treeModel,
        seedCollection: self.seedCollection,
        seedPresetView: self.seedPresetView,
        seedEditorView: self.seedEditorView
      }).render().update();
            
      // reset if no seeds
      if (self.seedCollection.length === 0) {
        self.reset();
      }
      
      // plant initial tree
      self.treeModel.grow(self.seedCollection.at(0));
      
      // show presets
      self.seedPresetView.show();
      
      // start run loop
      requestAnimFrame(self.loop);
    },
    
    loop: function() {
      requestAnimFrame(this.loop);
      this.treeView.render();
    },
    
    reset: function() {
      var self = this;
      
      // clear and create seeds
      self.seedCollection.remove(self.seedCollection.models, { silent: true });
      localStorage.clear();
      self.seedCollection.add(presets, { silent: true });
      self.seedCollection.trigger('refresh');
    }
  });
  
  exports.Controller = Controller;
})();
