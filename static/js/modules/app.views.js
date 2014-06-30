;(function() {
  'use strict';

  app.pkg('app.modules');
  app.modules.views = function(dom, d) {
    var self = this,
        sigmaController = new app.utils.sigmaController('views', dom, d),
        s = d.get('mainSigma');

    /**
     * Properties
     */
    this.filter = new app.classes.filter(d);
    this.thumbnails = [];
    this.snapshotThumbnails = [];

    /**
     * Methods
     */
    this.renderSnapshots = function() {
      var snapshots = d.get('snapshots'),
          meta = d.get('meta');

      if (!snapshots)
        return;

      app.templates.require('app.views.snapshot', function(snapshotTemplate) {

        $('.views-band', dom).empty().append(
          snapshotTemplate({snapshots: snapshots})
        );

        // Killing thumbnails
        self.snapshotThumbnails.forEach(function(t) {
          t.kill();
        });

        // Creating thumbnails
        snapshots.forEach(function(snapshot, i) {
          var c = app.utils.first(meta.model.node, function(c) {
            return c.id === snapshot.filters[0].category;
          });

          self.snapshotThumbnails.push(
            $('[data-app-thumbnail-snapshot="' + i + '"].view-thumbnail').thumbnail(s, {
              category: c,
              filter: snapshot.filters[0].values
            })
          );

          self.snapshotThumbnails.forEach(function(t) {
            t.init();
          });
        });
      });
    };

    this.kill = function() {
      sigmaController.killRenderer();
      this.thumbnails.forEach(function(t) {
        t.kill();
      });
      this.snapshotThumbnails.forEach(function(t) {
        t.kill();
      });
    };

    // TODO: create custom abstraction for this?
    // Columns layout
    function openPanel(panelName, options) {
      options = options || {};

      app.templates.require(panelName, function(template) {
        var panel;
        dom.find('*[data-app-views-panel="sidebar"]').find('.active').removeClass('active');

        panel = $(template(options.category));
        $('.network-item[data-app-thumbnail-category="' + options.category.id + '"]', dom).addClass('active');
        s.mapColors(options.category);

        // Events:
        $('.tirette', panel).click(function(e) {
          closePanel();
          e.preventDefault();
        });

        // Deal with panel
        dom.find('*[data-app-views-panel="sigma"]').removeClass('col-xs-9').addClass('col-xs-6');
        dom.find('.col-middle').show().empty().append(panel);
        $('.forcelayout-container .tirette', dom).hide();
        sigmaController.renderer.resize();
        sigmaController.renderer.render();
      });
    }

    function closePanel() {
      dom.find('*[data-app-views-panel="sidebar"]').find('.active').removeClass('active');
      dom.find('*[data-app-views-panel="sigma"]').removeClass('col-xs-6').addClass('col-xs-9');
      dom.find('.col-middle').empty().hide();

      s.mapColors();
      sigmaController.renderer.resize();
      sigmaController.renderer.render();
    }

    /**
     * Initialization
     */
    if ((d.get('snapshots') || []).length)
      this.renderSnapshots();


    /**
     * Bindings
     */
    $('[data-app-view-action]', dom).click(function(e) {
      var action = $(this).attr('data-app-view-action');

      if (action === 'snapshot') {

        // We take a snapshot of the graph

        // Feedback
        // TODO: trigger a modal cf. issue #38
        if (!d.get('spaceId')) {
          app.danger('dev - graph not saved, you cannot take snapshots.');
          e.preventDefault();
          return;
        }

        // Dispatch event
        self.dispatchEvent('takeSnapshot', {
          filter: self.filter.export()
        });
      }

      e.preventDefault();
    });

    // TODO: DRY this up!
    dom.on('click', '.network-item', function(e) {
      var cat,
          t = $(e.target);
      t = t.hasClass('.network-item') ? t : t.parents('.network-item');
      cat = t.attr('data-app-thumbnail-category');

      // Updating filter's category
      self.filter.set(cat);
      if (typeof self.filter.category === 'object')
        openPanel('app.misc.categoryPanel', {
          category: self.filter.category
        });
    });

    // TODO: DRY this up!
    dom.on('click', '.category-item', function(e) {
      var t = $(e.target),
          value,
          cat;
      t = t.hasClass('.category-item') ? t : t.parents('.category-item');

      // Retrieving needed data
      value = t.find('.cat-item-label').text(),
      cat = $('.network-item.active', dom).attr('data-app-thumbnail-category');

      // Updating classes
      t.toggleClass('active');

      // Adding or removing the value from the filter
      if (t.hasClass('active')) {
        self.filter.add(value);
        t.removeClass('cat-item-muted');
      }
      else {
        self.filter.remove(value);
        t.addClass('cat-item-muted');
      }

      // If no one has the active class anymore
      var nb_active = $('.category-item.active', dom).length;
      if (!nb_active) {
        $('.category-item', dom).removeClass('cat-item-muted');
      }
      else if (nb_active === 1){
        $('.category-item:not(.active)', dom).addClass('cat-item-muted');
      }

      // Updating sigma
      s.highlight(self.filter);
    });

    // If we click elsewhere, we reinitialize the filter
    dom.on('click', '.categories-container', function(e) {
      if (e.target !== this && !$(e.target).is('.title'))
        return;

      self.filter.removeAll();
      $('.category-item', dom).removeClass('cat-item-muted active');

      // Updating sigma
      s.highlight(self.filter);
    });

    /**
     * Receptors
     */
    this.triggers.events.snapshotsUpdated = this.renderSnapshots;

    // TODO: DRY this up!
    this.triggers.events.metaUpdated = function(d) {
      var w,
          h;

      // Display categories on sidebar:
      app.templates.require('app.misc.category', function(template) {
        var container = $('.subcontainer-networklist', dom).empty();
        ((((d.get('meta') || {}) || {}).model || {}).node || []).forEach(function(o) {
          if (o.noDisplay)
            return;

          $(template(o)).appendTo(container);

          // Creating thumbnails
          self.thumbnails.push(
            $('[data-app-thumbnail-category="' + o.id + '"] .network-thumbnail').thumbnail(s, {category: o})
          );
        });

        self.thumbnails.forEach(function(t) {
          t.init();
        });
      });
    };
    this.triggers.events.metaUpdated(d);
  };
}).call(this);
