'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import mermaid from 'mermaid';

let renderCounter = 0;
function getRenderId() {
  renderCounter++;
  return `mermaid-cvs-${renderCounter}`;
}

function cleanupTempNodes(id) {
  ['', 'd'].forEach(prefix => {
    const el = document.getElementById(`${prefix}${id}`);
    if (el) el.remove();
  });
}

const PRESETS = [
  { label: 'Flowchart', code: 'graph TD\n  A[Start] --> B{Is Valid?}\n  B -->|Yes| C[Process Request]\n  B -->|No| D[Show Error]\n  C --> E[Complete]' },
  { label: 'Sequence', code: 'sequenceDiagram\n  autonumber\n  actor User\n  participant Client\n  participant Server\n  User->>Client: Click Login\n  Client->>Server: POST /auth/login\n  Server-->>Client: JWT Token\n  Client-->>User: Show Dashboard' },
  { label: 'ER Diagram', code: 'erDiagram\n  USER ||--o{ ORDER : places\n  ORDER ||--|{ ORDER_ITEM : contains\n  PRODUCT ||--o{ ORDER_ITEM : ordered_in' },
  { label: 'State', code: 'stateDiagram-v2\n  [*] --> Idle\n  Idle --> Processing: Submit\n  Processing --> Success: Verified\n  Processing --> Failed: Invalid\n  Failed --> Idle: Retry\n  Success --> [*]' },
  { label: 'Mindmap', code: 'mindmap\n  root((Project))\n    Design\n      Wireframes\n    Frontend\n      Next.js\n    Backend\n      API Routes' },
];

