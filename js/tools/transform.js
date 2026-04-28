export class TransformTool {
    constructor(canvas, state, history) {
        this.canvas = canvas;
        this.state = state;
        this.history = history;
        this.isDragging = false;
        this.isResizing = false;
        this.startPos = null;
        this.layerStartPixels = null;
        this.isMovingSelection = false;
        this.selectionTool = null;
        this.selectedPixelsData = null;
        this.originalSelectionBounds = null;
        this.originalMask = null;
        this.pendingApproval = false;
    }

    activate() {
        this.canvas.element.style.cursor = 'move';
    }

    deactivate() {
        this.isDragging = false;
        this.isResizing = false;
        if (this.pendingApproval) {
            this.approveMove();
        }
    }

    approveMove() {
        if (this.pendingApproval && this.layerStartPixels) {
            const layer = this.canvas.state.get('layers')[this.canvas.state.get('activeLayer')];
            if (layer) {
                layer.pixels = new Uint8ClampedArray(this.layerStartPixels);
                layer.dirty = true;
            }
            this.history.endStroke();
        }
        this.pendingApproval = false;
        this.layerStartPixels = null;
        this.selectedPixelsData = null;
        this.canvas.render();
    }

    cancelMove() {
        if (this.layerStartPixels) {
            const layer = this.canvas.state.get('layers')[this.canvas.state.get('activeLayer')];
            if (layer) {
                layer.pixels = new Uint8ClampedArray(this.layerStartPixels);
                layer.dirty = true;
            }
            if (this.isMovingSelection && this.selectionTool) {
                if (this.originalSelectionBounds) {
                    this.selectionTool.selection.x1 = this.originalSelectionBounds.x1;
                    this.selectionTool.selection.y1 = this.originalSelectionBounds.y1;
                    this.selectionTool.selection.x2 = this.originalSelectionBounds.x2;
                    this.selectionTool.selection.y2 = this.originalSelectionBounds.y2;
                }
            }
        }
        this.pendingApproval = false;
        this.layerStartPixels = null;
        this.selectedPixelsData = null;
        this.canvas.render();
    }

    onMouseDown(pos) {
        const layer = this.canvas.state.get('layers')[this.canvas.state.get('activeLayer')];
        if (!layer) return;

        this.isDragging = true;
        this.startPos = pos;
        this.pendingApproval = true;

        const selector = window.app?.tools?.selector;
        const magicSelect = window.app?.tools?.magicSelect;
        const ellipseSelect = window.app?.tools?.ellipseSelect;

        if (selector?.selection || magicSelect?.selection || ellipseSelect?.selection) {
            this.isMovingSelection = true;
            this.selectionTool = selector?.selection ? selector : magicSelect?.selection ? magicSelect : ellipseSelect;
            this.selectedPixelsData = this.selectionTool.getSelectedPixels();
            this.layerStartPixels = new Uint8ClampedArray(layer.pixels);

            this.originalSelectionBounds = {
                x1: this.selectionTool.selection.x1,
                y1: this.selectionTool.selection.y1,
                x2: this.selectionTool.selection.x2,
                y2: this.selectionTool.selection.y2
            };

            if (this.selectionTool.selection?.mask) {
                this.originalMask = new Uint8Array(this.selectionTool.selection.mask);
            } else {
                this.originalMask = null;
            }

            this.history.beginStroke();
            return;
        }

        this.isMovingSelection = false;
        this.layerStartPixels = new Uint8ClampedArray(layer.pixels);
        this.history.beginStroke();
    }

    onMouseMove(pos) {
        if (!this.isDragging || !pos || !this.startPos) return;

        const dx = pos.x - this.startPos.x;
        const dy = pos.y - this.startPos.y;

        if (Math.abs(dx) > 0 || Math.abs(dy) > 0) {
            const layer = this.canvas.state.get('layers')[this.canvas.state.get('activeLayer')];
            const width = this.canvas.width;
            const height = this.canvas.height;

            if (this.isMovingSelection && this.selectedPixelsData && this.selectionTool) {
                layer.pixels = new Uint8ClampedArray(this.layerStartPixels);

                // Clear ONLY the pixels that were actually selected (respecting the mask if it exists)
                if (this.originalSelectionBounds) {
                    const { x1, y1, x2, y2 } = this.originalSelectionBounds;
                    for (let y = y1; y <= y2; y++) {
                        for (let x = x1; x <= x2; x++) {
                            if (x >= 0 && x < width && y >= 0 && y < height) {
                                // If there's a mask, only clear pixels within the mask
                                if (!this.originalMask || this.originalMask[y * width + x]) {
                                    const idx = (y * width + x) * 4;
                                    layer.pixels[idx] = 0;
                                    layer.pixels[idx + 1] = 0;
                                    layer.pixels[idx + 2] = 0;
                                    layer.pixels[idx + 3] = 0;
                                }
                            }
                        }
                    }
                }

                const { pixels: selPixels, x: selX, y: selY, width: selW, height: selH } = this.selectedPixelsData;
                const newX = Math.round(selX + dx);
                const newY = Math.round(selY + dy);

                // Draw the moved pixels
                for (let y = 0; y < selH; y++) {
                    for (let x = 0; x < selW; x++) {
                        const srcIdx = (y * selW + x) * 4;
                        // Only draw if the pixel in the selection data is actually opaque
                        if (selPixels[srcIdx + 3] > 0) {
                            const destX = newX + x;
                            const destY = newY + y;
                            if (destX >= 0 && destX < width && destY >= 0 && destY < height) {
                                const dstIdx = (destY * width + destX) * 4;
                                layer.pixels[dstIdx] = selPixels[srcIdx];
                                layer.pixels[dstIdx+1] = selPixels[srcIdx+1];
                                layer.pixels[dstIdx+2] = selPixels[srcIdx+2];
                                layer.pixels[dstIdx+3] = selPixels[srcIdx+3];
                            }
                        }
                    }
                }

                // Update the selection tool's coordinates
                this.selectionTool.selection.x1 = newX;
                this.selectionTool.selection.x2 = newX + selW - 1;
                this.selectionTool.selection.y1 = newY;
                this.selectionTool.selection.y2 = newY + selH - 1;

                // If there's a mask (Magic Select), update its position too
                if (this.selectionTool.selection.mask && this.originalMask) {
                    const newMask = new Uint8Array(width * height);
                    for (let y = 0; y < height; y++) {
                        for (let x = 0; x < width; x++) {
                            if (this.originalMask[y * width + x]) {
                                const nmX = x + Math.round(dx);
                                const nmY = y + Math.round(dy);
                                if (nmX >= 0 && nmX < width && nmY >= 0 && nmY < height) {
                                    newMask[nmY * width + nmX] = 1;
                                }
                            }
                        }
                    }
                    this.selectionTool.selection.mask = newMask;
                }
            } else {
                layer.pixels.fill(0);

                for (let y = 0; y < height; y++) {
                    for (let x = 0; x < width; x++) {
                        const srcX = x - dx;
                        const srcY = y - dy;
                        if (srcX >= 0 && srcX < width && srcY >= 0 && srcY < height) {
                            const srcIdx = (srcY * width + srcX) * 4;
                            const dstIdx = (y * width + x) * 4;
                            layer.pixels[dstIdx] = this.layerStartPixels[srcIdx];
                            layer.pixels[dstIdx+1] = this.layerStartPixels[srcIdx+1];
                            layer.pixels[dstIdx+2] = this.layerStartPixels[srcIdx+2];
                            layer.pixels[dstIdx+3] = this.layerStartPixels[srcIdx+3];
                        }
                    }
                }
            }

            layer.dirty = true;
            layer.scaledCanvas = null;
            this.canvas.render();
        }
    }

    onMouseUp() {
        if (this.isDragging) {
            this.isDragging = false;
            this.startPos = null;
            if (this.isMovingSelection) {
                this.selectedPixelsData = this.selectionTool?.getSelectedPixels();
            } else {
                this.layerStartPixels = null;
            }
            this.history.endStroke();
        }
    }

    scaleLayer(scaleX, scaleY) {
        this.history.beginStroke();

        const oldWidth = this.canvas.width;
        const oldHeight = this.canvas.height;
        const newWidth = Math.round(oldWidth * scaleX);
        const newHeight = Math.round(oldHeight * scaleY);
        
        const layers = this.canvas.state.get('layers');
        
        layers.forEach(layer => {
            const newPixels = new Uint8ClampedArray(newWidth * newHeight * 4);
            for (let y = 0; y < newHeight; y++) {
                for (let x = 0; x < newWidth; x++) {
                    const srcX = Math.floor(x / scaleX);
                    const srcY = Math.floor(y / scaleY);
                    if (srcX >= 0 && srcX < oldWidth && srcY >= 0 && srcY < oldHeight) {
                        const srcIdx = (srcY * oldWidth + srcX) * 4;
                        const dstIdx = (y * newWidth + x) * 4;
                        newPixels[dstIdx] = layer.pixels[srcIdx];
                        newPixels[dstIdx+1] = layer.pixels[srcIdx+1];
                        newPixels[dstIdx+2] = layer.pixels[srcIdx+2];
                        newPixels[dstIdx+3] = layer.pixels[srcIdx+3];
                    }
                }
            }
            layer.pixels = newPixels;
            layer.dirty = true;
            layer.scaledCanvas = null;
            
            // Re-create offscreen canvas if size changed
            if (layer.offscreen && (layer.offscreen.width !== newWidth || layer.offscreen.height !== newHeight)) {
                layer.offscreen = new OffscreenCanvas(newWidth, newHeight);
                layer.offscreenCtx = layer.offscreen.getContext('2d');
            }
        });

        // Update canvas and state dimensions
        this.canvas.canvasWidth = newWidth;
        this.canvas.canvasHeight = newHeight;
        this.state.set('canvasWidth', newWidth);
        this.state.set('canvasHeight', newHeight);
        
        this.canvas.applyZoomTransform();
        this.canvas.centerCanvas();
        this.canvas.updateCachedRect();
        this.canvas.render();
        
        this.history.endStroke();
    }

    rotateLayer(degrees) {
        this.history.beginStroke();

        const oldWidth = this.canvas.width;
        const oldHeight = this.canvas.height;
        const rad = degrees * Math.PI / 180;
        const cos = Math.abs(Math.round(Math.cos(rad)));
        const sin = Math.abs(Math.round(Math.sin(rad)));

        // New dimensions (handles 90/180/270 correctly)
        const newWidth = Math.round(oldWidth * cos + oldHeight * sin);
        const newHeight = Math.round(oldWidth * sin + oldHeight * cos);
        
        const layers = this.canvas.state.get('layers');
        
        layers.forEach(layer => {
            const newPixels = new Uint8ClampedArray(newWidth * newHeight * 4);
            const cx = oldWidth / 2;
            const cy = oldHeight / 2;
            const ncx = newWidth / 2;
            const ncy = newHeight / 2;

            const angle = degrees * Math.PI / 180;
            const c = Math.cos(angle);
            const s = Math.sin(angle);

            for (let y = 0; y < newHeight; y++) {
                for (let x = 0; x < newWidth; x++) {
                    const srcX = Math.round((x - ncx) * c + (y - ncy) * s + cx);
                    const srcY = Math.round((y - ncy) * c - (x - ncx) * s + cy);
                    if (srcX >= 0 && srcX < oldWidth && srcY >= 0 && srcY < oldHeight) {
                        const srcIdx = (srcY * oldWidth + srcX) * 4;
                        const dstIdx = (y * newWidth + x) * 4;
                        newPixels[dstIdx] = layer.pixels[srcIdx];
                        newPixels[dstIdx+1] = layer.pixels[srcIdx+1];
                        newPixels[dstIdx+2] = layer.pixels[srcIdx+2];
                        newPixels[dstIdx+3] = layer.pixels[srcIdx+3];
                    }
                }
            }
            layer.pixels = newPixels;
            layer.dirty = true;
            layer.scaledCanvas = null;
            
            if (layer.offscreen && (layer.offscreen.width !== newWidth || layer.offscreen.height !== newHeight)) {
                layer.offscreen = new OffscreenCanvas(newWidth, newHeight);
                layer.offscreenCtx = layer.offscreen.getContext('2d');
            }
        });

        this.canvas.canvasWidth = newWidth;
        this.canvas.canvasHeight = newHeight;
        this.state.set('canvasWidth', newWidth);
        this.state.set('canvasHeight', newHeight);
        
        this.canvas.applyZoomTransform();
        this.canvas.centerCanvas();
        this.canvas.updateCachedRect();
        this.canvas.render();
        
        this.history.endStroke();
    }

    cropLayer(x1, y1, x2, y2) {
        this.history.beginStroke();

        const oldWidth = this.canvas.width;
        const minX = Math.max(0, Math.min(x1, x2));
        const maxX = Math.min(oldWidth - 1, Math.max(x1, x2));
        const minY = Math.max(0, Math.min(y1, y2));
        const maxY = Math.min(this.canvas.height - 1, Math.max(y1, y2));
        const newWidth = maxX - minX + 1;
        const newHeight = maxY - minY + 1;
        
        const layers = this.canvas.state.get('layers');
        
        layers.forEach(layer => {
            const newPixels = new Uint8ClampedArray(newWidth * newHeight * 4);
            for (let y = 0; y < newHeight; y++) {
                for (let x = 0; x < newWidth; x++) {
                    const srcIdx = ((y + minY) * oldWidth + (x + minX)) * 4;
                    const dstIdx = (y * newWidth + x) * 4;
                    newPixels[dstIdx] = layer.pixels[srcIdx];
                    newPixels[dstIdx+1] = layer.pixels[srcIdx+1];
                    newPixels[dstIdx+2] = layer.pixels[srcIdx+2];
                    newPixels[dstIdx+3] = layer.pixels[srcIdx+3];
                }
            }
            layer.pixels = newPixels;
            layer.dirty = true;
            layer.scaledCanvas = null;
            
            if (layer.offscreen && (layer.offscreen.width !== newWidth || layer.offscreen.height !== newHeight)) {
                layer.offscreen = new OffscreenCanvas(newWidth, newHeight);
                layer.offscreenCtx = layer.offscreen.getContext('2d');
            }
        });

        this.canvas.canvasWidth = newWidth;
        this.canvas.canvasHeight = newHeight;
        this.state.set('canvasWidth', newWidth);
        this.state.set('canvasHeight', newHeight);
        
        this.canvas.applyZoomTransform();
        this.canvas.centerCanvas();
        this.canvas.updateCachedRect();
        this.canvas.render();
        
        this.history.endStroke();
    }

    cropToSelection() {
        const sel = window.app?.getActiveSelection();
        if (!sel) return;
        
        let x1, y1, x2, y2;
        if (sel.mask) {
            x1 = sel.x1;
            y1 = sel.y1;
            x2 = sel.x2;
            y2 = sel.y2;
        } else {
            x1 = sel.x1;
            y1 = sel.y1;
            x2 = sel.x2;
            y2 = sel.y2;
        }
        
        this.cropLayer(x1, y1, x2, y2);
        window.app?.deselectAll();
    }
}
