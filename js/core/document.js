import { State } from './state.js';
import { History } from './history.js';

export class Document {
    constructor(canvasWidth = 32, canvasHeight = 32) {
        this.state = new State();
        this.history = new History(this.state);
        this.state.initCanvas(canvasWidth, canvasHeight);
        this.fileName = null;
        this.dirty = false;
        this.scrollX = 0;
        this.scrollY = 0;
        this.toolStates = {};
    }

    getTitle() {
        return this.fileName || 'Untitled';
    }

    saveToolStates(tools) {
        const s = {};
        const sel = tools.selector;
        s.selector = sel?.selection ? { ...sel.selection } : null;

        const ms = tools.magicSelect;
        s.magicSelect = ms?.selection ? {
            x1: ms.selection.x1, y1: ms.selection.y1,
            x2: ms.selection.x2, y2: ms.selection.y2,
            mask: ms.selection.mask?.slice()
        } : null;

        const es = tools.ellipseSelect;
        s.ellipseSelect = es?.selection ? { ...es.selection } : null;

        const ls = tools.lassoSelect;
        s.lassoSelect = ls?.selection ? {
            x1: ls.selection.x1, y1: ls.selection.y1,
            x2: ls.selection.x2, y2: ls.selection.y2,
            mask: ls.selection.mask?.slice()
        } : null;

        this.toolStates = s;
    }

    restoreToolStates(tools) {
        const s = this.toolStates;
        if (tools.selector) tools.selector.selection = s.selector || null;
        if (tools.magicSelect) tools.magicSelect.selection = s.magicSelect || null;
        if (tools.ellipseSelect) tools.ellipseSelect.selection = s.ellipseSelect || null;
        if (tools.lassoSelect) tools.lassoSelect.selection = s.lassoSelect || null;
    }

    hasContent() {
        const layers = this.state.get('layers');
        return layers.some(l => l.pixels.some(p => p !== 0));
    }
}
