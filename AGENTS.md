# AGENTS.md — Pixora (Prity)

## Quick Facts
- **No build step**: Open `index.html` directly in a browser. Vanilla JS, ES modules, zero dependencies.
- **No package.json, no npm**: No test runner, linter, or formatter configured.
- **Entry point**: `js/app.js` (loaded via `<script type="module">` in `index.html:31`)

## Architecture
```
js/
├── app.js              # App class: wires everything together, keyboard shortcuts
├── core/
│   ├── state.js        # Central State class (get/set + listeners)
│   ├── canvas.js       # CanvasEngine: zoom, rendering, drawing dispatch
│   └── history.js      # Undo/redo stacks (stores snapshots with canvasWidth/Height)
├── tools/              # One class per tool, keyed by name in App.tools
│   ├── pencil.js       # Uses state.brushSize (1-31, odd numbers only)
│   ├── eraser.js       # Uses state.brushSize
│   ├── magic-select.js # Uses state.magicWandTolerance (0-255)
│   └── ...
├── ui/                 # UI panels, keyed by name in App (e.g., app.toolbar)
└── io/                 # Export/import (PNG, JPG, GIF)
```

## State Conventions
- **brushSize**: Must be odd (1, 3, 5, 7, ..., 31). Toolbar auto-corrects even inputs to odd.
- **magicWandTolerance**: 0-255, stored in state (not on tool object). Changed via `[`/`]` when magic wand active.
- **zoom**: `state.zoom` must stay in sync with `canvas.zoom`/`canvas.zoomIndex`. Canvas zoom levels: `[1,2,4,6,8,10,12,16,20,24,32,48,64]` (index 5 = 10x).
- **recentColors**: Max 15 entries. Filter-then-unshift-then-slice pattern in `state.addRecentColor()`.

## History Snapshots
- Snapshots store `{ canvasWidth, canvasHeight, layers: [...] }`.
- `restoreSnapshot()` sets canvasWidth/Height from snapshot, not current state — avoids ImageData size mismatch.
- Max 30 entries (`maxHistory`).

## Keyboard Shortcuts (in app.js)
- `[` / `]` : Decrease/increase brush size (or magicWandTolerance if magic wand active)
- Tool keys: `B` pencil, `E` eraser, `G` fill, `M` select, `W` magic select, `O` ellipse, `V` move, `T` text
- `Ctrl+Z` / `Ctrl+Y` : Undo / Redo

## Gotchas
- **No `utils/` directory** despite TODO.md mentioning it. Utilities are inline or in core.
- **OffscreenCanvas** used for layer rendering (not main canvas).
- **Retro font** (Press Start 2P) toggle stored in `localStorage('prity-retro-font')`, not in state.
- **Brush size input** accepts even numbers but corrects to odd on input event.
- **Magic wand tolerance** uses number input (not slider) in toolbar, consistent with brush size pattern.
