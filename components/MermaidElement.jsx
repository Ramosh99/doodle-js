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
  { label: 'Sequence', code: 'sequenceDiagram\n  autonumber\n  actor User\n  participant Client\n  participant Server\n  participant DB\n  User->>Client: Click Login\n  Client->>Server: POST /auth/login\n  Server->>DB: Query User\n  DB-->>Server: User Data\n  Server-->>Client: JWT Token\n  Client-->>User: Show Dashboard' },
  { label: 'ER Diagram', code: 'erDiagram\n  USER ||--o{ ORDER : places\n  ORDER ||--|{ ORDER_ITEM : contains\n  PRODUCT ||--o{ ORDER_ITEM : ordered_in\n  USER {\n    string id PK\n    string name\n    string email\n  }\n  ORDER {\n    string id PK\n    string userId FK\n    float total\n  }' },
  { label: 'State', code: 'stateDiagram-v2\n  [*] --> Idle\n  Idle --> Processing: Submit\n  Processing --> Success: Verified\n  Processing --> Failed: Invalid\n  Failed --> Idle: Retry\n  Success --> [*]' },
  { label: 'Mindmap', code: 'mindmap\n  root((Project Roadmap))\n    Design\n      Wireframes\n      Design System\n    Frontend\n      Next.js\n      Canvas Engine\n    Backend\n      API Routes\n      Gemini AI\n    DevOps\n      CI/CD\n      Monitoring' },
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
  const [svgContent, setSvgContent] = useState('');
  const [renderError, setRenderError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draftCode, setDraftCode] = useState(element.code || '');
  const [modalPreviewSvg, setModalPreviewSvg] = useState('');
  const [modalError, setModalError] = useState(null);
  const lastRenderIdRef = useRef(null);

  const cx1 = typeof element.x1 === 'number' ? element.x1 : (element.x || 0);
  const cy1 = typeof element.y1 === 'number' ? element.y1 : (element.y || 0);
  const cx2 = typeof element.x2 === 'number' ? element.x2 : cx1 + 520;
  const cy2 = typeof element.y2 === 'number' ? element.y2 : cy1 + 360;

  const left   = Math.min(cx1, cx2) * zoom + pan.x * zoom - ZoomOffset.x;
  const top    = Math.min(cy1, cy2) * zoom + pan.y * zoom - ZoomOffset.y;
  const width  = Math.max(160, Math.abs(cx2 - cx1) * zoom);
  const height = Math.max(100, Math.abs(cy2 - cy1) * zoom);

  // Initialize and render SVG
  const renderSvg = useCallback(async (code) => {
    if (!code || !code.trim()) {
      setSvgContent('');
      return;
    }

    if (lastRenderIdRef.current) {
      cleanupTempNodes(lastRenderIdRef.current);
    }
    const renderId = getRenderId();
    lastRenderIdRef.current = renderId;

    try {
      mermaid.initialize({
        startOnLoad: false,
        theme: 'default',
        securityLevel: 'loose',
        fontFamily: 'Georgia, serif',
        flowchart: { useMaxWidth: false, htmlLabels: true, curve: 'basis' },
        sequence: { useMaxWidth: false, actorMargin: 50 },
        er: { useMaxWidth: false },
        mindmap: { useMaxWidth: false },
      });

      const { svg } = await mermaid.render(renderId, code.trim());
      setSvgContent(svg);
      setRenderError(null);
    } catch (err) {
      cleanupTempNodes(renderId);
      const msg = (err?.message || String(err)).replace(/^Error:\s*/i, '').split('\n').slice(0, 4).join('\n');
      setRenderError(msg);
    }
  }, []);

  // Update canvas SVG whenever element.code changes
  useEffect(() => {
    renderSvg(element.code || '');
  }, [element.code, renderSvg]);

  // Modal live preview renderer
  useEffect(() => {
    if (!isModalOpen) return;
    const t = setTimeout(async () => {
      if (!draftCode.trim()) {
        setModalPreviewSvg('');
        setModalError(null);
        return;
      }
      const previewId = getRenderId();
      try {
        mermaid.initialize({
          startOnLoad: false,
          theme: 'default',
          securityLevel: 'loose',
          fontFamily: 'Georgia, serif',
        });
        const { svg } = await mermaid.render(previewId, draftCode.trim());
        setModalPreviewSvg(svg);
        setModalError(null);
      } catch (err) {
        cleanupTempNodes(previewId);
        setModalError((err?.message || String(err)).replace(/^Error:\s*/i, ''));
      }
    }, 300);
    return () => clearTimeout(t);
  }, [draftCode, isModalOpen]);

  const handleOpenModal = (e) => {
    if (e) e.stopPropagation();
    setDraftCode(element.code || '');
    setIsModalOpen(true);
  };

  const handleSaveModal = () => {
    if (onUpdateCode) {
      onUpdateCode(draftCode);
    }
    setIsModalOpen(false);
  };

  return (
    <>
      {/* ── Canvas Node ────────────────────────────────────────── */}
      <div
        onDoubleClick={handleOpenModal}
        style={{
          position: 'absolute',
          left: `${left}px`,
          top: `${top}px`,
          width: `${width}px`,
          height: `${height}px`,
          boxSizing: 'border-box',
          border: isSelected ? '2px solid #6366f1' : '1px solid #cbd5e1',
          borderRadius: '8px',
          background: 'rgba(255, 255, 255, 0.96)',
          boxShadow: isSelected ? '0 0 0 3px rgba(99, 102, 241, 0.2), 0 4px 16px rgba(0,0,0,0.06)' : '0 2px 8px rgba(0,0,0,0.04)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          zIndex: isSelected ? 40 : 15,
          cursor: isSelected ? 'move' : 'pointer',
          userSelect: 'none',
          fontFamily: 'Georgia, serif',
          fontWeight: 'normal',
        }}
      >
        {/* Node Toolbar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '4px 10px',
            background: isSelected ? '#f1f5f9' : '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            fontSize: '11px',
            color: '#475569',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 13 }}>📊</span>
            <span>Mermaid Diagram</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              onClick={handleOpenModal}
              title="Edit Mermaid Code"
              style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '4px',
                padding: '2px 8px',
                fontSize: '11px',
                cursor: 'pointer',
                color: '#334155',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <span>✎</span> Edit
            </button>
            {isSelected && onDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                title="Delete Diagram"
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '12px',
                  cursor: 'pointer',
                  color: '#94a3b8',
                }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Diagram SVG Viewport */}
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px',
            position: 'relative',
          }}
        >
          {renderError ? (
            <div style={{ color: '#ef4444', fontSize: '11px', padding: 8, textAlign: 'center' }}>
              <div>⚠️ Syntax Error</div>
              <button
                onClick={handleOpenModal}
                style={{
                  marginTop: 6,
                  padding: '3px 8px',
                  background: '#fee2e2',
                  border: '1px solid #fca5a5',
                  borderRadius: 4,
                  fontSize: 10,
                  cursor: 'pointer',
                  color: '#b91c1c',
                }}
              >
                Click to fix Mermaid code
              </button>
            </div>
          ) : svgContent ? (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
              }}
              dangerouslySetInnerHTML={{ __html: svgContent }}
            />
          ) : (
            <div style={{ color: '#94a3b8', fontSize: '12px' }}>Double-click to add Mermaid code</div>
          )}
        </div>
      </div>

      {/* ── Live Editable Modal / Drawer ────────────────────────── */}
      {isModalOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '24px',
            fontFamily: 'Georgia, serif',
            fontWeight: 'normal',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '960px',
              height: '85vh',
              maxHeight: '780px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              border: '1px solid #e2e8f0',
              overflow: 'hidden',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#fafafa',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18 }}>📊</span>
                <span style={{ fontSize: 16, color: '#1e293b' }}>Edit Mermaid Diagram</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    padding: '6px 14px',
                    fontSize: '13px',
                    cursor: 'pointer',
                    color: '#475569',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveModal}
                  style={{
                    background: '#1a1a1a',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 16px',
                    fontSize: '13px',
                    cursor: 'pointer',
                    color: '#ffffff',
                  }}
                >
                  Apply & Save
                </button>
              </div>
            </div>

            {/* Presets Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 20px',
                background: '#f8fafc',
                borderBottom: '1px solid #f1f5f9',
                overflowX: 'auto',
              }}
            >
              <span style={{ fontSize: 12, color: '#64748b', marginRight: 4 }}>Templates:</span>
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => setDraftCode(p.code)}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '16px',
                    padding: '3px 12px',
                    fontSize: '11.5px',
                    cursor: 'pointer',
                    color: '#334155',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Modal Body: Editor + Live Preview */}
            <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
              {/* Left Column: Code Editor */}
              <div
                style={{
                  flex: 1,
                  borderRight: '1px solid #e2e8f0',
                  display: 'flex',
                  flexDirection: 'column',
                  background: '#ffffff',
                }}
              >
                <div
                  style={{
                    padding: '8px 16px',
                    fontSize: '11px',
                    color: '#64748b',
                    borderBottom: '1px solid #f1f5f9',
                    background: '#fafafa',
                  }}
                >
                  Mermaid Source Code:
                </div>
                <textarea
                  value={draftCode}
                  onChange={(e) => setDraftCode(e.target.value)}
                  placeholder="Enter Mermaid syntax..."
                  style={{
                    flex: 1,
                    padding: '14px 16px',
                    fontSize: '13px',
                    fontFamily: 'Consolas, "Courier New", monospace',
                    border: 'none',
                    outline: 'none',
                    resize: 'none',
                    lineHeight: '1.55',
                    color: '#0f172a',
                    background: '#ffffff',
                  }}
                />
                {modalError && (
                  <div
                    style={{
                      padding: '10px 16px',
                      background: '#fff5f5',
                      borderTop: '1px solid #fed7d7',
                      color: '#dc2626',
                      fontSize: '11.5px',
                      maxHeight: '80px',
                      overflowY: 'auto',
                    }}
                  >
                    ⚠️ {modalError}
                  </div>
                )}
              </div>

              {/* Right Column: Live SVG Preview */}
              <div
                style={{
                  flex: 1.2,
                  display: 'flex',
                  flexDirection: 'column',
                  background: '#f8fafc',
                }}
              >
                <div
                  style={{
                    padding: '8px 16px',
                    fontSize: '11px',
                    color: '#64748b',
                    borderBottom: '1px solid #e2e8f0',
                    background: '#fafafa',
                  }}
                >
                  Live Preview:
                </div>
                <div
                  style={{
                    flex: 1,
                    overflow: 'auto',
                    padding: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {modalPreviewSvg ? (
                    <div
                      dangerouslySetInnerHTML={{ __html: modalPreviewSvg }}
                      style={{ maxWidth: '100%', maxHeight: '100%' }}
                    />
                  ) : (
                    <div style={{ color: '#94a3b8', fontSize: '13px' }}>
                      {modalError ? 'Fix syntax error to see preview' : 'No diagram code entered'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