export default function MermaidElement({
  element,
  isSelected,
  zoom = 1,
  pan = { x: 0, y: 0 },
  ZoomOffset = { x: 0, y: 0 },
  onUpdateCode,
  onDelete,
}) {
  const [svgContent, setSvgContent]     = useState('');
  const [renderError, setRenderError]   = useState(null);
  const [isHovered, setIsHovered]       = useState(false);
  const [isEditing, setIsEditing]       = useState(false);
  const [draftCode, setDraftCode]       = useState(element.code || '');
  const [previewSvg, setPreviewSvg]     = useState('');
  const [previewError, setPreviewError] = useState(null);
  const lastRenderIdRef = useRef(null);

  const cx1 = typeof element.x1 === 'number' ? element.x1 : (element.x || 0);
  const cy1 = typeof element.y1 === 'number' ? element.y1 : (element.y || 0);
  const cx2 = typeof element.x2 === 'number' ? element.x2 : cx1 + 520;
  const cy2 = typeof element.y2 === 'number' ? element.y2 : cy1 + 360;

  const left   = Math.min(cx1, cx2) * zoom + pan.x * zoom - ZoomOffset.x;
  const top    = Math.min(cy1, cy2) * zoom + pan.y * zoom - ZoomOffset.y;
  const width  = Math.max(160, Math.abs(cx2 - cx1) * zoom);
  const height = Math.max(100, Math.abs(cy2 - cy1) * zoom);

  // Drawer: prefer right side, flip left if not enough room
  const DRAWER_W   = 340;
  const DRAWER_GAP = 12;
  const spaceRight = (typeof window !== 'undefined' ? window.innerWidth : 1200) - (left + width) - DRAWER_GAP;
  const drawerLeft = spaceRight >= DRAWER_W ? left + width + DRAWER_GAP : left - DRAWER_W - DRAWER_GAP;
  const drawerTop  = top;
  const drawerH    = Math.max(height, 340);

  // Render SVG for the canvas node
  const renderSvg = useCallback(async (code) => {
    if (!code?.trim()) { setSvgContent(''); return; }
    if (lastRenderIdRef.current) cleanupTempNodes(lastRenderIdRef.current);
    const id = getRenderId();
    lastRenderIdRef.current = id;
    try {
      mermaid.initialize({
        startOnLoad: false, theme: 'default', securityLevel: 'loose',
        fontFamily: 'Georgia, serif',
        flowchart: { useMaxWidth: false, htmlLabels: true, curve: 'basis' },
        sequence: { useMaxWidth: false, actorMargin: 50 },
        er: { useMaxWidth: false }, mindmap: { useMaxWidth: false },
      });
      const { svg } = await mermaid.render(id, code.trim());
      setSvgContent(svg);
      setRenderError(null);
    } catch (err) {
      cleanupTempNodes(id);
      setRenderError((err?.message || String(err)).replace(/^Error:\s*/i, '').split('\n')[0]);
    }
  }, []);

  useEffect(() => { renderSvg(element.code || ''); }, [element.code, renderSvg]);

  // Live preview in drawer
  useEffect(() => {
    if (!isEditing) return;
    const t = setTimeout(async () => {
      if (!draftCode.trim()) { setPreviewSvg(''); setPreviewError(null); return; }
      const id = getRenderId();
      try {
        mermaid.initialize({ startOnLoad: false, theme: 'default', securityLevel: 'loose' });
        const { svg } = await mermaid.render(id, draftCode.trim());
        setPreviewSvg(svg);
        setPreviewError(null);
      } catch (err) {
        cleanupTempNodes(id);
        setPreviewError((err?.message || String(err)).replace(/^Error:\s*/i, '').split('\n')[0]);
        setPreviewSvg('');
      }
    }, 300);
    return () => clearTimeout(t);
  }, [draftCode, isEditing]);

  const openEditor = (e) => {
    if (e) e.stopPropagation();
    setDraftCode(element.code || '');
    setPreviewSvg('');
    setPreviewError(null);
    setIsEditing(true);
  };

  const handleSave = () => {
    if (onUpdateCode) onUpdateCode(draftCode);
    setIsEditing(false);
  };

  const showControls = isSelected || isHovered;

  return (
    <>
      <style>{`
        @keyframes mDrawerIn {
          from { opacity:0; transform:translateX(${spaceRight >= DRAWER_W ? '-10px' : '10px'}) scale(0.97); }
          to   { opacity:1; transform:translateX(0) scale(1); }
        }
        .mermaid-node svg { max-width:100% !important; max-height:100% !important; }
      `}</style>

      {/* ── Canvas Node: transparent, no chrome ─────────────────── */}
      <div
        className="mermaid-node"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onDoubleClick={openEditor}
        style={{
          position: 'absolute',
          left: `${left}px`, top: `${top}px`,
          width: `${width}px`, height: `${height}px`,
          boxSizing: 'border-box',
          // Only show a border when selected or hovered — otherwise invisible
          border: isEditing
            ? '2px solid #6366f1'
            : isSelected
              ? '2px dashed #6366f1'
              : isHovered
                ? '1.5px dashed #a5b4fc'
                : '1px dashed transparent',
          borderRadius: '4px',
          background: 'transparent',
          overflow: 'visible',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: isSelected ? 40 : 15,
          cursor: isSelected ? 'move' : 'default',
          userSelect: 'none',
          transition: 'border-color 0.15s',
        }}
      >
        {/* SVG content — rendered directly, no wrapper card */}
        {renderError ? (
          <div style={{
            color: '#ef4444', fontSize: 11, textAlign: 'center',
            background: 'rgba(255,241,241,0.9)', borderRadius: 6,
            padding: '6px 10px', border: '1px solid #fca5a5',
          }}>
            ⚠️ {renderError}
          </div>
        ) : svgContent ? (
          <div
            dangerouslySetInnerHTML={{ __html: svgContent }}
            style={{
              width: '100%', height: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              pointerEvents: 'none',
            }}
          />
        ) : (
          <div style={{
            color: '#94a3b8', fontSize: 12,
            background: 'rgba(248,250,252,0.85)',
            border: '1px dashed #cbd5e1',
            borderRadius: 6, padding: '10px 16px',
          }}>
            Double-click to add a Mermaid diagram
          </div>
        )}

        {/* Floating controls — only visible on hover/select */}
        {showControls && (
          <div
            style={{
              position: 'absolute',
              top: -30,
              right: 0,
              display: 'flex',
              gap: 5,
              zIndex: 50,
            }}
            onClick={e => e.stopPropagation()}
            onMouseDown={e => e.stopPropagation()}
          >
            <button
              onClick={openEditor}
              style={{
                background: isEditing ? '#6366f1' : '#1e293b',
                color: '#fff',
                border: 'none',
                borderRadius: 5,
                padding: '3px 10px',
                fontSize: 11,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
                display: 'flex', alignItems: 'center', gap: 4,
              }}
            >
              ✎ Edit
            </button>
            {onDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                style={{
                  background: '#ef4444', color: '#fff',
                  border: 'none', borderRadius: 5,
                  padding: '3px 8px', fontSize: 11,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
                }}
              >✕</button>
            )}
          </div>
        )}
      </div>

      {/* ── Inline Edit Drawer ───────────────────────────────────── */}
      {isEditing && (
        <div
          onClick={e => e.stopPropagation()}
          onMouseDown={e => e.stopPropagation()}
          style={{
            position: 'fixed',
            left: `${drawerLeft}px`, top: `${drawerTop}px`,
            width: `${DRAWER_W}px`, height: `${drawerH}px`,
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 10,
            boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
            display: 'flex', flexDirection: 'column',
            zIndex: 500,
            fontFamily: 'Georgia, serif',
            overflow: 'hidden',
            animation: 'mDrawerIn 0.18s cubic-bezier(0.4,0,0.2,1)',
          }}
        >
          {/* Drawer Header */}
          <div style={{
            padding: '10px 14px', borderBottom: '1px solid #f1f5f9',
            background: '#fafafa',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexShrink: 0,
          }}>
            <span style={{ fontSize: 13, color: '#1e293b' }}>📊 Edit Diagram</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={() => setIsEditing(false)}
                style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer', color: '#475569' }}
              >Cancel</button>
              <button
                onClick={handleSave}
                style={{ background: '#6366f1', border: 'none', borderRadius: 6, padding: '4px 12px', fontSize: 12, cursor: 'pointer', color: '#fff' }}
              >Apply</button>
            </div>
          </div>

          {/* Presets */}
          <div style={{
            display: 'flex', gap: 5, padding: '7px 12px',
            borderBottom: '1px solid #f1f5f9',
            overflowX: 'auto', background: '#fafbfc', flexShrink: 0,
          }}>
            {PRESETS.map(p => (
              <button
                key={p.label}
                onClick={() => setDraftCode(p.code)}
                style={{
                  background: '#fff', border: '1px solid #e2e8f0',
                  borderRadius: 12, padding: '2px 9px',
                  fontSize: 11, cursor: 'pointer', color: '#475569',
                  whiteSpace: 'nowrap', flexShrink: 0,
                }}
              >{p.label}</button>
            ))}
          </div>

          {/* Code textarea */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div style={{ padding: '4px 12px', fontSize: 10, color: '#94a3b8', background: '#fafafa', borderBottom: '1px solid #f1f5f9', flexShrink: 0 }}>
              Mermaid syntax
            </div>
            <textarea
              value={draftCode}
              onChange={e => setDraftCode(e.target.value)}
              placeholder="Enter Mermaid syntax…"
              style={{
                flex: 1, padding: '10px 12px',
                fontSize: 12, fontFamily: 'Consolas, "Courier New", monospace',
                border: 'none', outline: 'none', resize: 'none',
                lineHeight: 1.6, color: '#0f172a', background: '#fff',
              }}
            />
          </div>

          {/* Live mini-preview */}
          <div style={{
            borderTop: '1px solid #f1f5f9', background: '#f8fafc',
            flexShrink: 0, maxHeight: 110, overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '8px',
          }}>
            {previewError ? (
              <div style={{ color: '#ef4444', fontSize: 10 }}>⚠️ {previewError}</div>
            ) : previewSvg ? (
              <div
                dangerouslySetInnerHTML={{ __html: previewSvg }}
                style={{ maxWidth: '100%', maxHeight: '100px', overflow: 'hidden' }}
              />
            ) : (
              <div style={{ color: '#cbd5e1', fontSize: 11 }}>Live preview…</div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
