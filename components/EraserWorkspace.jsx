'use client';
import React, { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import dagre from 'dagre';

const DiagramCanvas = dynamic(() => import('./DiagramCanvas'), { ssr: false });

// ─── Shape palette ────────────────────────────────────────────────────────────
const SHAPES = [
  { shape:'rounded',      label:'Rounded',      preview:'▢' },
  { shape:'rect',         label:'Rectangle',    preview:'▬' },
  { shape:'circle',       label:'Circle',       preview:'●' },
  { shape:'diamond',      label:'Diamond',      preview:'◆' },
  { shape:'hexagon',      label:'Hexagon',      preview:'⬡' },
  { shape:'parallelogram',label:'Parallelogram',preview:'▱' },
  { shape:'cylinder',     label:'Cylinder',     preview:'⏱' },
  { shape:'triangle',     label:'Triangle',     preview:'▲' },
  { shape:'cloud',        label:'Cloud',        preview:'☁' },
  { shape:'text',         label:'Text',         preview:'T' },
];

// ─── Icon categories ──────────────────────────────────────────────────────────
const ICONS = {
  'General':   ['📄','📁','🔗','🌐','💡','🔒','📊','📈','⚙️','🔧','🔑','📌','🏷️','📎','✅','❌','⚠️','ℹ️','🔔','📢'],
  'People':    ['👤','👥','🧑‍💻','👨‍💼','👩‍💼','🤖','👨‍🔬','🧑‍🏫','👷','🧑‍🎨'],
  'Tech':      ['💻','🖥️','📱','🗄️','☁️','🔌','🛡️','📡','🖨️','⌨️','🖱️','💾','💿','📟','🔋'],
  'Diagrams':  ['▶️','⏸️','⏹️','🔀','↩️','↪️','🔁','🔃','➕','➖','✖️','🟢','🟡','🔴','🔵'],
  'Business':  ['💰','💳','🏦','📦','🚚','🏪','📞','📧','📮','🗂️','📋','📝','📅','🎯','🚀'],
};

const COLORS = ['#1e293b','#0f172a','#1e1b4b','#14532d','#7f1d1d','#451a03','#1c1917','#0c4a6e'];
const STROKES = ['#6366f1','#a855f7','#10b981','#f59e0b','#ef4444','#3b82f6','#ec4899','#64748b','#f8fafc'];

const INPUT = { background:'#0d1117', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'7px', color:'#e2e8f0', fontSize:'12px', padding:'7px 10px', width:'100%', outline:'none', boxSizing:'border-box', fontFamily:'inherit' };

// ─── Dagre layout function ───────────────────────────────────────────────────
function applyDagreLayout(nodes, edges, direction = 'TB') {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: direction, ranksep: 80, nodesep: 60, marginx: 85, marginy: 85 });

  nodes.forEach(n => {
    g.setNode(n.id, { width: n.width || 140, height: n.height || 60 });
  });

  edges.forEach(e => {
    g.setEdge(e.source, e.target);
  });

  dagre.layout(g);

  return nodes.map(n => {
    const pos = g.node(n.id);
    if (!pos) return n;
    return {
      ...n,
      x: Math.round(pos.x - (n.width || 140) / 2),
      y: Math.round(pos.y - (n.height || 60) / 2),
    };
  });
}

function newNode(shape, icon='') {
  return {
    id: `n_${Date.now()}`,
    label: shape === 'text' ? 'Text' : shape === 'cylinder' ? 'Database' : 'Label',
    shape, icon,
    fill: shape === 'cylinder' ? '#1c1917' : '#1e293b',
    stroke: shape === 'cylinder' ? '#a855f7' : '#6366f1',
    textColor: '#f1f5f9',
    fontSize: 13,
    width: shape === 'circle' ? 100 : shape === 'diamond' ? 120 : 140,
    height: shape === 'circle' ? 100 : shape === 'diamond' ? 80 : 60,
    x: 200 + Math.random() * 200,
    y: 150 + Math.random() * 150,
  };
}

