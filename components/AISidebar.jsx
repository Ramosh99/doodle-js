'use client';
import React, { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import dagre from 'dagre';
import { createElement } from './ButtonComponents/Clicks/Shapes';
import { ElementType } from './Types/types';

const MermaidRenderer = dynamic(() => import('./Mermaid'), { ssr: false });

// ── Diagram configs ───────────────────────────────────────────────────────────
const MERMAID_TYPES = [
  { id: 'flowchart', label: 'Flowchart',  hint: 'User login and registration flow' },
  { id: 'sequence',  label: 'Sequence',   hint: 'API call between client and server' },
  { id: 'er',        label: 'ER Diagram', hint: 'E-commerce database schema' },
  { id: 'class',     label: 'Class',      hint: 'Animal class hierarchy' },
  { id: 'mindmap',   label: 'Mindmap',    hint: 'Machine learning concepts' },
  { id: 'state',     label: 'State',      hint: 'Order processing states' },
];

const CANVAS_TYPES = [
  { id: 'architecture', label: 'Architecture', hint: 'Microservices e-commerce platform' },
  { id: 'network',      label: 'Network',      hint: 'Cloud network topology with VPCs' },
  { id: 'pipeline',     label: 'Pipeline',     hint: 'CI/CD pipeline for a web app' },
  { id: 'system',       label: 'System',       hint: 'Real-time chat system design' },
  { id: 'infra',        label: 'Infra',        hint: 'AWS infrastructure for a SaaS app' },
];

const SHAPE_MAP = {
  rounded: 'rectangle', rect: 'rectangle', rectangle: 'rectangle',
  cylinder: 'rectangle', cloud: 'rectangle', hexagon: 'rectangle',
  parallelogram: 'rectangle', text: 'text',
  circle: 'circle', ellipse: 'ellipse',
  diamond: 'triangle', triangle: 'triangle',
};

// ── Dagre layout → canvas elements ───────────────────────────────────────────
function buildCanvasElements(nodes, edges) {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'TB', ranksep: 90, nodesep: 70, marginx: 80, marginy: 80 });
  nodes.forEach(n => g.setNode(n.id, { width: n.width || 140, height: n.height || 60 }));
  edges.forEach(e => { if (e.source && e.target) g.setEdge(e.source, e.target); });
  dagre.layout(g);

  const elements = [];
  const centers  = {};

  nodes.forEach(n => {
    const pos = g.node(n.id);
    if (!pos) return;
    const w = n.width  || 140;
    const h = n.height || 60;
    const x1 = Math.round(pos.x - w / 2);
    const y1 = Math.round(pos.y - h / 2);
    const x2 = x1 + w;
    const y2 = y1 + h;
    centers[n.id] = { x: pos.x, y: pos.y };

    const shapeKey = SHAPE_MAP[n.shape] || 'rectangle';
    const el = createElement[shapeKey]?.(x1, y1, x2, y2, n.fill || '#1e293b', n.stroke || '#6366f1', 2);
    if (el) elements.push(el);

    // Label centred in the node box
    const label = n.label;
    const lh = 20;
    elements.push({
      type: 'text',
      x1: x1 + 4,
      y1: y1 + Math.round((h - lh) / 2),
      x2: x2 - 4,
      y2: y1 + Math.round((h - lh) / 2) + lh,
      text: label,
    });
  });

  edges.forEach(e => {
    const from = centers[e.source];
    const to   = centers[e.target];
    if (!from || !to) return;
    const arrow = createElement['arrow']?.(from.x, from.y, to.x, to.y, '', '#94a3b8', 1);
    if (arrow) elements.push(arrow);
    if (e.label) {
      const mx = Math.round((from.x + to.x) / 2);
      const my = Math.round((from.y + to.y) / 2);
      elements.push({ type: 'text', x1: mx - 45, y1: my - 10, x2: mx + 45, y2: my + 10, text: e.label });
    }
  });

  return elements;
}

// ── Spinner ───────────────────────────────────────────────────────────────────
const Spinner = () => (
  <>
    <style>{`@keyframes ai-sp{to{transform:rotate(360deg)}}`}</style>
    <div style={{
      width: 16, height: 16, flexShrink: 0,
      border: '2px solid #e2e8f0', borderTopColor: '#6366f1',
      borderRadius: '50%', animation: 'ai-sp 0.7s linear infinite',
    }} />
  </>
);

