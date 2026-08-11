// Button.jsx
import React, { useRef } from 'react';
import { IoHandLeftOutline } from "react-icons/io5";
import { RiBrush2Line, RiCircleLine, RiRectangleLine, RiTriangleLine, RiEraserLine } from "react-icons/ri";
import { GoDash } from "react-icons/go";
import { FiSave, FiImage } from "react-icons/fi";
import { LuDownload, LuMousePointer2 } from "react-icons/lu";
import { PiTextTBold } from "react-icons/pi";
import { HiArrowLongRight } from "react-icons/hi2";
import { MdOutlineRefresh, MdOutlineGridOn } from "react-icons/md";
import { TbMagnet, TbOval } from "react-icons/tb";
import Undoredo from './Clicks/Undoredo';
import { handleSave, exportPNG } from './Clicks/Save';
import ZoomNGrag from './Clicks/ZoomNGrag';

// Inline SVG for ellipse icon (fallback if TbOval not available)
const EllipseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <ellipse cx="12" cy="12" rx="10" ry="6" />
  </svg>
);

const ToolBtn = ({ id, icon, label, active, onClick, shortcut }) => (
  <div className="toolTipCov" title={shortcut ? `${label} (${shortcut})` : label}>
    <span
      id={id}
      className={active ? 'activeIcon' : 'selectIcon'}
      onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26 }}
    >
      {icon}
    </span>
    <p className="toolTip">{label}{shortcut ? ` · ${shortcut}` : ''}</p>
  </div>
);

const Divider = () => (
  <div style={{ width: 1, height: 18, background: '#e2e8f0', margin: '0 2px' }} />
);

const Buttons = ({
  zoom, setZoom, setPan,
  handleModeChange, elements, canvasRef,
  handleLoad, mode, undoStack, redoStack,
  setUndoStack, setRedoStack, setElements, setActiveElem,
  showGrid, setShowGrid,
  snapToGrid, setSnapToGrid,
  strokeWidth, setStrokeWidth,
}) => {
  const fileInputRef = useRef(null);

  const tools = [
    { id: 'btn-select',    icon: <LuMousePointer2 />,  label: 'Select',    mode: 'select',      shortcut: 'S' },
    { id: 'btn-grab',      icon: <IoHandLeftOutline />, label: 'Hand',      mode: 'grab',        shortcut: 'H' },
    { id: 'btn-eraser',    icon: <RiEraserLine />,      label: 'Eraser',    mode: 'eraser',      shortcut: 'E' },
  ];
  const shapes = [
    { id: 'btn-line',      icon: <GoDash />,            label: 'Line',      mode: 'line',        shortcut: 'L' },
    { id: 'btn-arrow',     icon: <HiArrowLongRight />,  label: 'Arrow',     mode: 'arrow',       shortcut: 'A' },
    { id: 'btn-rectangle', icon: <RiRectangleLine />,   label: 'Rectangle', mode: 'rectangle',   shortcut: 'R' },
    { id: 'btn-circle',    icon: <RiCircleLine />,      label: 'Circle',    mode: 'circle',      shortcut: 'C' },
    { id: 'btn-ellipse',   icon: <EllipseIcon />,       label: 'Ellipse',   mode: 'ellipse',     shortcut: 'O' },
    { id: 'btn-triangle',  icon: <RiTriangleLine />,    label: 'Triangle',  mode: 'triangle',    shortcut: '' },
    { id: 'btn-pencil',    icon: <RiBrush2Line />,      label: 'Pencil',    mode: 'paint_brush', shortcut: 'P' },
    { id: 'btn-text',      icon: <PiTextTBold />,       label: 'Text',      mode: 'text',        shortcut: 'T' },
  ];

  return (
    <>
      {/* ── Main toolbar ─────────────────────────────────────────── */}
      <div style={{
        position: 'fixed', top: 10, left: 20, zIndex: 20,
        display: 'flex', alignItems: 'center', gap: 4,
        padding: '5px 10px',
        background: '#ffffff',
        borderRadius: 10,
        boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
        border: '1px solid #e2e8f0',
      }}>

        {/* Selection tools */}
        {tools.map(t => (
          <ToolBtn key={t.id} {...t} active={mode === t.mode} onClick={() => handleModeChange(t.mode)} />
        ))}

        <Divider />

        {/* Shape tools */}
        {shapes.map(t => (
          <ToolBtn key={t.id} {...t} active={mode === t.mode} onClick={() => handleModeChange(t.mode)} />
        ))}

        <Divider />

        {/* Reset */}
        <div className="toolTipCov">
          <MdOutlineRefresh
            id="btn-reset"
            className="selectIcon"
            onClick={() => { setElements([]); setActiveElem([]); }}
          />
          <p className="toolTip">Clear canvas</p>
        </div>

        <Divider />

        {/* Grid toggle */}
        <div className="toolTipCov">
          <MdOutlineGridOn
            id="btn-grid"
            className={`selectIcon${showGrid ? ' toggleActive' : ''}`}
            style={{ color: showGrid ? '#6366f1' : undefined }}
            onClick={() => setShowGrid(g => !g)}
          />
          <p className="toolTip">{showGrid ? 'Hide grid' : 'Show grid'}</p>
        </div>

        {/* Snap toggle */}
        <div className="toolTipCov">
          <TbMagnet
            id="btn-snap"
            className={`selectIcon${snapToGrid ? ' toggleActive' : ''}`}
            style={{ color: snapToGrid ? '#6366f1' : undefined }}
            onClick={() => setSnapToGrid(s => !s)}
          />
          <p className="toolTip">{snapToGrid ? 'Snap: ON' : 'Snap: OFF'}</p>
        </div>

        <Divider />

        {/* Stroke width */}
        {[1, 2, 4, 8].map(w => (
          <div
            key={w}
            onClick={() => setStrokeWidth(w)}
            title={`Stroke ${w}px`}
            style={{
              width: 20, height: 20,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', borderRadius: 4,
              background: strokeWidth === w ? '#eef2ff' : 'transparent',
              border: strokeWidth === w ? '1px solid #c7d2fe' : '1px solid transparent',
            }}
          >
            <div style={{
              width: 12, height: w,
              background: strokeWidth === w ? '#6366f1' : '#94a3b8',
              borderRadius: 2,
            }} />
          </div>
        ))}

        <Divider />

        {/* Save JSON */}
        <div className="toolTipCov">
          <FiSave id="btn-save" className="selectIcon" onClick={() => handleSave({ elements })} />
          <p className="toolTip">Save JSON</p>
        </div>

        {/* Export PNG */}
        <div className="toolTipCov">
          <FiImage id="btn-export-png" className="selectIcon" onClick={() => exportPNG({ canvasRef })} />
          <p className="toolTip">Export PNG</p>
        </div>

        {/* Load */}
        <div className="toolTipCov">
          <LuDownload id="btn-load" className="selectIcon" onClick={() => fileInputRef.current.click()} />
          <p className="toolTip">Load JSON</p>
        </div>
        <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={handleLoad} />
      </div>

      {/* ── Undo / Redo ──────────────────────────────────────────── */}
      <ZoomNGrag zoom={zoom} setZoom={setZoom} setPan={setPan} />
      <Undoredo
        elements={elements}
        undoStack={undoStack}
        redoStack={redoStack}
        setUndoStack={setUndoStack}
        setRedoStack={setRedoStack}
        setElements={setElements}
        setActiveElem={setActiveElem}
      />
    </>
  );
};

export default Buttons;
