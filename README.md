# Pixora - Pixel Art Editor

A lightweight, browser-based pixel art editor built with vanilla JavaScript and Canvas API. No dependencies, fully static - perfect for GitHub Pages.

## Features

### Drawing Tools
- **Pencil (B)** - Draw with configurable brush size (1-8px), change with [ ] or scroll wheel on tool
- **Eraser (E)** - Erase pixels with same brush size
- **Fill/Bucket (G)** - Flood fill connected areas
- **Selector (M)** - Select rectangular regions, cut/copy/paste
- **Magic Select (W)** - Select contiguous areas by color with tolerance control
- **Ellipse Select (O)** - Create elliptical selection areas
- **Move (V)** - Move layers, scale (50%/200%), rotate (90°/180°), crop to selection
- **Text (T)** - Add text to layers, editable after placement

### Layer System
- Multiple layer support with drag & drop reordering
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
- Save/Export as PNG with transparency
- Background removal tool

### View & Navigation
- Zoom: 1x, 2x, 4x, 6x, 8x, 10x, 12x, 16x, 20x, 24x, 32x, 48x, 64x
- Pan canvas with middle mouse button drag
- Toggle pixel grid
- Dark/light theme
- Retro font toggle (Press Start 2P) - saved in localStorage

### Keyboard Shortcuts
- `B` - Pencil | `E` - Eraser | `G` - Fill | `M` - Select | `W` - Magic Select | `O` - Ellipse Select | `V` - Move
- `Ctrl+S` - Save PNG | `Ctrl+O` - Open | `Ctrl+N` - New
- `Ctrl+Z` - Undo | `Ctrl+Y` - Redo | `Ctrl+A` - Select All
- `Ctrl+Scroll` - Zoom | `Middle Click Drag` - Pan
- `[` / `]` - Decrease/Increase brush size
- `Escape` - Deselect all selections

## Upcoming Features
- Text tool (add/edit text fields on layers)
- Resizable UI panels
- Brush size scroll wheel on toolbar hover
- Enhanced layer drag & drop

## Usage

Open `index.html` in any modern browser. No build step, no dependencies.

## License

MIT
