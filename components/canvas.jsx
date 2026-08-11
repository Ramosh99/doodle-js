'use client';
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import rough from 'roughjs/bundled/rough.esm';
import Buttons from './ButtonComponents/Button';
import Selectors from './selctors';
import Shapes, { createElement, drawElement } from './ButtonComponents/Clicks/Shapes';
import { selectTheShapeMove, selectTheShapeMouseDown, selectTheShapeMouseUp, isMouseInShape } from './ButtonComponents/Clicks/Move';
import Color from './ButtonComponents/Color';
import Delete from './ButtonComponents/Clicks/Delete';
import CutCopyPaste from './ButtonComponents/Clicks/CutCopyPaste';
import { ElementType } from './Types/types';
import { AddText } from './ButtonComponents/Clicks/Write';
import Text from './Text';
import MermaidElement from './MermaidElement';
import AISidebar from './AISidebar';
import ContextMenu from './ContextMenu';

const AUTOSAVE_KEY = 'doodle-autosave';

// ── Helpers ───────────────────────────────────────────────────────────────────
const snapVal = (v, grid = 20) => Math.round(v / grid) * grid;

// Restore a saved paint_brush element from plain JSON
const restoreBrush = (el) => ({
  type: ElementType.PAINT_BRUSH,
  points: el.points || [],
  x1: el.x1, y1: el.y1, x2: el.x2, y2: el.y2,
  color: el.color || '#000000',
});

// Calculate bounding box for any element
const getElementBounds = (el) => {
  if (el.type === ElementType.PAINT_BRUSH) {
    if (!el.points || el.points.length === 0) return { minX: el.x1 || 0, minY: el.y1 || 0, maxX: el.x2 || 0, maxY: el.y2 || 0 };
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    el.points.forEach(p => {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    });
    return { minX, minY, maxX, maxY };
  }
  if (el.type === ElementType.CIRCLE) {
    const r = Math.hypot((el.x2 || 0) - (el.x1 || 0), (el.y2 || 0) - (el.y1 || 0));
    return { minX: el.x1 - r, minY: el.y1 - r, maxX: el.x1 + r, maxY: el.y1 + r };
  }
  const x1 = typeof el.x1 === 'number' ? el.x1 : (el.x || 0);
  const y1 = typeof el.y1 === 'number' ? el.y1 : (el.y || 0);
  const x2 = typeof el.x2 === 'number' ? el.x2 : x1 + 160;
  const y2 = typeof el.y2 === 'number' ? el.y2 : y1 + 64;
  return {
    minX: Math.min(x1, x2),
    minY: Math.min(y1, y2),
    maxX: Math.max(x1, x2),
    maxY: Math.max(y1, y2),
  };
};

// Check if an element overlaps with a selection box
const isElementInBox = (el, box) => {
  const b = getElementBounds(el);
  const bMinX = Math.min(box.x1, box.x2);
  const bMaxX = Math.max(box.x1, box.x2);
  const bMinY = Math.min(box.y1, box.y2);
  const bMaxY = Math.max(box.y1, box.y2);
  return !(b.maxX < bMinX || b.minX > bMaxX || b.maxY < bMinY || b.minY > bMaxY);
};

// Move any element type by (dx, dy)
const moveElement = (el, dx, dy) => {
  if (el.type === ElementType.PAINT_BRUSH) {
    return {
      ...el,
      x1: (el.x1 || 0) + dx,
      y1: (el.y1 || 0) + dy,
      x2: (el.x2 || 0) + dx,
      y2: (el.y2 || 0) + dy,
      points: (el.points || []).map(p => ({ x: p.x + dx, y: p.y + dy })),
    };
  }
  if (el.type === ElementType.TEXT || el.type === ElementType.MERMAID || el.type === 'mermaid') {
    return {
      ...el,
      x1: el.x1 + dx,
      y1: el.y1 + dy,
      x2: el.x2 + dx,
      y2: el.y2 + dy,
    };
  }
  const fill   = el.roughElement?.options?.fill;
  const stroke = el.roughElement?.options?.stroke || '#1e293b';
  const sw     = el.roughElement?.options?.strokeWidth || 2;
  const newX1 = el.x1 + dx;
  const newY1 = el.y1 + dy;
  const newX2 = el.x2 + dx;
  const newY2 = el.y2 + dy;

  const creator = createElement[el.type];
  if (creator) {
    return creator(newX1, newY1, newX2, newY2, fill, stroke, sw);
  }
  return { ...el, x1: newX1, y1: newY1, x2: newX2, y2: newY2 };
};

