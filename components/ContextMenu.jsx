'use client';
import React, { useEffect, useRef } from 'react';

export default function ContextMenu({ x, y, onClose, onDuplicate, onDelete, onBringToFront, onSendToBack, hasSelection }) {
  const menuRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  if (!hasSelection) return null;

  return (
    <div ref={menuRef} className="ctx-menu" style={{ top: y, left: x }}>
      <div className="ctx-item" onClick={() => { onDuplicate(); onClose(); }}>
        <span>⧉</span>
        <span>Duplicate</span>
        <span className="ctx-hint">Ctrl+D</span>
      </div>

      <div className="ctx-sep" />

      <div className="ctx-item" onClick={() => { onBringToFront(); onClose(); }}>
        <span>↑</span>
        <span>Bring to Front</span>
      </div>
      <div className="ctx-item" onClick={() => { onSendToBack(); onClose(); }}>
        <span>↓</span>
        <span>Send to Back</span>
      </div>

      <div className="ctx-sep" />

      <div className="ctx-item danger" onClick={() => { onDelete(); onClose(); }}>
        <span>🗑</span>
        <span>Delete</span>
        <span className="ctx-hint">Del</span>
      </div>
    </div>
  );
}
