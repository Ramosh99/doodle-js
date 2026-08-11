import React, { useEffect, useRef } from 'react'

/**
 * Text overlay positioned in screen space using the same
 * canvas transform as useLayoutEffect in canvas.jsx:
 *   screenX = canvasX * zoom + pan.x * zoom - ZoomOffset.x
 *   screenY = canvasY * zoom + pan.y * zoom - ZoomOffset.y
 */
export default function Text({ prop: element, isEditing, onChange, onFinishEditing, zoom = 1, pan = { x: 0, y: 0 }, ZoomOffset = { x: 0, y: 0 } }) {
  const textareaRef = useRef(null);

  const cx1 = typeof element.x1 === 'number' ? element.x1 : (element.x || 0);
  const cy1 = typeof element.y1 === 'number' ? element.y1 : (element.y || 0);
  const cx2 = typeof element.x2 === 'number' ? element.x2 : cx1 + 200;
  const cy2 = typeof element.y2 === 'number' ? element.y2 : cy1 + 36;

  // Apply the same transform as the canvas context
  const left   = cx1 * zoom + pan.x * zoom - ZoomOffset.x;
  const top    = cy1 * zoom + pan.y * zoom - ZoomOffset.y;
  const width  = Math.max(40, (cx2 - cx1) * zoom);
  const height = Math.max(18, (cy2 - cy1) * zoom);
  const fontSize = Math.max(9, Math.round(14 * zoom));

  const content = element.text !== undefined ? element.text : '';

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      if (textareaRef.current.value === 'Type') textareaRef.current.select();
    }
  }, [isEditing]);

  const baseStyle = {
    position: 'absolute',
    left:   `${left}px`,
    top:    `${top}px`,
    width:  `${width}px`,
    height: `${height}px`,
    fontSize: `${fontSize}px`,
    fontWeight: 'normal',
    textAlign: 'center',
    padding: '2px 4px',
    boxSizing: 'border-box',
    fontFamily: 'Georgia, serif',
    resize: 'none',
    overflow: 'hidden',
    lineHeight: 1.35,
  };

  if (isEditing) {
    return (
      <textarea
        ref={textareaRef}
        value={content}
        onChange={e => onChange(e.target.value)}
        onBlur={onFinishEditing}
        onKeyDown={e => {
          if (e.key === 'Escape' || (e.key === 'Enter' && !e.shiftKey)) {
            e.preventDefault();
            onFinishEditing();
          }
        }}
        placeholder="Type something..."
        style={{
          ...baseStyle,
          border: '1.5px dashed #09ceff',
          borderRadius: '4px',
          background: 'rgba(255,255,255,0.95)',
          color: '#1e293b',
          outline: 'none',
          zIndex: 1000,
          boxShadow: '0 0 6px rgba(9,206,255,0.3)',
        }}
      />
    );
  }

  return (
    <textarea
      readOnly
      value={content || 'Type'}
      style={{
        ...baseStyle,
        border: 'none',
        background: 'transparent',
        color: '#1e293b',
        pointerEvents: 'none',
        zIndex: 5,
      }}
    />
  );
}
