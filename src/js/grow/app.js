(function() {
  var Backbone = require('backbone'),
      BackboneLocalStorage = require('backbone/localStorage'),
      generator = require('grow/generator'),
      vectorizor = require('grow/vectorizor'),
      turtle = require('grow/turtle'),
      make = require('grow/util').make;
  
  Backbone.sync = BackboneLocalStorage.sync;
  
  var SeedCollection = Backbone.Collection.extend({
    localStorage: new BackboneLocalStorage.Store('SeedCollection'),
    model: Backbone.Model
  });
  
  var TreeCollection = Backbone.Collection.extend({
    localStorage: new BackboneLocalStorage.Store('TreeCollection'),
    model: Backbone.Model
  });
  
  var TreeView = Backbone.View.extend({
    initialize: function(options) {
      _.bindAll(this, 'render');
      this.model.bind('change', this.render);
    },
    
    render: function() {
      var self = this,
          ctx,
          tree = this.model.attributes,
          vector = tree.vector,
          i, c;
      
      var start = new Date().getTime();
      if (vector) {
        ctx = this.el.getContext('2d');
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.save();
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 0.1;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.translate(ctx.canvas.width / 2, ctx.canvas.height);
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
      }
      console.log('Rendered in ' + (new Date().getTime() - start) + 'ms');
      
      return self;
    }
  });
  
  var Controller = Backbone.Controller.extend({
    routes: {
      '': 'index'
    },

    initialize: function(options) {
      _.bindAll(this, 'index', 'update', 'resize', 'click', 'seed');
      
      this.seedCollection = new SeedCollection();
      this.seedCollection.fetch();
      if (this.seedCollection.length == 0) {
        this.seedCollection.add({
          name: 'Example 1.24',
          iterations: 4,
          program: 'F(3)',
          productions: 'F -> F(n*1)[+(-25.7)F(n)]F(n)[+(25.7)F(n)]F(n)'
        });
      }
      this.seedModel = this.seedCollection.at(0);
      
      this.treeCollection = new TreeCollection();
      this.treeCollection.fetch();
      if (this.treeCollection.length == 0) {
        this.treeCollection.add({});
      }
      this.treeModel = this.treeCollection.at(0);
      this.treeView = new TreeView({
        el: document.getElementById('canvas'),
        model: this.treeModel
      });
      
      this.updateTimer = setInterval(this.update, 30/1000);
      
      $(window).resize(this.resize).resize();
      $('#canvas').click(this.click);
    },
    
    index: function() {
    },
    
    seed: function() {
      var self = this,
          iterations,
          program,
          productions,
          form,
          dialog,
          start;
      
      
      form = make('form', [
        make('table', [
          make('tr', [
            make('th').text('Iterations'),
            make('td', [ 
              iterations = make('input').val(self.seedModel.get('iterations'))
            ])
          ]),
          make('tr', [
            make('th').text('Program'),
            make('td', [ 
              program = make('input').val(self.seedModel.get('program'))
            ])
          ]),
          make('tr', [
            make('th').text('Productions'),
            make('td', [ 
              productions = make('textarea', { rows: 4 }).val(self.seedModel.get('productions'))
            ])
          ])
        ])
      ]);
      
      dialog = $('<div>', { 'class': 'seed-dialog' }).append(form);
      dialog.dialog({
        title: 'Seed',
        resizable: true,
        modal: true,
        width: 640,
        buttons: [
          {
            text: 'Start',
            click: function() {
              var seed = {
                'iterations': parseInt(iterations.val(), 10),
                'program': program.val(),
                'productions': productions.val()
              };

              self.seedModel.save(seed);
              self.treeModel.save(seed);

              $(this).dialog('close');
            }
          },
          {
            text: 'Cancel',
            click: function() {
              $(this).dialog('close');
            }
          }
        ]
      });
    },
    
    update: function() {
      var tree = this.treeModel.toJSON();
      
      if (!(tree.iterations > 0)) {
        return;
      }
      
      // generate a new version of the tree and compile vector instructions
      // for rendering
      tree.program = generator.generate({
        productions: tree.productions,
        program: tree.program
      });
      tree.vector = vectorizor.vectorize(tree.program);
      tree.iterations = tree.iterations - 1;
      
      // save
      this.treeModel.save(tree);
    },
    
    resize: function(e) {
      var self = this;
      if (self.resizeTimer) {
        clearTimeout(self.resizeTimer);
      }
      
      self.resizeTimer = setTimeout(function() {
        var ctx = document.getElementById('canvas').getContext('2d');
        ctx.canvas.width = window.innerWidth;
        ctx.canvas.height = window.innerHeight;

        self.treeView.render();
      }, 100);
    },
    
    click: function(e) {
      this.seed();
    }
  });
  
  exports.Controller = Controller;
})();