const Canvas = () => {

  const [elements, setElements] = useState([]);
  const [isClient, setIsClient] = useState(false);

  // ── Auto-load (Client only to avoid hydration mismatch) ─────────────────────
  useEffect(() => {
    setIsClient(true);
    try {
      const saved = localStorage.getItem(AUTOSAVE_KEY);
      if (saved) setElements(JSON.parse(saved));
    } catch {}
  }, []);
  const [activeElem, setActiveElem] = useState([]);
  const [drawing, setDrawing] = useState(false);
  const [panning, setPanning] = useState(false);
  const [isRightPanning, setIsRightPanning] = useState(false);
  const rightPanMoved = useRef(false);
  const [selectionBox, setSelectionBox] = useState(null); // { x1, y1, x2, y2 }
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [ZoomOffset, setZoomOffset] = useState({ x: 0, y: 0 });
  const [mode, setMode] = useState('select');
  const canvasRef = useRef(null);

  // ── Undo / redo / clipboard ────────────────────────────────────────────────
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [clipboard, setClipboard] = useState([]);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // ── Selection / drag / resize ──────────────────────────────────────────────
  const [starx, setStarx] = useState(null);
  const [stary, setStary] = useState(null);
  const [currentSelectedIndex, setCurrentSelectedIndex] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizingPoint, setResizingPoint] = useState('');
  const [editingIndex, setEditingIndex] = useState(null);

  // ── Color / style ──────────────────────────────────────────────────────────
  const [activeColor, setActiveColor] = useState('');
  const [activeStrokeColor, setActiveStrokeColor] = useState('black');
  const [strokeWidth, setStrokeWidth] = useState(2);

  // ── Multi-select ───────────────────────────────────────────────────────────
  const [isCtrlPressed, setIsCtrlPressed] = useState(false);

  // ── UI toggles ─────────────────────────────────────────────────────────────
  const [showGrid, setShowGrid] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [contextMenu, setContextMenu] = useState(null); // { x, y }
  const [toast, setToast] = useState(null); // string message
  const toastTimer = useRef(null);

  // ── Dimensions ────────────────────────────────────────────────────────────
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // ── Toast helper ──────────────────────────────────────────────────────────
  const showToast = useCallback((msg) => {
    setToast(null);
    clearTimeout(toastTimer.current);
    setTimeout(() => {
      setToast(msg);
      toastTimer.current = setTimeout(() => setToast(null), 2000);
    }, 10);
  }, []);

  // ── Resize observer ────────────────────────────────────────────────────────
  useEffect(() => {
    setDimensions({ width: window.innerWidth, height: window.innerHeight });
    const handleResize = () => setDimensions({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ── Ctrl key tracking ─────────────────────────────────────────────────────
  useEffect(() => {
    const down = (e) => { if (e.key === 'Control' || e.key === 'Shift') setIsCtrlPressed(true); };
    const up   = (e) => { if (e.key === 'Control' || e.key === 'Shift') setIsCtrlPressed(false); };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  // ── Global mouseup cleanup ────────────────────────────────────────────────
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsRightPanning(false);
      setDrawing(false);
      setPanning(false);
      setIsDragging(false);
      setSelectionBox(null);
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  // ── Auto-save ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (elements.length === 0) return;
    const t = setTimeout(() => {
      try { localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(elements)); } catch {}
    }, 800);
    return () => clearTimeout(t);
  }, [elements]);

  // ── Canvas render ─────────────────────────────────────────────────────────
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const scaledWidth  = canvas.width  * zoom;
    const scaledHeight = canvas.height * zoom;
    const scaleOffsetX = (scaledWidth  - canvas.width)  / 2;
    const scaleOffsetY = (scaledHeight - canvas.height) / 2;
    setZoomOffset({ x: scaleOffsetX, y: scaleOffsetY });
    ctx.setTransform(zoom, 0, 0, zoom, pan.x * zoom - scaleOffsetX, pan.y * zoom - scaleOffsetY);
    const roughCanvas = rough.canvas(canvas);
    elements.forEach(el => drawElement(roughCanvas, el, ctx));
  }, [elements, pan, zoom]);

  // ── Coordinate helpers ────────────────────────────────────────────────────
  const toCanvas = (clientX, clientY) => ({
    x: (clientX - pan.x * zoom + ZoomOffset.x) / zoom,
    y: (clientY - pan.y * zoom + ZoomOffset.y) / zoom,
  });

  const snap = (v) => snapToGrid ? snapVal(v) : v;

  // ── Delete helper (shared by keyboard + context menu) ─────────────────────
  const deleteActive = useCallback(() => {
    if (activeElem.length === 0) return;
    setUndoStack(prev => [...prev, elements]);
    setRedoStack([]);
    setElements(prev => prev.filter(el => !activeElem.includes(el)));
    setActiveElem([]);
  }, [activeElem, elements]);

  // ── Duplicate helper ──────────────────────────────────────────────────────
  const duplicateActive = useCallback(() => {
    if (activeElem.length === 0) return;
    setUndoStack(prev => [...prev, elements]);
    setRedoStack([]);
    const copies = activeElem.map(el => {
      if (el.type === ElementType.PAINT_BRUSH) {
        return { ...el, points: el.points.map(p => ({ x: p.x + 20, y: p.y + 20 })) };
      }
      if (el.type === ElementType.MERMAID || el.type === 'mermaid') {
        return {
          ...el,
          id: `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          x1: el.x1 + 20,
          y1: el.y1 + 20,
          x2: el.x2 + 20,
          y2: el.y2 + 20,
        };
      }
      const fill   = el.roughElement?.options?.fill;
      const stroke = el.roughElement?.options?.stroke || 'black';
      const sw     = el.roughElement?.options?.strokeWidth || 2;
      const copy   = createElement[el.type]
        ? createElement[el.type](el.x1 + 20, el.y1 + 20, el.x2 + 20, el.y2 + 20, fill, stroke, sw)
        : { ...el };
      if (el.type === ElementType.TEXT) copy.text = el.text;
      return copy;
    });
    setElements(prev => [...prev, ...copies]);
    setActiveElem(copies);
    showToast('Duplicated');
  }, [activeElem, elements, showToast]);

  // ── Bring to front / send to back ─────────────────────────────────────────
  const bringToFront = useCallback(() => {
    if (activeElem.length === 0) return;
    const rest  = elements.filter(el => !activeElem.includes(el));
    setElements([...rest, ...activeElem]);
  }, [activeElem, elements]);

  const sendToBack = useCallback(() => {
    if (activeElem.length === 0) return;
    const rest = elements.filter(el => !activeElem.includes(el));
    setElements([...activeElem, ...rest]);
  }, [activeElem, elements]);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const handleKey = (e) => {
      // Ignore when typing in a text field
      if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;
      const ctrl = e.ctrlKey || e.metaKey;

      // Ctrl+A — select all
      if (ctrl && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setActiveElem([...elements]);
        return;
      }
      // Ctrl+D — duplicate
      if (ctrl && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        duplicateActive();
        return;
      }

      // Delete / Backspace — delete selected (only outside text-editing)
      if ((e.key === 'Delete' || e.key === 'Backspace') && editingIndex === null) {
        deleteActive();
        return;
      }

      // Tool shortcuts (no modifier)
      if (!ctrl) {
        const map = { s:'select', h:'grab', e:'eraser', r:'rectangle', c:'circle', o:'ellipse', l:'line', a:'arrow', t:'text', p:'paint_brush' };
        if (map[e.key.toLowerCase()]) setMode(map[e.key.toLowerCase()]);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [elements, activeElem, editingIndex, deleteActive, duplicateActive]);

  // ── Mouse handlers ────────────────────────────────────────────────────────
  const handleMouseDown = (e) => {
    // Right-click or middle-click → Start pan
    if (e.button === 2 || e.button === 1) {
      e.preventDefault();
      setIsRightPanning(true);
      rightPanMoved.current = false;
      return;
    }

    const { x, y } = toCanvas(e.clientX, e.clientY);
    const sx = snap(x), sy = snap(y);
    setMousePosition({ x: sx, y: sy });

    if (mode === 'grab') { setPanning(true); return; }

    if (mode === 'eraser') {
      setDrawing(true);
      const index = elements.findLastIndex(el => isMouseInShape(parseInt(sx), parseInt(sy), el));
      if (index !== -1) {
        setUndoStack(prev => [...prev, elements]);
        setRedoStack([]);
        setElements(prev => prev.filter((_, i) => i !== index));
      }
      return;
    }

    if (mode === 'select') {
      // Check if clicking on resize point
      if (resizingPoint) {
        setIsResizing(true);
        setIsDragging(false);
        setStarx(sx);
        setStary(sy);
        setUndoStack(prev => [...prev, elements]);
        setRedoStack([]);
        return;
      }

      const clickedIndex = elements.findLastIndex(el => isMouseInShape(parseInt(sx), parseInt(sy), el));
      if (clickedIndex !== -1) {
        const clickedEl = elements[clickedIndex];
        setCurrentSelectedIndex(clickedIndex);
        setStarx(sx);
        setStary(sy);
        setIsDragging(true);
        setUndoStack(prev => [...prev, elements]);
        setRedoStack([]);

        if (activeElem.includes(clickedEl)) {
          // Already in selection, ready for group drag
        } else {
          if (isCtrlPressed) {
            setActiveElem(prev => [...prev, clickedEl]);
          } else {
            setActiveElem([clickedEl]);
          }
        }
        return;
      }

      // Clicked on empty canvas → start marquee selection box
      if (!isCtrlPressed) {
        setActiveElem([]);
      }
      setSelectionBox({ x1: sx, y1: sy, x2: sx, y2: sy });
      setStarx(sx);
      setStary(sy);
      return;
    }

    setUndoStack(prev => [...prev, elements]);
    setRedoStack([]);
    setDrawing(true);
    const el = createElement[mode]?.(sx, sy, sx, sy, activeColor, activeStrokeColor, strokeWidth);
    if (el) setElements(prev => [...prev, el]);
  };

  const handleMouseMove = (e) => {
    // Pan with right-click or grab mode
    if (isRightPanning || panning) {
      if (Math.abs(e.movementX) > 0 || Math.abs(e.movementY) > 0) {
        rightPanMoved.current = true;
      }
      setPan(prev => ({ x: prev.x + e.movementX, y: prev.y + e.movementY }));
      return;
    }

    const { x, y } = toCanvas(e.clientX, e.clientY);
    const sx = snap(x), sy = snap(y);

    // Marquee selection box dragging
    if (selectionBox) {
      const currentBox = { ...selectionBox, x2: sx, y2: sy };
      setSelectionBox(currentBox);
      const matched = elements.filter(el => isElementInBox(el, currentBox));
      setActiveElem(matched);
      return;
    }

    if (mode === 'select') {
      if (isDragging && activeElem.length > 0) {
        const dx = sx - starx;
        const dy = sy - stary;
        if (dx !== 0 || dy !== 0) {
          const movedActive = [];
          const updatedElements = elements.map(el => {
            if (activeElem.includes(el)) {
              const moved = moveElement(el, dx, dy);
              movedActive.push(moved);
              return moved;
            }
            return el;
          });
          setElements(updatedElements);
          setActiveElem(movedActive);
          setStarx(sx);
          setStary(sy);
        }
        return;
      }

      if (isResizing && currentSelectedIndex !== null) {
        selectTheShapeMove(
          parseInt(sx), parseInt(sy), isDragging, starx, stary,
          currentSelectedIndex, elements, setActiveElem, setElements,
          setStarx, setStary, setUndoStack, setRedoStack,
          resizingPoint, isResizing, setIsResizing, activeColor, activeStrokeColor
        );
        return;
      }
      return;
    }

    if (mode === 'eraser' && drawing) {
      const index = elements.findLastIndex(el => isMouseInShape(parseInt(sx), parseInt(sy), el));
      if (index !== -1) {
        setElements(prev => prev.filter((_, i) => i !== index));
      }
      return;
    }

    if (!drawing) return;

    const index = elements.length - 1;
    const { x1, y1 } = elements[index];
    const updated = createElement[mode]?.(x1, y1, sx, sy, activeColor, activeStrokeColor, strokeWidth);
    if (!updated) return;
    const copy = [...elements];
    if (mode === 'paint_brush') {
      copy[index].points = [...copy[index].points, { x: sx, y: sy }];
      copy[index].color  = copy[index].color || activeColor || '#000000';
    } else {
      copy[index] = updated;
    }
    setElements(copy);
  };

  const handleMouseUp = () => {
    setIsRightPanning(false);
    setDrawing(false);
    setPanning(false);
    setIsDragging(false);
    setSelectionBox(null);
    setIsResizing(false);

    if (mode === 'select') {
      selectTheShapeMouseUp(isDragging, setIsDragging, setUndoStack, elements, isResizing, setIsResizing, activeColor, activeStrokeColor);
    }
    // Normalise rectangle coords
    const el = elements[elements.length - 1];
    if (el?.type === 'rectangle') {
      if (el.x2 < el.x1) { const t = el.x1; el.x1 = el.x2; el.x2 = t; }
      if (el.y2 < el.y1) { const t = el.y1; el.y1 = el.y2; el.y2 = t; }
    }
    if (mode === 'text') {
      setEditingIndex(elements.length - 1);
      setMode('select');
    }
  };

  const handleDoubleClick = (e) => {
    if (mode !== 'select') return;
    const { x, y } = toCanvas(e.clientX, e.clientY);
    const idx = elements.findIndex(el => el.type === 'text' && x >= el.x1 && x <= el.x2 && y >= el.y1 && y <= el.y2);
    if (idx !== -1) setEditingIndex(idx);
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    if (rightPanMoved.current) {
      rightPanMoved.current = false;
      return;
    }
    if (activeElem.length > 0) setContextMenu({ x: e.clientX, y: e.clientY });
  };

  // ── Wheel zoom (toward cursor) ────────────────────────────────────────────
  const handleWheel = (e) => {
    e.preventDefault();
    const factor  = e.deltaY < 0 ? 1.1 : 0.9;
    const newZoom = Math.min(Math.max(zoom * factor, 0.1), 10);
    const { x: mx, y: my } = toCanvas(e.clientX, e.clientY);
    setZoom(newZoom);
    setPan({
      x: e.clientX / newZoom - mx + ZoomOffset.x / newZoom,
      y: e.clientY / newZoom - my + ZoomOffset.y / newZoom,
    });
  };

  // ── Mode change ───────────────────────────────────────────────────────────
  const handleModeChange = (newMode) => setMode(newMode);

  // ── File load ─────────────────────────────────────────────────────────────
  const handleLoad = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const loaded = JSON.parse(e.target.result);
      const restored = loaded.map(el => {
        const { type, x1, y1, x2, y2, roughElement, points, text, color } = el;
        if (type === ElementType.PAINT_BRUSH) return restoreBrush(el);
        if (type === ElementType.TEXT) return { type: ElementType.TEXT, x1, y1, x2, y2, text };
        const fill   = roughElement?.options?.fill;
        const stroke = roughElement?.options?.stroke || 'black';
        const sw     = roughElement?.options?.strokeWidth || 2;
        return createElement[type]?.(x1, y1, x2, y2, fill, stroke, sw) ?? null;
      }).filter(Boolean);
      setElements(restored);
    };
    reader.readAsText(file);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      className={showGrid ? 'canvas-grid' : ''}
      style={{ overflow: 'hidden', width: '100vw', height: '100vh', position: 'relative', background: showGrid ? undefined : '#ffffff' }}
      onClick={() => setContextMenu(null)}
    >
      <Buttons
        handleModeChange={handleModeChange}
        handleLoad={handleLoad}
        mode={mode}
        canvasRef={canvasRef}
        setElements={setElements}
        undoStack={undoStack}
        redoStack={redoStack}
        setUndoStack={setUndoStack}
        setRedoStack={setRedoStack}
        elements={elements}
        setActiveElem={setActiveElem}
        zoom={zoom}
        setZoom={setZoom}
        setPan={setPan}
        showGrid={showGrid}
        setShowGrid={setShowGrid}
        snapToGrid={snapToGrid}
        setSnapToGrid={setSnapToGrid}
        strokeWidth={strokeWidth}
        setStrokeWidth={setStrokeWidth}
      />

      <AISidebar setElements={setElements} setActiveElem={setActiveElem} />

      <Color
        currentSelectedIndex={currentSelectedIndex}
        elements={elements}
        setElements={setElements}
        activeElem={activeElem}
        setActiveElem={setActiveElem}
        activeColor={activeColor}
        setActiveColor={setActiveColor}
        activeStrokeColor={activeStrokeColor}
        setActiveStrokeColor={setActiveStrokeColor}
      />

      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onDoubleClick={handleDoubleClick}
        onWheel={handleWheel}
        onContextMenu={handleContextMenu}
        width={dimensions.width}
        height={dimensions.height}
        style={{
          position: 'fixed',
          cursor: isRightPanning ? 'grabbing' :
                  mode === 'grab' ? (panning ? 'grabbing' : 'grab') :
                  mode === 'select' ? (isDragging ? 'move' : selectionBox ? 'crosshair' : 'default') :
                  mode === 'eraser' ? 'cell' :
                  mode === 'paint_brush' ? "url('data:image/x-icon;base64,AAACAAEAICAQAAIAAwDoAgAAFgAAACgAAAAgAAAAQAAAAAEABAAAAAAAAAIAAAAAAAAAAAAAEAAAAAAAAAAAAAAAxJ0AALiTAACefgAAq4kAANuvAADougAAGqsAAJF0AADPpQAAAJ4FAA7PAAAAxc8A/8wAAACRBQCrCwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACDQAAAAAAAAAAAAAAAAAAINCEAAAAAAAAAAAAAAAAAg0IJAAAAAAAAAAAAAAAACDQgBQAAAAAAAAAAAAAAAINCDAYAAAAAAAAAAAAAAAg0IMBtAAAAAAAAAAAAAACDQgwG0AAAAAAAAAAAAAAINCAAbQAAAAAAAAAAAAAAg0IJVtAAAAAAAAAAAAAACDQgkG0AAAAAAAAAAAAAAINCCQDQAAAAAAAAAAAAAA6nALAAAAAAAAAAAAAAAADqcAsAAAAAAAAAAAAAAAAOpwCwAAAAAAAAAAAAAAAA6nALAAAAAAAAAAAAAAAADqcAsAAAAAAAAAAAAAAAAIpwCwAAAAAAAAAAAAAAAAg3ALAAAAAAAAAAAAAAAACDQAsAAAAAAAAAAAAAAAAINACwAAAAAAAAAAAAAAAAg0ALAAAAAAAAAAAAAAAACDQgkAAAAAAAAAAAAAAAAANCCQAAAAAAAAAAAAAAAAA0IZAAAAAAAAAAAAAAAAAAQgAAAAAAAAAAAAAAAAAADwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//////////////4////8H///+A////AP///gD///wA///4AP//8AH//+AD///AB///gA///wAf//4Bv//8A///+Af///AP///gH///wD///4B///8A///+Af///AP///gH///4D///8B////A////h////5///////////////w=='), auto" :
                  'crosshair',
        }}
      />

      {/* Marquee Group Selection Box */}
      {selectionBox && (
        <div
          style={{
            position: 'fixed',
            left: `${Math.min(
              selectionBox.x1 * zoom + pan.x * zoom - ZoomOffset.x,
              selectionBox.x2 * zoom + pan.x * zoom - ZoomOffset.x
            )}px`,
            top: `${Math.min(
              selectionBox.y1 * zoom + pan.y * zoom - ZoomOffset.y,
              selectionBox.y2 * zoom + pan.y * zoom - ZoomOffset.y
            )}px`,
            width: `${Math.abs((selectionBox.x2 - selectionBox.x1) * zoom)}px`,
            height: `${Math.abs((selectionBox.y2 - selectionBox.y1) * zoom)}px`,
            border: '1.5px dashed #3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.08)',
            pointerEvents: 'none',
            zIndex: 450,
            borderRadius: '2px',
          }}
        />
      )}

      {/* Selection handles */}
      {activeElem.length > 0 && mode === 'select' &&
        activeElem.map((el, i) => (
          <Selectors
            key={i}
            pan={pan} zoom={zoom}
            isResizing={isResizing} mode={mode} setMode={setMode}
            setIsDragging={setIsDragging} setIsResizing={setIsResizing}
            resizingPoint={resizingPoint} setResizingPoint={setResizingPoint}
            activeElem={activeElem} shape={el} ZoomOffset={ZoomOffset}
          />
        ))
      }

      <Shapes elements={elements} handleModeChange={handleModeChange} />

      <Delete
        elements={elements} setElements={setElements}
        activeElem={activeElem} setActiveElem={setActiveElem}
        setUndoStack={setUndoStack} setRedoStack={setRedoStack}
      />

      <CutCopyPaste
        elements={elements} setElements={setElements}
        activeElem={activeElem} setActiveElem={setActiveElem}
        setRedoStack={setRedoStack} setUndoStack={setUndoStack}
        clipboard={clipboard} setClipboard={setClipboard}
        canvasRef={canvasRef} zoom={zoom} pan={pan}
        mousePosition={mousePosition}
      />

      {/* Text elements overlay */}
      {isClient && elements.map((el, ind) => {
        if (el.type !== 'text') return null;
        return (
          <Text
            key={el.id || ind}
            prop={el}
            isEditing={editingIndex === ind}
            zoom={zoom}
            pan={pan}
            ZoomOffset={ZoomOffset}
            onChange={(newText) => {
              const copy = [...elements];
              copy[ind] = { ...copy[ind], text: newText };
              setElements(copy);
            }}
            onFinishEditing={() => {
              setEditingIndex(null);
              if (!elements[ind]?.text?.trim()) {
                setElements(elements.filter((_, i) => i !== ind));
                setActiveElem([]);
              }
            }}
          />
        );
      })}

      {/* Mermaid elements overlay */}
      {isClient && elements.map((el, ind) => {
        if (el.type !== 'mermaid' && el.type !== ElementType.MERMAID) return null;
        const isSelected = activeElem.some(a => a.id === el.id || (a.x1 === el.x1 && a.y1 === el.y1));
        return (
          <MermaidElement
            key={el.id || ind}
            element={el}
            isSelected={isSelected}
            zoom={zoom}
            pan={pan}
            ZoomOffset={ZoomOffset}
            onUpdateCode={(newCode) => {
              setUndoStack(prev => [...prev, elements]);
              setRedoStack([]);
              setElements(prev =>
                prev.map((item, i) =>
                  i === ind || item.id === el.id
                    ? { ...item, code: newCode }
                    : item
                )
              );
              showToast('Diagram updated');
            }}
            onDelete={() => {
              setUndoStack(prev => [...prev, elements]);
              setRedoStack([]);
              setElements(prev => prev.filter((item, i) => i !== ind && item.id !== el.id));
              setActiveElem([]);
              showToast('Diagram deleted');
            }}
          />
        );
      })}

      {/* Right-click context menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x} y={contextMenu.y}
          hasSelection={activeElem.length > 0}
          onClose={() => setContextMenu(null)}
          onDuplicate={duplicateActive}
          onDelete={deleteActive}
          onBringToFront={bringToFront}
          onSendToBack={sendToBack}
        />
      )}

      {/* Toast notification */}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
};

export default Canvas;
