# Pixel Art Editor - TODO

## Architecture & Tech Stack
- [ ] Decide on framework: Vanilla JS + Canvas API (lightweight, no dependencies)
- [ ] Modular architecture with clear separation:
  - `core/` - Canvas engine, state management
  - `tools/` - Drawing tools (pencil, eraser, fill, etc.)
  - `ui/` - Panels, toolbars, modals
  - `io/` - File import/export, clipboard
  - `utils/` - Color math, grid helpers, history

## Core Features

### Canvas & Drawing
- [ ] Canvas grid system with configurable pixel size
- [ ] Primary drawing tool (pencil) with color selection
- [ ] Eraser tool
- [ ] Fill/bucket tool (flood fill algorithm)
- [ ] Color picker tool (eyedropper)
- [ ] Line tool
- [ ] Rectangle/circle tools
- [ ] Undo/redo system (command pattern, history stack)

### Color Management
- [ ] Color picker panel (RGB/HEX input)
- [ ] Preset palette with common pixel art colors
- [ ] Custom palette support (add/remove colors)
- [ ] Recent colors tracking
- [ ] Transparency support (alpha channel)

### Layer System
- [ ] Multiple layer support
- [ ] Layer visibility toggle
- [ ] Layer opacity control
- [ ] Layer reordering (drag & drop)
- [ ] Layer naming
- [ ] Merge down / flatten layers
- [ ] Duplicate layer

### Background Editing
- [ ] Background removal tool
- [ ] Background color/transparency toggle
- [ ] Magic wand selection for background areas
- [ ] Selective background eraser
- [ ] Export with/without background options

### File Operations
- [ ] New file (custom dimensions dialog)
- [ ] Open image files (PNG, JPG, GIF)
- [ ] Save/Export as PNG (with transparency)
- [ ] Save/Export as GIF
- [ ] Auto-save to localStorage
- [ ] Import palette from image
- [ ] Copy/paste support (clipboard API)

### UI & Layout
- [ ] Main canvas area (centered, with checkerboard bg for transparency)
- [ ] Left toolbar (drawing tools)
- [ ] Right panel (color picker, layers, properties)
- [ ] Top menu bar (file, edit, view, help)
- [ ] Status bar (coordinates, zoom level, file info)
- [ ] Resizable panels
- [ ] Dark/light theme support

### View Controls
- [ ] Zoom in/out (with shortcuts)
- [ ] Pan canvas (middle-click or space+drag)
- [ ] Grid toggle (show/hide pixel grid)
- [ ] Fit to screen / actual size
- [ ] Mini-map / navigation overview

### Selection & Transformation
- [ ] Rectangular selection tool
- [ ] Move selected pixels
- [ ] Copy/cut/paste selection
- [ ] Scale selection (nearest neighbor)
- [ ] Rotate selection (90°, 180°, custom)
- [ ] Flip horizontal/vertical

### Optimization
- [ ] Canvas offscreen rendering for performance
- [ ] Debounce expensive operations (save, export)
- [ ] Lazy loading for large images
- [ ] Web Worker for heavy computations (flood fill, filters)
- [ ] Efficient undo/redo (store diffs, not full images)
- [ ] Throttle mouse events during drawing

### Keyboard Shortcuts
- [ ] Drawing tools shortcuts (B=brush, E=eraser, G=fill, etc.)
- [ ] File operations (Ctrl+S, Ctrl+O, Ctrl+N)
- [ ] Edit operations (Ctrl+Z, Ctrl+Y, Ctrl+A)
- [ ] View shortcuts (Zoom, grid toggle)
- [ ] Customizable shortcut mapping

### Settings & Preferences
- [ ] Default canvas size
- [ ] Default palette
- [ ] Autosave interval
- [ ] Grid color/size
- [ ] UI layout persistence

## Implementation Order
1. [ ] Project structure setup (HTML, CSS, JS files)
2. [ ] Canvas engine (grid rendering, pixel manipulation)
3. [ ] Basic drawing (pencil tool)
4. [ ] Color picker
5. [ ] File save/load (PNG export/import)
6. [ ] Undo/redo system
7. [ ] Additional tools (eraser, fill)
8. [ ] Layer system
9. [ ] Background editing features
10. [ ] UI polish & layout
11. [ ] Optimization pass
12. [ ] Testing & bug fixes

## Files to Create
```
/index.html          - Main entry point
/css/
  /style.css         - Main styles
  /themes.css        - Theme variables
/js/
  /app.js            - Application entry
  /core/
    /canvas.js       - Canvas rendering engine
    /state.js        - Application state management
    /history.js      - Undo/redo system
  /tools/
    /pencil.js       - Pencil tool
    /eraser.js       - Eraser tool
    /fill.js         - Fill/bucket tool
    /selector.js     - Selection tool
  /ui/
    /toolbar.js      - Tool panel
    /colorpicker.js  - Color picker panel
    /layers.js       - Layer panel
    /menu.js         - Top menu bar
  /io/
    /exporter.js     - PNG/GIF export
    /importer.js     - Image file import
    /clipboard.js    - Clipboard operations
  /utils/
    /color.js        - Color conversion utilities
    /grid.js         - Grid math helpers
    /storage.js      - localStorage wrapper
```
