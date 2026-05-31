'use client';
import React, { useCallback, useEffect, useRef } from 'react';
import {
  ReactFlow, Background, Controls, MiniMap,
  Handle, Position, BaseEdge, EdgeLabelRenderer,
  getBezierPath, MarkerType,
  useNodesState, useEdgesState, addEdge,
  NodeResizer
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// ─── Shape renderers ─────────────────────────────────────────────────────────
function ShapeNode({ data, selected }) {
  const {
    label = 'Label', shape = 'rect', icon = '',
    fill = '#1e293b', stroke = '#6366f1', textColor = '#f1f5f9',
    fontSize = 13, width = 140, height = 60,
  } = data;

  const borderSel = selected ? '#cbd5e1' : stroke;
  const shadow    = selected ? `0 0 0 2px #6366f155, 0 10px 30px rgba(0,0,0,0.6)` : '0 4px 14px rgba(0,0,0,0.35)';
  const handleStyle = { background: borderSel, width: 8, height: 8, border: `2px solid ${fill}` };

  const handles = (
    <>
      <Handle type="target"  position={Position.Top}    style={handleStyle} />
      <Handle type="target"  position={Position.Left}   style={handleStyle} />
      <Handle type="source"  position={Position.Bottom} style={handleStyle} />
      <Handle type="source"  position={Position.Right}  style={handleStyle} />
    </>
  );

  const text = (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'4px', width:'100%', height:'100%', padding:'10px', boxSizing:'border-box', overflow:'hidden' }}>
      {icon && <span style={{ fontSize: Math.max(fontSize + 6, 20), lineHeight:1 }}>{icon}</span>}
      {label && <span style={{ color: textColor, fontSize, fontWeight: 600, textAlign:'center', lineHeight: 1.3, wordBreak:'break-word', width: '100%' }}>{label}</span>}
    </div>
  );

  const resizer = selected && (
    <NodeResizer
      minWidth={50}
      minHeight={30}
      isVisible={selected}
      lineStyle={{ borderColor: stroke, borderWidth: 1.5 }}
      handleStyle={{ width: 8, height: 8, background: '#fff', border: `2.5px solid ${stroke}`, borderRadius: 2 }}
    />
  );

  // ── CIRCLE ───────────────────────────────────────────────────────────────
  if (shape === 'circle') {
    return (
      <div style={{ width: '100%', height: '100%', borderRadius:'50%', background: fill, border:`2px solid ${borderSel}`, boxShadow: shadow, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', boxSizing:'border-box', position:'relative' }}>
        {handles}{resizer}{text}
      </div>
    );
  }

  // ── DIAMOND ──────────────────────────────────────────────────────────────
  if (shape === 'diamond') {
    return (
      <div style={{ width: '100%', height: '100%', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', position:'relative', boxSizing:'border-box' }}>
        {handles}{resizer}
        <div style={{ position:'absolute', inset:'12.5%', background: fill, border:`2px solid ${borderSel}`, transform:'rotate(45deg)', boxShadow: shadow }} />
        <div style={{ position:'relative', zIndex:1, width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center' }}>{text}</div>
      </div>
    );
  }

  // ── HEXAGON ──────────────────────────────────────────────────────────────
  if (shape === 'hexagon') {
    return (
      <div style={{
        width: '100%', height: '100%', background: fill, border:`2px solid ${borderSel}`,
        clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
        boxShadow: shadow, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', boxSizing:'border-box', position:'relative'
      }}>
        {handles}{resizer}{text}
      </div>
    );
  }

  // ── PARALLELOGRAM ─────────────────────────────────────────────────────────
  if (shape === 'parallelogram') {
    return (
      <div style={{ width: '100%', height: '100%', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', position:'relative', boxSizing:'border-box' }}>
        {handles}{resizer}
        <div style={{ position:'absolute', inset:0, background: fill, border:`2px solid ${borderSel}`, transform:'skewX(-12deg)', boxShadow: shadow }} />
        <div style={{ position:'relative', zIndex:1, width:'100%', height:'100%' }}>{text}</div>
      </div>
    );
  }

  // ── CYLINDER (database) ───────────────────────────────────────────────────
  if (shape === 'cylinder') {
    return (
      <div style={{ width: '100%', height: '100%', display:'flex', flexDirection:'column', cursor:'pointer', position:'relative', boxSizing:'border-box' }}>
        {handles}{resizer}
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position:'absolute', inset:0 }}>
          <ellipse cx="50" cy="12" rx="46" ry="10" fill={fill} stroke={borderSel} strokeWidth={2} />
          <rect x="4" y="12" width="92" height="76" fill={fill} stroke="none" />
          <line x1="4" y1="12" x2="4" y2="88" stroke={borderSel} strokeWidth={2} />
          <line x1="96" y1="12" x2="96" y2="88" stroke={borderSel} strokeWidth={2} />
          <ellipse cx="50" cy="88" rx="46" ry="10" fill={fill} stroke={borderSel} strokeWidth={2} />
        </svg>
        <div style={{ position:'relative', zIndex:1, marginTop:14, flex:1, display:'flex', alignItems:'center', justifyContent:'center', width:'100%', height:'100%' }}>{text}</div>
      </div>
    );
  }

  // ── TRIANGLE ─────────────────────────────────────────────────────────────
  if (shape === 'triangle') {
    return (
      <div style={{ width: '100%', height: '100%', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', position:'relative', boxSizing:'border-box' }}>
        {handles}{resizer}
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position:'absolute', inset:0 }}>
          <polygon points="50,4 96,96 4,96" fill={fill} stroke={borderSel} strokeWidth={2} />
        </svg>
        <div style={{ position:'relative', zIndex:1, marginTop:18, width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center' }}>{text}</div>
      </div>
    );
  }

  // ── CLOUD ────────────────────────────────────────────────────────────────
  if (shape === 'cloud') {
    return (
      <div style={{
        width: '100%', height: '100%',
        background: fill, border:`2px solid ${borderSel}`,
        borderRadius:'50% 50% 50% 50% / 40% 40% 60% 60%',
        boxShadow: `${shadow}, inset 0 -4px 0 rgba(0,0,0,0.1)`,
        display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', boxSizing:'border-box', position:'relative'
      }}>
        {handles}{resizer}{text}
      </div>
    );
  }

  // ── ROUNDED RECT (default) / RECT ─────────────────────────────────────────
  const radius = shape === 'rect' ? '4px' : shape === 'rounded' ? '12px' : '8px';
  return (
    <div style={{
      width: '100%', height: '100%', background: fill, border:`2px solid ${borderSel}`,
      borderRadius: radius, boxShadow: shadow,
      display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', boxSizing:'border-box', position:'relative'
    }}>
      {handles}{resizer}{text}
    </div>
  );
}

// ─── Text-only node ───────────────────────────────────────────────────────────
function TextNode({ data, selected }) {
  const resizer = selected && (
    <NodeResizer
      minWidth={40}
      minHeight={20}
      isVisible={selected}
      lineStyle={{ borderColor: '#6366f1', borderStyle: 'dashed' }}
      handleStyle={{ width: 7, height: 7, background: '#fff', border: '1.5px solid #6366f1' }}
    />
  );
  return (
    <div style={{
      padding:'4px 8px', minWidth: 80, cursor:'pointer', width:'100%', height:'100%',
      border: selected ? '1px dashed #818cf8' : '1px dashed transparent',
      borderRadius: 4, boxSizing:'border-box', position:'relative'
    }}>
      <Handle type="target" position={Position.Top}    style={{ opacity:0 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity:0 }} />
      {resizer}
      <span style={{ color: data.textColor || '#e2e8f0', fontSize: data.fontSize || 14, fontWeight: data.bold ? 700 : 400, fontStyle: data.italic ? 'italic' : 'normal', fontFamily:'inherit', width:'100%', height:'100%', display:'block', textAlign:'center' }}>
        {data.label || 'Text'}
      </span>
    </div>
  );
}

// ─── Labeled edge ─────────────────────────────────────────────────────────────
function LabeledEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, label, style={}, markerEnd }) {
  const [path, lx, ly] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });
  return (
    <>
      <BaseEdge id={id} path={path} style={style} markerEnd={markerEnd} />
      {label && (
        <EdgeLabelRenderer>
          <div style={{
            position:'absolute', transform:`translate(-50%,-50%) translate(${lx}px,${ly}px)`,
            background:'rgba(15,23,42,0.95)', border:'1px solid rgba(99,102,241,0.25)',
            color:'#94a3b8', fontSize:'10px', fontWeight:600, padding:'3px 8px',
            borderRadius:'12px', pointerEvents:'all', whiteSpace:'nowrap',
            backdropFilter:'blur(4px)',
          }} className="nodrag nopan">{label}</div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

const NODE_TYPES = { shape: ShapeNode, text: TextNode };
const EDGE_TYPES = { labeled: LabeledEdge };

// ─── Convert schema → RF nodes ────────────────────────────────────────────────
function toRFNode(n) {
  return {
    id: n.id,
    type: n.shape === 'text' ? 'text' : 'shape',
    position: { x: n.x ?? 0, y: n.y ?? 0 },
    style: { width: n.width ?? 140, height: n.height ?? 60 },
    data: {
      label: n.label ?? 'Node',
      shape: n.shape ?? 'rounded',
      icon: n.icon ?? '',
      fill: n.fill ?? '#1e293b',
      stroke: n.stroke ?? '#6366f1',
      textColor: n.textColor ?? '#f1f5f9',
      fontSize: n.fontSize ?? 13,
      width: n.width ?? 140,
      height: n.height ?? 60,
      bold: n.bold ?? false,
      italic: n.italic ?? false,
    },
  };
}

function toRFEdge(e) {
  return {
    id: e.id,
    source: e.source, target: e.target,
    type: 'labeled', label: e.label ?? '',
    animated: e.animated ?? false,
    markerEnd: e.noArrow ? undefined : { type: MarkerType.ArrowClosed, color: e.strokeColor ?? '#6366f1' },
    style: {
      stroke: e.strokeColor ?? '#4f5d7e',
      strokeWidth: e.thick ? 2.5 : 1.5,
      strokeDasharray: e.dashed ? '6 4' : undefined,
    },
  };
}

// ─── DiagramCanvas ────────────────────────────────────────────────────────────
export default function DiagramCanvas({ nodes: sNodes = [], edges: sEdges = [], onNodeSelect, onNodeMove, onNodeResize }) {
  const [rfNodes, setRfNodes, onNodesChange] = useNodesState([]);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState([]);
  const prevRef = useRef('');

  useEffect(() => {
    const key = JSON.stringify({ sNodes, sEdges });
    if (key === prevRef.current) return;
    prevRef.current = key;

    setRfNodes(sNodes.map(toRFNode));
    setRfEdges(sEdges.filter(e => e.source && e.target).map(toRFEdge));
  }, [sNodes, sEdges, setRfNodes, setRfEdges]);

  const onConnect = useCallback((params) => {
    setRfEdges(eds => addEdge({
      ...params, type:'labeled', label:'',
      markerEnd: { type: MarkerType.ArrowClosed, color:'#6366f1' },
      style: { stroke:'#4f5d7e', strokeWidth:1.5 },
    }, eds));
  }, [setRfEdges]);

  const handleNodeClick = useCallback((_, node) => {
    onNodeSelect?.(node.id, node.data);
  }, [onNodeSelect]);

  const onNodeDragStop = useCallback((_, node) => {
    onNodeMove?.(node.id, node.position.x, node.position.y);
  }, [onNodeMove]);

  const onNodeResizeStop = useCallback((_, { id, width, height }) => {
    onNodeResize?.(id, width, height);
  }, [onNodeResize]);

  if (!rfNodes.length) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', flexDirection:'column', gap:'10px', color:'#334155' }}>
        <div style={{ fontSize:'36px' }}>🎨</div>
        <div style={{ fontSize:'14px', fontWeight:600 }}>Empty canvas</div>
        <div style={{ fontSize:'12px' }}>Add shapes from the left panel or generate with AI</div>
      </div>
    );
  }

  return (
    <div style={{ width:'100%', height:'100%' }}>
      <ReactFlow
        nodes={rfNodes} edges={rfEdges}
        onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
        onConnect={onConnect} onNodeClick={handleNodeClick}
        onNodeDragStop={onNodeDragStop}
        onNodeResizeStop={onNodeResizeStop}
        nodeTypes={NODE_TYPES} edgeTypes={EDGE_TYPES}
        fitView fitViewOptions={{ padding:0.18 }}
        minZoom={0.05} maxZoom={4}
        deleteKeyCode="Delete"
        proOptions={{ hideAttribution: true }}
      >
        <Background variant="dots" gap={24} size={1.2} color="rgba(255,255,255,0.06)" />
        <Controls style={{ background:'rgba(9,13,22,0.9)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'10px', overflow:'hidden' }} />
        <MiniMap
          style={{ background:'rgba(7,10,19,0.9)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'10px' }}
          nodeColor={n => n.data?.stroke ?? '#475569'}
          maskColor="rgba(7,10,19,0.6)"
        />
      </ReactFlow>
    </div>
  );
}
