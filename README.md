# Pixora - Pixel Art Editor

https://blqnk3d.github.io/Pixora/

A lightweight, browser-based pixel art editor built with vanilla JavaScript and Canvas API. No dependencies, fully static - perfect for GitHub Pages.

## Features

### Multi-Document Tabs
- Open multiple images simultaneously with tabbed interface
- Create new documents (`Ctrl+N`), close tabs (`Ctrl+W`)
- Drag & drop images directly from your file manager to open in a new tab
- Each document keeps its own undo history, selection state, layers, zoom, and scroll position

### Drawing Tools
- **Pencil (B)** - Draw with configurable brush size (1-8px), change with [ ] or scroll wheel on tool
- **Eraser (E)** - Erase pixels with same brush size
- **Fill/Bucket (G)** - Flood fill connected areas
- **Brighten/Darken** - Brush-based brightness adjustment, Shift to darken
- **Selector (M)** - Select rectangular regions, cut/copy/paste
- **Magic Select (W)** - Select contiguous areas by color with tolerance control
- **Ellipse Select (O)** - Create elliptical selection areas
- **Lasso Select (L)** - Freehand selection tool
- **Move (V)** - Move selections, scale (50%/200%), rotate (90°/180°), crop to selection
- **Text (T)** - Add text to layers, editable after placement

### Layer System
- Multiple layer support with drag & drop reordering
- Multi-select layers (Ctrl+Click, Shift+Click)
- Layer visibility toggle, opacity control, naming
- Merge down, duplicate, delete layers
- Transform: move, scale, rotate, crop to selection

### Color Management
- HSL color picker (click to pick any color)
- RGB/HEX input with alpha channel
- 16 default palette colors
- Import palette from image (.png/.jpg) or .hex file
- Recent colors tracking

### File Operations
- New file with custom dimensions
- Open images (PNG, JPG, GIF) - drag & drop supported
- Custom .pixora project format (preserves layers)
- Save/Export as PNG with transparency
- Native file save picker (Chromium) with `<a download>` fallback
- Background removal tool

### View & Navigation
- Zoom: 1x, 2x, 4x, 6x, 8x, 10x, 12x, 16x, 20x, 24x, 32x, 48x, 64x
- Pan canvas with middle mouse button drag
- Toggle pixel grid
- Dark/light theme
- Retro font toggle (Press Start 2P) - saved in localStorage
- Auto-hide side panels

### Keyboard Shortcuts
- `B` - Pencil | `E` - Eraser | `I` - Eyedropper | `G` - Fill | `M` - Select | `W` - Magic Select | `O` - Ellipse Select | `L` - Lasso Select | `V` - Move | `T` - Text
- `Ctrl+S` - Save | `Ctrl+O` - Open | `Ctrl+N` - New Tab | `Ctrl+W` - Close Tab
- `Ctrl+Z` - Undo | `Ctrl+Y` / `Ctrl+Shift+Z` - Redo | `Ctrl+A` - Select All
- `Ctrl+C` - Copy | `Ctrl+X` - Cut | `Ctrl+V` - Paste
- `Ctrl+Scroll` - Zoom | `Middle Click Drag` - Pan
- `[` / `]` - Decrease/Increase brush size
- `Escape` - Deselect all selections
- `Delete` - Delete selection or selected layers
- `Enter` - Confirm move / delete selected layers

### PWA Support
- Installable as a standalone app (manifest.json)
- Offline support via service worker

## Usage

Open `index.html` in any modern browser. No build step, no dependencies.
