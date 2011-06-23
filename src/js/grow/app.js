(function() {
  var Backbone = require('backbone'),
      BackboneLocalStorage = require('backbone/localStorage'),
      grow = require('grow/grow'),
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
  
  var SeedCollectionView = Backbone.View.extend({
    initialize: function(options) {
      _.bindAll(this, 'update', 'render', 'show', 'hide', 'plant');
      this.collection.bind('all', this.update);
    },
    
    show: function() {
      $(this.el).dialog('open');
    },
    
    hide: function() {
      $(this.el).dialog('close');
    },
    
    plant: function() {
      $(this.el).dialog('close');
    },
    
    update: function() {
      var self = this;
      
      
      
      return self;
    },
    
    render: function() {
      var self = this;
      
      $(this.el).dialog({
        autoOpen: false,
        show: 'fade',
        hide: 'fade',
        title: 'Configure',
        width: 640,
        height: 480,
        buttons: {
          'Cancel': self.hide,
          'Plant': self.plant
        }
      }).removeClass('hidden');
      
      return self;
    }
  });
  
  var TreeView = Backbone.View.extend({
    initialize: function(options) {
      _.bindAll(this, 'render', 'resize');
      this.model.bind('change', this.render);
      $(window).resize(this.resize);
    },
    
    render: function() {
      // TODO stop render if 
      grow.render(this.model.attributes, this.el);
      return this;
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

        self.render();
      }, 100);
    }
    
  });
  
  var Controller = Backbone.Controller.extend({
    routes: {
      '': 'index'
    },

    initialize: function(options) {
      _.bindAll(this, 'index', 'update', 'reset');
      
      this.seedCollection = new SeedCollection();
      this.seedCollection.fetch();
      
      this.seedCollectionView = new SeedCollectionView({
        el: document.getElementById('seed-collection-view'),
        collection: this.seedCollection
      }).render();
      
      this.treeCollection = new TreeCollection();
      this.treeCollection.fetch();
      if (this.treeCollection.length == 0) {
        this.treeCollection.add({});
      }
      
      this.treeModel = this.treeCollection.at(0);
      
      this.treeView = new TreeView({
        el: document.getElementById('tree-view'),
        model: this.treeModel
      });
      $('#main').click(this.seedCollectionView.show);
    },
    
    reset: function() {
      this.seedCollection.add(
        {
          name: 'Example 1.24',
          iterations: 4,
          program: 'F(3)',
          productions: 'F -> F(n)[+(-25.7)F(n)]F(n)[+(25.7)F(n)]F(n)',
          x: 'center',
          y: 'bottom'
        },
        {
          name: 'Koch'
        }
      );
    },
    
    index: function() {
    },
    
    update: function() {
      this.treeModel.save(grow.update(this.treeModel.toJSON()));
    }
  });
  
  exports.Controller = Controller;
})();
