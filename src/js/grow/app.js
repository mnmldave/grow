(function() {
  var Backbone = require('backbone'),
      BackboneLocalStorage = require('backbone/localStorage'),
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
      turtle.render(this.model.attributes, this.el);
      return this;
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
      this.treeModel.save(turtle.update(this.treeModel.toJSON()));
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
