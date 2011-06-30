(function() {
  var Backbone = require('backbone'),
      BackboneLocalStorage = require('backbone/localStorage'),
      lsystem = require('grow/lsystem'),
      util = require('grow/util'),
      make = util.make,
      presets = require('grow/presets').presets,
      version = '1';
  
  Backbone.sync = BackboneLocalStorage.sync;
  
  // note version, perform updates
  if (!localStorage['version']) {
    localStorage['version'] = version;
  }
  
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
      if (!attributes.axiom) {
        return { field: 'axiom', message: 'An axiom is required.' };
      }
      if (!attributes.productions) {
        return { field: 'productions', message: 'Production rules are required.' };
      }
      
      return false;
    }
  });
  
  // Collection of SeedModels.
  var SeedCollection = Backbone.Collection.extend({
    localStorage: new BackboneLocalStorage.Store('SeedCollection'),
    model: SeedModel,
    
    initialize: function() {
      var self = this;
      
      _.bindAll(self, 'reset');
    },

    reset: function(continuation) {
      var self = this,
          oldModels = _.clone(self.models);

      // reset collection with presets
      self.refresh([], { silent: true });
      _.each(oldModels, function(m) { m.destroy(); });
      _.each(presets, function(preset) {
        var presetModel = new SeedModel(preset);
        self.add(presetModel, { silent: true });
        presetModel.save();
      });
      self.trigger('reset');
    }
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
      
      delete(tree.id);
            
      // generate the tree
      try {
        tree.seed = model.id;
        tree.program = tree.axiom;
        for (i = 0; i < tree.iterations; i++) {
          tree.program = lsystem.rewrite({
            program: tree.program,
            productions: tree.productions
          });
        }
      } catch (error) {
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
      
      _.bindAll(self, 'render', 'reload', 'show', 'close', 'remove', 'grow');
      
      self.seedEditorView = options.seedEditorView;
      self.collection.bind('reset', self.reload);
      self.collection.bind('refresh', self.reload);
      self.collection.bind('add', self.reload);
      self.collection.bind('remove', self.reload);
      self.collection.bind('change:name', self.reload);
      self.collection.bind('change:tags', self.reload);
    },
    
    show: function() {
      $(this.el).dialog('open');
      return this;
    },
    
    close: function() {
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
    
    reload: function() {
      var self = this,
          tags = self.collection.chain().map(function(seedModel) { return seedModel.get('tags'); }).flatten().uniq().value(),
          presets = this.$('#seed-preset-list');
          
      var createPresetsItem = function(tag, selector) {
        var item = $('<li>'),
            hr = $('<hr>').appendTo(item),
            title = $('<h3>').text(tag).appendTo(item),
            list = $('<ul>').appendTo(item);
        
        self.collection.chain()
            .filter(selector)
            .each(function(seedModel) {
                  make('li', [
                    make('button', seedModel.get('name') || '(Unnamed)').button().click(function() {
                      self.grow(seedModel);
                    }),
                    make('button', '&nbsp;').button({ text: false, icons: { primary: 'ui-icon-close' } }).click(function() {
                      self.remove(seedModel);
                    })
                  ]).buttonset().appendTo(list);
                })
            .value();
        
        if (list.children().length > 0) {
          item.appendTo(presets);
        }
      };
      
      // presets
      presets.children().remove();
      _(tags).each(function(tag) {
        createPresetsItem(tag, function(m) { return m.get('tags').indexOf(tag) >= 0; });
      });
      createPresetsItem('Other', function(m) { return m.get('tags').length === 0; });
      
      // actions
      make('li', [
        make('hr'),
        make('ul', [
          make('li', [
            make('button', 'New...').button().click(function() {
              self.close();
              self.seedEditorView.edit(new SeedModel(), function(seedModel) {
                if (!self.collection.include(seedModel)) {
                  self.collection.add(seedModel);
                }
                seedModel.save(seedModel.toJSON(), { 
                  success: function() {
                    self.model.grow(seedModel);
                  }
                });
              });
            })
          ]),
          make('li', [
            make('button', 'Reset...').button().click(function() {
              $('<div><p>Are you sure you want to reset the presets? Any new presets or changes you have made will be lost.</p></div>').dialog({
                title: 'Reset presets?',
                modal: true,
                buttons: {
                  'Cancel': function() {
                    $(this).dialog('close');
                  },
                  'Reset': function() {
                    self.collection.reset();
                    $(this).dialog('close');
                  }
                }
              });
            })
          ])
        ])
      ]).appendTo(presets);
      
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
      _.bindAll(this, 'render', 'edit', 'close', 'commit', 'error', 'createSeed');
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
        iterations: parseInt(self.$('#seed-iterations').val() || '0', 10)
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
      self.$('#seed-axiom').val(seed.axiom || 'F');
      self.$('#seed-productions').val(seed.productions || 'F -> F+F');
      self.$('#seed-iterations').val(seed.iterations || 1);
      
      $(this.el).dialog('open');
      self.success = success;
    },
    
    close: function() {
      $(this.el).dialog('close');
    },
    
    commit: function() {
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
        return false;
      } else {
        if (self.success) {
          self.success(self.model);
        }
        return true;
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
          'OK': function() { 
                if (self.commit()) {
                  self.close();
                } 
              },
          'Close': self.close,
          'Apply': self.commit
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
      
      if (!tree.program) {
        return;
      }
      
      ctx = self.el.getContext('2d');
      if (index < tree.program.length) {
        // compute number of steps to draw per frame to draw entire thing in 
        // 8s, assuming 60fps ((1000/60) * s)
        steps = Math.round(tree.program.length / 133);
        steps = steps > 0 ? steps : 1;
        
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
      
      _.bindAll(self, 'reload');
      
      self.seedCollection = options.seedCollection;
      self.seedPresetView = options.seedPresetView;
      self.seedEditorView = options.seedEditorView;
      
      self.model.bind('change:name', self.reload);
      self.model.bind('change:seed', self.reload);
    },
    
    reload: function() {
      var self = this,
          treeModel = self.model,
          seedModel,
          buttons = $('<div>');
      
      // current tree's seed button
      seedModel = self.seedCollection.find(function(m) { return m.get('id') == treeModel.get('seed'); });
      if (seedModel) {
        buttons.append($('<button>&nbsp;</button>')
            .text(treeModel.get('name') || '(Untitled)')
            .attr('title', 'Edit tree options.')
            .button()
            .click(function() {
              self.seedEditorView.edit(seedModel, function() {
                seedModel.save();
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
      
      _.bindAll(this, 'loop');
      
      // tree model and view
      self.treeModel = new TreeModel();
      self.treeView = new TreeView({
        el: document.getElementById('tree-view'),
        model: self.treeModel
      });
      
      // seed collection and views
      self.seedCollection = new SeedCollection();

      self.seedEditorView = new SeedEditorView({
        el: document.getElementById('seed-editor-view')
      }).render();

      self.seedPresetView = new SeedPresetView({
        el: document.getElementById('seed-preset-view'),
        collection: self.seedCollection,
        model: self.treeModel,
        seedEditorView: self.seedEditorView
      }).render().reload();
      
      // tree toolbar
      self.treeToolbarView = new TreeToolbarView({
        el: document.getElementById('tree-toolbar-view'),
        model: self.treeModel,
        seedCollection: self.seedCollection,
        seedPresetView: self.seedPresetView,
        seedEditorView: self.seedEditorView
      }).render().reload();
            
      // fetch seeds
      self.seedCollection.bind('reset', function() {
        self.treeModel.grow(self.seedCollection.at(0));
      });
      self.seedCollection.fetch({
        success: function() {
          if (self.seedCollection.length === 0) {
            self.seedCollection.reset();
          } else {
            self.treeModel.grow(self.seedCollection.at(0));
          }
        }
      });
      
      // show presets
      self.seedPresetView.show();
      
      // start run loop
      requestAnimFrame(self.loop);
    },
    
    loop: function() {
      requestAnimFrame(this.loop);
      this.treeView.render();
    }
  });
  
  exports.Controller = Controller;
})();