// ── Main component ────────────────────────────────────────────────────────────
export default function AISidebar({ setElements, setActiveElem }) {
  const [open, setOpen]             = useState(false);
  const [mode, setMode]             = useState('canvas');
  const [diagType, setDiagType]     = useState('architecture');
  const [prompt, setPrompt]         = useState('');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [mermaidCode, setMermaidCode] = useState('');
  const [resultMsg, setResultMsg]   = useState('');

  const currentTypes = mode === 'mermaid' ? MERMAID_TYPES : CANVAS_TYPES;
  const placeholder  = currentTypes.find(t => t.id === diagType)?.hint || 'Describe your diagram…';

  const switchMode = (m) => {
    setMode(m);
    setMermaidCode('');
    setResultMsg('');
    setError('');
    setDiagType(m === 'mermaid' ? 'flowchart' : 'architecture');
  };

  const generate = useCallback(async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true); setError(''); setMermaidCode(''); setResultMsg('');
    try {
      const res  = await fetch('/api/ai-diagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim(), mode, diagramType: diagType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');

      if (data.mode === 'mermaid') {
        setMermaidCode(data.code || '');
      } else {
        const els = buildCanvasElements(data.nodes || [], data.edges || []);
        setElements(prev => [...prev, ...els]);
        setActiveElem([]);
        setResultMsg(`Added ${data.nodes?.length || 0} nodes & ${data.edges?.length || 0} edges to canvas`);
        setPrompt('');
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [prompt, mode, diagType, loading, setElements, setActiveElem]);

  return (
    <>
      <style>{`
        .ai-toggle { transition: right 0.25s cubic-bezier(0.4,0,0.2,1); }
        .ai-panel  { transition: transform 0.25s cubic-bezier(0.4,0,0.2,1); }
        .ai-chip   { cursor:pointer; border-radius:20px; padding:5px 12px; font-size:12px; font-weight:600; border:1.5px solid; transition:all 0.12s; white-space:nowrap; background:transparent; }
        .ai-chip:hover { background:#f1f5f9!important; }
        .ai-tab    { flex:1; padding:10px 0; border:none; background:none; cursor:pointer; font-size:13px; font-weight:600; transition:all 0.15s; }
        .ai-btn    { width:100%; padding:11px; border-radius:8px; border:none; font-weight:700; font-size:14px; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; transition:all 0.15s; }
        .ai-btn:hover:not(:disabled) { opacity:0.88; transform:translateY(-1px); }
        .ai-btn:disabled { cursor:not-allowed; }
        .ai-scroll::-webkit-scrollbar { width:4px; }
        .ai-scroll::-webkit-scrollbar-thumb { background:#e2e8f0; border-radius:4px; }
      `}</style>

      {/* ── Floating toggle tab ─────────────────────────────────── */}
      <button
        className="ai-toggle"
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'fixed', top: '50%',
          right: open ? 360 : 0,
          transform: 'translateY(-50%)',
          zIndex: 500,
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          color: '#fff', border: 'none', borderRadius: '10px 0 0 10px',
          padding: '16px 9px', cursor: 'pointer',
          writingMode: 'vertical-rl', fontSize: 12, fontWeight: 700,
          letterSpacing: '0.05em',
          boxShadow: '-3px 0 18px rgba(99,102,241,0.35)',
          display: 'flex', alignItems: 'center', gap: 5,
        }}
      >
        AI
      </button>

      {/* ── Sidebar panel ──────────────────────────────────────── */}
      <div
        className="ai-panel"
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, width: 360,
          background: '#ffffff', borderLeft: '1px solid #e5e5e5',
          display: 'flex', flexDirection: 'column',
          zIndex: 499, fontFamily: 'var(--font-sans), system-ui, sans-serif',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          boxShadow: open ? '-6px 0 30px rgba(0,0,0,0.08)' : 'none',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e5e5e5',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          background: '#fafafa',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 20, fontFamily: 'var(--font-serif), serif', fontWeight: 600, color: '#1a1a1a', letterSpacing: '-0.02em' }}>
                AI Diagram Generator
              </span>
            </div>
           
          </div>
          <button
            onClick={() => setOpen(false)}
            style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', fontSize: 16, color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >✕</button>
        </div>

        <div style={{ display: 'flex', borderBottom: '1px solid #f1f5f9', background: '#fafbfc' }}>
          <button className="ai-tab" style={{
            color: mode === 'canvas' ? '#6366f1' : '#94a3b8',
            borderBottom: `2px solid ${mode === 'canvas' ? '#6366f1' : 'transparent'}`,
          }} onClick={() => switchMode('canvas')}>
            Sketch Canvas
          </button>
          <button className="ai-tab" style={{
            color: mode === 'mermaid' ? '#6366f1' : '#94a3b8',
            borderBottom: `2px solid ${mode === 'mermaid' ? '#6366f1' : 'transparent'}`,
          }} onClick={() => switchMode('mermaid')}>
            Standard Diagram
          </button>
        </div>

        {/* Scrollable body */}
        <div className="ai-scroll" style={{ flex: 1, overflowY: 'auto', padding: '18px' }}>

          {/* Diagram type chips */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
              Diagram type
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {currentTypes.map(t => (
                <button
                  key={t.id}
                  className="ai-chip"
                  onClick={() => setDiagType(t.id)}
                  style={{
                    color:       diagType === t.id ? '#6366f1' : '#64748b',
                    borderColor: diagType === t.id ? '#6366f1' : '#e2e8f0',
                    background:  diagType === t.id ? '#eef2ff' : 'transparent',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Prompt */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              Describe your diagram
            </div>
            <textarea
              placeholder={`e.g. ${placeholder}`}
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) generate(); }}
              disabled={loading}
              rows={4}
              style={{
                width: '100%', boxSizing: 'border-box',
                border: '1.5px solid #e2e8f0', borderRadius: 8,
                padding: '10px 12px', fontSize: 13, color: '#1e293b',
                fontFamily: 'inherit', resize: 'none', outline: 'none',
                background: '#ffffff', lineHeight: 1.5,
                transition: 'border-color 0.15s',
              }}
              onFocus={e => e.target.style.borderColor = '#818cf8'}
              onBlur={e  => e.target.style.borderColor = '#e2e8f0'}
            />
            <div style={{ fontSize: 11, color: '#cbd5e1', marginTop: 4 }}>Ctrl+Enter to generate</div>
          </div>

          {/* Generate button */}
          <button
            className="ai-btn"
            disabled={loading || !prompt.trim()}
            onClick={generate}
            style={{
              background: loading || !prompt.trim()
                ? '#f5f5f5'
                : '#1a1a1a',
              color: loading || !prompt.trim() ? '#a3a3a3' : '#ffffff',
              marginBottom: 16,
              borderRadius: 6,
            }}
          >
            {loading ? <><Spinner />Generating…</> : 'Generate Diagram'}
          </button>

          {/* Error */}
          {error && (
            <div style={{
              background: '#fff5f5', border: '1px solid #fed7d7', borderRadius: 8,
              padding: '10px 14px', fontSize: 12, color: '#e53e3e', marginBottom: 14,
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* Canvas success */}
          {resultMsg && (
            <div style={{
              background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8,
              padding: '10px 14px', fontSize: 12, color: '#15803d', marginBottom: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                ✅ {resultMsg}
              </div>
              <button onClick={() => setResultMsg('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#166534', fontSize: 16 }}>✕</button>
            </div>
          )}

          {/* Mermaid result */}
          {mermaidCode && mode === 'mermaid' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Result
                </div>
                <button
                  onClick={() => setMermaidCode('')}
                  style={{ background: 'transparent', border: '1px solid #e2e8f0', borderRadius: 4, padding: '2px 8px', fontSize: 10, cursor: 'pointer', color: '#64748b' }}
                >
                  Clear Output
                </button>
              </div>
              <div style={{
                background: '#0d1117', borderRadius: 10, overflow: 'auto',
                maxHeight: 400, border: '1px solid #e2e8f0',
              }}>
                <MermaidRenderer chartCode={mermaidCode} theme="dark" />
              </div>
              <details style={{ marginTop: 10 }}>
                <summary style={{ fontSize: 11, color: '#94a3b8', cursor: 'pointer', userSelect: 'none' }}>
                  View Mermaid code
                </summary>
                <pre style={{
                  marginTop: 8, padding: '10px 12px',
                  background: '#f8fafc', borderRadius: 8,
                  border: '1px solid #e2e8f0',
                  fontSize: 11, color: '#64748b',
                  overflow: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                }}>{mermaidCode}</pre>
              </details>
            </div>
          )}

          {/* Empty state description */}
          {!loading && !mermaidCode && !resultMsg && !error && (
            <div style={{
              background: '#f8fafc', borderRadius: 10, padding: 16,
              border: '1px solid #f1f5f9',
            }}>
              <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.7 }}>
                {mode === 'canvas' ? (
                  <>
                    <div style={{ fontWeight: 700, color: '#475569', marginBottom: 6 }}>Sketch Canvas mode</div>
                    Generates editable rough shapes on your canvas using AI + dagre auto-layout.
                    Move, resize, and restyle every generated node.
                  </>
                ) : (
                  <>
                    <div style={{ fontWeight: 700, color: '#475569', marginBottom: 6 }}>Standard Diagram mode</div>
                    Generates clean, publication-ready diagrams using Mermaid.js.
                    Flowcharts, ER, sequence, class, mindmaps and more.
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