const DEFAULT_DIAGRAM = {
  title: 'Artificial Intelligence Mindmap',
  nodes: [
    { id: 'n1', label: 'Artificial Intelligence', shape: 'circle', icon: '🧠', fill: '#1e1b4b', stroke: '#a855f7', textColor: '#f8fafc', fontSize: 14, width: 120, height: 120, x: 250, y: 50 },
    { id: 'n2', label: 'Machine Learning', shape: 'rounded', icon: '💻', fill: '#1e293b', stroke: '#3b82f6', textColor: '#f8fafc', fontSize: 13, width: 140, height: 60, x: 80, y: 250 },
    { id: 'n3', label: 'Deep Learning', shape: 'rounded', icon: '🚀', fill: '#14532d', stroke: '#10b981', textColor: '#f8fafc', fontSize: 13, width: 140, height: 60, x: 420, y: 250 },
  ],
  edges: [
    { id: 'e1', source: 'n1', target: 'n2', label: 'drives', animated: true, strokeColor: '#4f5d7e' },
    { id: 'e2', source: 'n1', target: 'n3', label: 'enables', animated: true, strokeColor: '#4f5d7e' },
  ],
};

export default function EraserWorkspace() {
  const [diagram, setDiagram]       = useState(DEFAULT_DIAGRAM);
  const [selId, setSelId]           = useState(null);
  const [prompt, setPrompt]         = useState('');
  const [loading, setLoading]       = useState(false);
  const [aiError, setAiError]       = useState('');
  const [tab, setTab]               = useState('shapes');   // shapes | icons | properties
  const [iconCat, setIconCat]       = useState('General');

  const sel = diagram.nodes.find(n => n.id === selId) ?? null;

  // ── AI generate ────────────────────────────────────────────────────────────
  const generate = useCallback(async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true); setAiError('');
    try {
      const res  = await fetch('/api/generate-diagram', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');

      // Map AI nodes to our generic shape schema
      const mappedNodes = (data.nodes || []).map((n, i) => ({
        id: n.id ?? `n_${i}`,
        label: n.label ?? 'Node',
        shape: n.shape ?? 'rounded',
        icon: n.icon ?? '',
        fill: n.fill ?? '#1e293b',
        stroke: n.stroke ?? '#6366f1',
        textColor: '#f1f5f9',
        fontSize: 13,
        width: Number(n.width || 140),
        height: Number(n.height || 60),
      }));

      // Apply Dagre layout before updating parent state
      const layoutedNodes = applyDagreLayout(mappedNodes, data.edges || [], 'TB');

      setDiagram({
        title: data.title || 'Generic Diagram',
        nodes: layoutedNodes,
        edges: data.edges || [],
      });
      
      setSelId(null);
      setPrompt('');
      setTab('shapes');
    } catch(e) { setAiError(e.message); }
    finally { setLoading(false); }
  }, [prompt, loading]);

  // ── Node mutations ─────────────────────────────────────────────────────────
  const addShape = (shape) => {
    const n = newNode(shape);
    setDiagram(d => ({ ...d, nodes: [...d.nodes, n] }));
    setSelId(n.id); setTab('properties');
  };

  const addIconNode = (icon) => {
    const n = newNode('circle', icon);
    n.label = icon;
    setDiagram(d => ({ ...d, nodes: [...d.nodes, n] }));
    setSelId(n.id); setTab('properties');
  };

  const updateSel = (changes) => {
    setDiagram(d => ({ ...d, nodes: d.nodes.map(n => n.id === selId ? { ...n, ...changes } : n) }));
  };

  const deleteSel = () => {
    setDiagram(d => ({
      ...d,
      nodes: d.nodes.filter(n => n.id !== selId),
      edges: d.edges.filter(e => e.source !== selId && e.target !== selId),
    }));
    setSelId(null); setTab('shapes');
  };

  const clearAll = () => { setDiagram({ nodes:[], edges:[] }); setSelId(null); };

  const handleNodeSelect = useCallback((id) => {
    setSelId(id); setTab('properties');
  }, []);

  const handleNodeMove = useCallback((id, x, y) => {
    setDiagram(d => ({
      ...d,
      nodes: d.nodes.map(n => n.id === id ? { ...n, x, y } : n)
    }));
  }, []);

  const handleNodeResize = useCallback((id, width, height) => {
    setDiagram(d => ({
      ...d,
      nodes: d.nodes.map(n => n.id === id ? { ...n, width, height } : n)
    }));
  }, []);

  // ── Label helper ───────────────────────────────────────────────────────────
  const lbl = (text) => (
    <div style={{ color:'#64748b', fontSize:'10px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:5 }}>{text}</div>
  );

  return (
    <div style={{ display:'flex', flexDirection:'column', width:'100vw', height:'100vh', background:'#070a13', color:'#f8fafc', fontFamily:'system-ui,sans-serif', overflow:'hidden' }}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0 20px', height:'52px', borderBottom:'1px solid rgba(255,255,255,0.08)', background:'rgba(9,13,22,0.98)', zIndex:50, flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          <div style={{ background:'linear-gradient(135deg,#6366f1,#a855f7)', padding:'7px', borderRadius:'9px' }}>✏️</div>
          <div>
            <div style={{ fontSize:'14px', fontWeight:700 }}>Diagram Studio <span style={{ color:'#818cf8', fontWeight:400, fontSize:'12px' }}>Canvas</span></div>
            <div style={{ fontSize:'10px', color:'#475569' }}>Draw anything · Shapes, Icons, AI-generated</div>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
          <span style={{ color:'#475569', fontSize:'11px' }}>{diagram.nodes.length} nodes · {diagram.edges.length} edges</span>
          <button onClick={clearAll} style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', color:'#f87171', borderRadius:'6px', padding:'5px 12px', fontSize:'11px', fontWeight:600, cursor:'pointer' }}>Clear</button>
          <a href="/" style={{ padding:'6px 14px', borderRadius:'20px', border:'1px solid rgba(255,255,255,0.1)', color:'#94a3b8', fontSize:'12px', textDecoration:'none', fontWeight:600 }}
            onMouseEnter={e=>{ e.currentTarget.style.color='#f8fafc'; }} onMouseLeave={e=>{ e.currentTarget.style.color='#94a3b8'; }}
          >🎨 Doodle</a>
        </div>
      </header>

      <div style={{ display:'flex', flex:1, overflow:'hidden' }}>

        {/* ── Left Panel ──────────────────────────────────────────────────── */}
        <div style={{ width:'280px', flexShrink:0, display:'flex', flexDirection:'column', borderRight:'1px solid rgba(255,255,255,0.07)', background:'#090d16', overflow:'hidden' }}>

          {/* AI prompt */}
          <div style={{ padding:'14px', borderBottom:'1px solid rgba(255,255,255,0.07)', background:'rgba(99,102,241,0.03)' }}>
            <div style={{ fontSize:'11px', fontWeight:700, color:'#818cf8', marginBottom:'8px' }}>🪄 AI Generate</div>
            {aiError && <div style={{ marginBottom:'8px', padding:'7px', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:'7px', color:'#f87171', fontSize:'11px' }}>{aiError}</div>}
            <div style={{ position:'relative' }}>
              <textarea
                value={prompt} onChange={e=>setPrompt(e.target.value)}
                onKeyDown={e=>{ if(e.key==='Enter'&&(e.metaKey||e.ctrlKey)) generate(); }}
                disabled={loading}
                placeholder={'Describe anything...\n"Hospital management ER schema"\n"SDLC flowchart"\n"Solar system mindmap"\n\nCtrl+Enter'}
                style={{ ...INPUT, height:'90px', resize:'none', paddingBottom:'36px', lineHeight:'1.5' }}
              />
              <button onClick={generate} disabled={loading||!prompt.trim()} style={{
                position:'absolute', bottom:'8px', right:'8px',
                background: loading||!prompt.trim() ? 'rgba(30,41,59,0.8)' : 'linear-gradient(135deg,#6366f1,#a855f7)',
                color: loading||!prompt.trim() ? '#475569' : 'white',
                border:'none', borderRadius:'6px', padding:'5px 13px', fontSize:'11px', fontWeight:700, cursor: loading||!prompt.trim() ? 'not-allowed' : 'pointer',
              }}>{loading ? '⏳…' : '⚡ Build'}</button>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display:'flex', borderBottom:'1px solid rgba(255,255,255,0.07)', flexShrink:0 }}>
            {[['shapes','⬡ Shapes'],['icons','😀 Icons'],['properties','⚙️ Props']].map(([k,lbl])=>(
              <button key={k} onClick={()=>setTab(k)} style={{
                flex:1, padding:'8px 0', fontSize:'10px', fontWeight:600, cursor:'pointer',
                background:'transparent', border:'none',
                borderBottom: tab===k ? '2px solid #6366f1' : '2px solid transparent',
                color: tab===k ? '#818cf8' : '#64748b', transition:'all 0.15s',
              }}>{lbl}</button>
            ))}
          </div>

          <div style={{ flex:1, overflowY:'auto', scrollbarWidth:'thin', scrollbarColor:'rgba(99,102,241,0.3) transparent' }}>

            {/* ── SHAPES tab ──────────────────────────────────────────────── */}
            {tab === 'shapes' && (
              <div style={{ padding:'14px' }}>
                <div style={{ color:'#475569', fontSize:'10px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:'10px' }}>Click to add shape</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
                  {SHAPES.map(({ shape, label, preview }) => (
                    <button key={shape} onClick={()=>addShape(shape)} style={{
                      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                      gap:'5px', padding:'12px 8px',
                      background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)',
                      borderRadius:'9px', cursor:'pointer', transition:'all 0.15s',
                    }}
                      onMouseEnter={e=>{ e.currentTarget.style.background='rgba(99,102,241,0.12)'; e.currentTarget.style.borderColor='rgba(99,102,241,0.4)'; }}
                      onMouseLeave={e=>{ e.currentTarget.style.background='rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.07)'; }}
                    >
                      <span style={{ fontSize:22, color:'#94a3b8' }}>{preview}</span>
                      <span style={{ fontSize:10, color:'#64748b', fontWeight:600 }}>{label}</span>
                    </button>
                  ))}
                </div>

                {/* Current nodes list */}
                {diagram.nodes.length > 0 && (
                  <div style={{ marginTop:'16px' }}>
                    <div style={{ color:'#475569', fontSize:'10px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:'8px' }}>Nodes on canvas</div>
                    {diagram.nodes.map(n => (
                      <div key={n.id} style={{
                        display:'flex', alignItems:'center', gap:'7px', padding:'5px 8px', borderRadius:'6px', cursor:'pointer', marginBottom:'4px',
                        background: selId===n.id ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.02)',
                        border: selId===n.id ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
                      }} onClick={()=>{ setSelId(n.id); setTab('properties'); }}>
                        <span style={{ fontSize:14 }}>{n.icon || (n.shape==='circle'?'○':n.shape==='diamond'?'◆':n.shape==='cylinder'?'⏱':'▢')}</span>
                        <span style={{ flex:1, fontSize:'11px', color:'#cbd5e1', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{n.label}</span>
                        <button onClick={e=>{ e.stopPropagation(); if(selId===n.id) setSelId(null); setDiagram(d=>({ ...d, nodes:d.nodes.filter(x=>x.id!==n.id), edges:d.edges.filter(x=>x.source!==n.id&&x.target!==n.id) })); }} style={{ background:'rgba(239,68,68,0.12)', border:'none', borderRadius:'4px', color:'#f87171', fontSize:'10px', cursor:'pointer', padding:'2px 6px' }}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── ICONS tab ───────────────────────────────────────────────── */}
            {tab === 'icons' && (
              <div style={{ padding:'14px' }}>
                {/* Category tabs */}
                <div style={{ display:'flex', flexWrap:'wrap', gap:'5px', marginBottom:'12px' }}>
                  {Object.keys(ICONS).map(cat => (
                    <button key={cat} onClick={()=>setIconCat(cat)} style={{
                      fontSize:'10px', fontWeight:600, padding:'3px 8px', borderRadius:'5px', cursor:'pointer',
                      background: iconCat===cat ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)',
                      border: iconCat===cat ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(255,255,255,0.07)',
                      color: iconCat===cat ? '#a5b4fc' : '#64748b',
                    }}>{cat}</button>
                  ))}
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:'5px' }}>
                  {ICONS[iconCat].map((icon, i) => (
                    <button key={i} onClick={()=>addIconNode(icon)} title={`Add ${icon}`} style={{
                      fontSize:20, padding:'8px 4px', borderRadius:'7px', cursor:'pointer',
                      background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)',
                      transition:'all 0.12s',
                    }}
                      onMouseEnter={e=>{ e.currentTarget.style.background='rgba(99,102,241,0.15)'; e.currentTarget.style.transform='scale(1.1)'; }}
                      onMouseLeave={e=>{ e.currentTarget.style.background='rgba(255,255,255,0.03)'; e.currentTarget.style.transform='scale(1)'; }}
                    >{icon}</button>
                  ))}
                </div>
              </div>
            )}

            {/* ── PROPERTIES tab ──────────────────────────────────────────── */}
            {tab === 'properties' && (
              <div style={{ padding:'14px' }}>
                {!sel ? (
                  <div style={{ textAlign:'center', color:'#475569', marginTop:'28px' }}>
                    <div style={{ fontSize:'28px', marginBottom:'8px' }}>👆</div>
                    <div style={{ fontSize:'12px' }}>Click a node on the canvas to edit</div>
                  </div>
                ) : (
                  <>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'14px' }}>
                      <span style={{ fontSize:'11px', fontWeight:700, color:'#94a3b8' }}>Editing Node</span>
                      <button onClick={deleteSel} style={{ background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:'6px', color:'#f87171', fontSize:'10px', cursor:'pointer', padding:'4px 10px', fontWeight:600 }}>🗑 Delete</button>
                    </div>

                    {/* Label */}
                    <div style={{ marginBottom:'11px' }}>
                      {lbl('Label')}
                      <input style={INPUT} value={sel.label} onChange={e=>updateSel({label:e.target.value})} />
                    </div>

                    {/* Icon */}
                    <div style={{ marginBottom:'11px' }}>
                      {lbl('Icon (emoji)')}
                      <input style={INPUT} value={sel.icon||''} onChange={e=>updateSel({icon:e.target.value})} placeholder="e.g. 🔒 or leave empty" />
                    </div>

                    {/* Shape */}
                    <div style={{ marginBottom:'11px' }}>
                      {lbl('Shape')}
                      <select style={{ ...INPUT, cursor:'pointer' }} value={sel.shape||'rounded'} onChange={e=>updateSel({shape:e.target.value})}>
                        {SHAPES.map(s=><option key={s.shape} value={s.shape}>{s.preview} {s.label}</option>)}
                      </select>
                    </div>

                    {/* Size */}
                    <div style={{ marginBottom:'11px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'7px' }}>
                      <div>
                        {lbl('Width')}
                        <input type="number" style={INPUT} value={sel.width||140} onChange={e=>updateSel({width:+e.target.value})} min={40} max={400} step={10} />
                      </div>
                      <div>
                        {lbl('Height')}
                        <input type="number" style={INPUT} value={sel.height||60} onChange={e=>updateSel({height:+e.target.value})} min={40} max={400} step={10} />
                      </div>
                    </div>

                    {/* Font size */}
                    <div style={{ marginBottom:'11px' }}>
                      {lbl('Font size')}
                      <input type="range" min={9} max={24} value={sel.fontSize||13} onChange={e=>updateSel({fontSize:+e.target.value})} style={{ width:'100%', accentColor:'#6366f1' }} />
                      <span style={{ color:'#64748b', fontSize:'10px' }}>{sel.fontSize||13}px</span>
                    </div>

                    {/* Fill colour */}
                    <div style={{ marginBottom:'11px' }}>
                      {lbl('Fill colour')}
                      <div style={{ display:'flex', gap:'5px', flexWrap:'wrap', marginBottom:'5px' }}>
                        {COLORS.map(c=>(
                          <div key={c} onClick={()=>updateSel({fill:c})} style={{ width:22, height:22, borderRadius:4, background:c, border: sel.fill===c ? '2px solid #f8fafc' : '2px solid transparent', cursor:'pointer' }} />
                        ))}
                        <input type="color" value={sel.fill||'#1e293b'} onChange={e=>updateSel({fill:e.target.value})} style={{ width:22, height:22, padding:0, border:'none', borderRadius:4, cursor:'pointer', background:'transparent' }} />
                      </div>
                    </div>

                    {/* Stroke colour */}
                    <div style={{ marginBottom:'11px' }}>
                      {lbl('Border colour')}
                      <div style={{ display:'flex', gap:'5px', flexWrap:'wrap', marginBottom:'5px' }}>
                        {STROKES.map(c=>(
                          <div key={c} onClick={()=>updateSel({stroke:c})} style={{ width:22, height:22, borderRadius:4, background:c, border: sel.stroke===c ? '2px solid #f8fafc' : '2px solid transparent', cursor:'pointer' }} />
                        ))}
                        <input type="color" value={sel.stroke||'#6366f1'} onChange={e=>updateSel({stroke:e.target.value})} style={{ width:22, height:22, padding:0, border:'none', borderRadius:4, cursor:'pointer', background:'transparent' }} />
                      </div>
                    </div>

                    {/* Text colour */}
                    <div style={{ marginBottom:'6px' }}>
                      {lbl('Text colour')}
                      <input type="color" value={sel.textColor||'#f1f5f9'} onChange={e=>updateSel({textColor:e.target.value})} style={{ width:'100%', height:28, padding:0, border:'1px solid rgba(255,255,255,0.1)', borderRadius:7, cursor:'pointer', background:'transparent' }} />
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Canvas ──────────────────────────────────────────────────────── */}
        <div style={{ flex:1, position:'relative', overflow:'hidden' }}>
          {loading && (
            <div style={{ position:'absolute', inset:0, zIndex:20, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'rgba(7,10,19,0.8)', backdropFilter:'blur(4px)' }}>
              <div style={{ width:36, height:36, border:'3px solid rgba(255,255,255,0.08)', borderLeftColor:'#6366f1', borderRadius:'50%', animation:'spin 0.8s linear infinite', marginBottom:12 }} />
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              <div style={{ color:'#818cf8', fontWeight:600 }}>Building diagram…</div>
            </div>
          )}
          <DiagramCanvas
            nodes={diagram.nodes}
            edges={diagram.edges}
            onNodeSelect={handleNodeSelect}
            onNodeMove={handleNodeMove}
            onNodeResize={handleNodeResize}
          />
          {diagram.nodes.length === 0 && !loading && (
            <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:'none' }}>
              <div style={{ textAlign:'center', color:'#1e293b' }}>
                <div style={{ fontSize:48, marginBottom:12 }}>🎨</div>
                <div style={{ fontSize:16, fontWeight:600, color:'#334155' }}>Blank canvas</div>
                <div style={{ fontSize:12, color:'#1e293b', marginTop:4 }}>Add shapes from the left · Generate with AI · Drag to connect</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
