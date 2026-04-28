export class MenuBar {
  constructor(app) {
    this.app = app;
    this.element = document.getElementById("menu-bar");
    this.render();
  }

  render() {
    var hideBars = this.app.state.get('hideBars');
    var html = '<div class="menu-item">File<div class="menu-dropdown"><div class="menu-dropdown-item" data-action="new">New... <span class="shortcut">Ctrl+N</span></div><div class="menu-dropdown-item" data-action="open">Open... <span class="shortcut">Ctrl+O</span></div><div class="menu-dropdown-item" data-action="save">Save PNG <span class="shortcut">Ctrl+S</span></div><div class="menu-dropdown-item" data-action="export-gif">Export GIF</div></div></div><div class="menu-item">Edit<div class="menu-dropdown"><div class="menu-dropdown-item" data-action="undo">Undo <span class="shortcut">Ctrl+Z</span></div><div class="menu-dropdown-item" data-action="redo">Redo <span class="shortcut">Ctrl+Y</span></div><div class="menu-dropdown-item" data-action="clear">Clear Layer</div><div class="menu-dropdown-item" data-action="resize">Resize Canvas</div></div></div><div class="menu-item">View<div class="menu-dropdown"><div class="menu-dropdown-item" data-action="zoom-in">Zoom In <span class="shortcut">Ctrl+Scroll</span></div><div class="menu-dropdown-item" data-action="zoom-out">Zoom Out</div><div class="menu-dropdown-item" data-action="grid">Toggle Grid</div><div class="menu-dropdown-item" data-action="theme">Toggle Theme</div><div class="menu-dropdown-item" data-action="retro-font">Toggle Retro Font</div><div class="menu-dropdown-item" data-action="hide-bars">' + (hideBars ? '✓ ' : '') + 'Auto-hide Bars</div></div></div><div class="menu-item">Layer<div class="menu-dropdown"><div class="menu-dropdown-item" data-action="add-layer">Add Layer</div><div class="menu-dropdown-item" data-action="remove-layer">Remove Layer</div><div class="menu-dropdown-item" data-action="duplicate-layer">Duplicate Layer</div><div class="menu-dropdown-item" data-action="merge-down">Merge Down</div><div class="menu-dropdown-item" data-action="scale-50">Scale 50%</div><div class="menu-dropdown-item" data-action="scale-200">Scale 200%</div><div class="menu-dropdown-item" data-action="rotate-90">Rotate 90°</div><div class="menu-dropdown-item" data-action="rotate-180">Rotate 180°</div><div class="menu-dropdown-item" data-action="crop-selection">Crop to Selection</div></div></div><div class="menu-item">Image<div class="menu-dropdown"><div class="menu-dropdown-item" data-action="remove-bg">Remove Background</div></div></div>';
    
    this.element.innerHTML = html;

    this.element.querySelectorAll(".menu-dropdown-item").forEach((item) => {
      item.onclick = (e) => {
        var action = item.getAttribute("data-action");
        this.handleAction(action);
      };
    });

    this.app.state.on('hideBars', () => this.render());
  }

  handleAction(action) {
    var app = this.app;
    switch(action) {
      case "new": this.newFileDialog(); break;
      case "open": app.importer.openFile(); break;
      case "save": app.exporter.savePNG(); break;
      case "export-gif": app.exporter.saveGIF(); break;
      case "undo": app.history.undo(); app.canvas.render(); break;
      case "redo": app.history.redo(); app.canvas.render(); break;
      case "clear": 
        var layerIdx = app.state.get('activeLayer');
        var layer = app.state.get('layers')[layerIdx];
        if (layer) {
          layer.pixels.fill(0);
          layer.dirty = true;
          app.canvas.render();
        }
        break;
      case "resize": this.resizeDialog(); break;
      case "zoom-in": app.canvas.zoomIn(); break;
      case "zoom-out": app.canvas.zoomOut(); break;
      case "grid": app.state.set("showGrid", !app.state.get("showGrid")); app.canvas.render(); break;
      case "theme": document.body.classList.toggle("light-theme"); break;
      case "retro-font": 
        var isRetro = !app.state.get("retroFont");
        app.state.set("retroFont", isRetro);
        document.body.classList.toggle("retro-font");
        localStorage.setItem("prity-retro-font", isRetro);
        var link = document.getElementById("retro-font-link");
        if (link) link.style.display = isRetro ? "block" : "none";
        break;
      case "hide-bars":
        var current = app.state.get("hideBars");
        app.state.set("hideBars", !current);
        break;
      case "add-layer": this.addLayer(); break;
      case "remove-layer": this.removeLayer(); break;
      case "duplicate-layer": this.duplicateLayer(); break;
      case "merge-down": this.mergeDown(); break;
      case "scale-50": app.tools.move.scaleLayer(0.5, 0.5); break;
      case "scale-200": app.tools.move.scaleLayer(2, 2); break;
      case "rotate-90": app.tools.move.rotateLayer(90); break;
      case "rotate-180": app.tools.move.rotateLayer(180); break;
      case "crop-selection": if (app.hasSelection()) app.tools.move.cropToSelection(); break;
      case "remove-bg": app.exporter.removeBackground(); break;
    }
  }

   addLayer() {
     this.app.layersPanel.addLayer();
   }

  removeLayer() {
    var layers = this.app.state.get("layers");
    var activeIdx = this.app.state.get("activeLayer");
    if (layers.length <= 1) return;
    layers.splice(activeIdx, 1);
    this.app.state.set("layers", layers);
    this.app.state.set("activeLayer", Math.min(activeIdx, layers.length - 1));
    this.app.layersPanel.render();
  }

  duplicateLayer() {
    var layers = this.app.state.get("layers");
    var activeIdx = this.app.state.get("activeLayer");
    var original = layers[activeIdx];
    if (!original) return;
    var newLayer = this.app.state.createLayer("Layer " + (layers.length + 1));
    newLayer.pixels = new Uint8ClampedArray(original.pixels);
    newLayer.opacity = original.opacity;
    newLayer.visible = original.visible;
    newLayer.dirty = true;
    layers.push(newLayer);
    this.app.state.set("layers", layers);
    this.app.state.set("activeLayer", layers.length - 1);
    this.app.layersPanel.render();
  }

  mergeDown() {
    var layers = this.app.state.get("layers");
    var activeIdx = this.app.state.get("activeLayer");
    if (activeIdx >= layers.length - 1 || layers.length < 2) return;
    var top = layers[activeIdx];
    var bottom = layers[activeIdx + 1];
    var width = this.app.canvas.width;
    for (var i = 0; i < top.pixels.length; i += 4) {
      if (top.pixels[i + 3] > 0) {
        bottom.pixels[i] = top.pixels[i];
        bottom.pixels[i + 1] = top.pixels[i + 1];
        bottom.pixels[i + 2] = top.pixels[i + 2];
        bottom.pixels[i + 3] = top.pixels[i + 3];
      }
    }
    bottom.dirty = true;
    layers.splice(activeIdx, 1);
    this.app.state.set("layers", layers);
    this.app.state.set("activeLayer", activeIdx);
    this.app.layersPanel.render();
    this.app.canvas.render();
  }

  newFileDialog() {
    var overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.innerHTML = '<div class="modal"><div class="modal-title">New Canvas</div><div class="modal-field"><label>Width</label><input type="number" id="new-width" value="32" min="1" max="4096"></div><div class="modal-field"><label>Height</label><input type="number" id="new-height" value="32" min="1" max="4096"></div><div class="modal-buttons"><button class="btn" id="cancel-new">Cancel</button><button class="btn btn-primary" id="confirm-new">Create</button></div></div>';
    document.body.appendChild(overlay);
    var self = this;
    overlay.querySelector("#cancel-new").onclick = function() { overlay.remove(); };
    overlay.querySelector("#confirm-new").onclick = function() {
      var w = parseInt(overlay.querySelector("#new-width").value);
      var h = parseInt(overlay.querySelector("#new-height").value);
      self.app.state.initCanvas(w, h);
      self.app.canvas.render();
      self.app.layersPanel.render();
      overlay.remove();
    };
  }

  resizeDialog() {
    var overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.innerHTML = '<div class="modal"><div class="modal-title">Resize Canvas</div><div class="modal-field"><label>Width</label><input type="number" id="resize-width" value="' + this.app.canvas.width + '" min="1" max="1024"></div><div class="modal-field"><label>Height</label><input type="number" id="resize-height" value="' + this.app.canvas.height + '" min="1" max="1024"></div><div class="modal-buttons"><button class="btn" id="cancel-resize">Cancel</button><button class="btn btn-primary" id="confirm-resize">Resize</button></div></div>';
    document.body.appendChild(overlay);
    var self = this;
    overlay.querySelector("#cancel-resize").onclick = function() { overlay.remove(); };
    overlay.querySelector("#confirm-resize").onclick = function() {
      var w = parseInt(overlay.querySelector("#resize-width").value);
      var h = parseInt(overlay.querySelector("#resize-height").value);
      self.app.canvas.resizeCanvas(w, h);
      overlay.remove();
    };
  }
}