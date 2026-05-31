import React, { useEffect, useRef } from 'react'

export default function Text({ prop: element, isEditing, onChange, onFinishEditing }) {
  const textareaRef = useRef(null);
  const left = typeof element.x1 === 'number' ? element.x1 : (element.x || 0);
  const top = typeof element.y1 === 'number' ? element.y1 : (element.y || 0);
  const width = typeof element.x2 === 'number' && typeof element.x1 === 'number'
    ? Math.max(80, element.x2 - element.x1)
    : 200;
  const height = typeof element.y2 === 'number' && typeof element.y1 === 'number'
    ? Math.max(28, element.y2 - element.y1)
    : 36;
  const content = element.text !== undefined ? element.text : '';

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      // Select all if it's default 'Type'
      if (textareaRef.current.value === 'Type') {
        textareaRef.current.select();
      }
    }
  }, [isEditing]);

  if (isEditing) {
    return (
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onFinishEditing}
        onKeyDown={(e) => {
          if (e.key === 'Escape' || (e.key === 'Enter' && !e.shiftKey)) {
            e.preventDefault();
            onFinishEditing();
          }
        }}
        placeholder="Type something..."
        style={{
          position: 'absolute',
          left: `${left}px`,
          top: `${top}px`,
          fontSize: '16px',
          width: `${width}px`,
          height: `${height}px`,
          border: '1.5px dashed #09ceff',
          borderRadius: '4px',
          background: 'rgba(255, 255, 255, 0.95)',
          color: '#333',
          resize: 'none',
          outline: 'none',
          padding: '4px',
          boxSizing: 'border-box',
          zIndex: 1000,
          fontFamily: 'inherit',
          boxShadow: '0 0 6px rgba(9, 206, 255, 0.3)'
        }}
      />
    );
  }

  return (
    <textarea 
      readOnly
      value={content || 'Type'}
      style={{
        position: 'absolute',
        left: `${left}px`,
        top: `${top}px`,
        fontSize: '16px',
        width: `${width}px`,
        height: `${height}px`,
        border: 'none',
        background: 'transparent',
        resize: 'none',
        overflow: 'hidden',
        pointerEvents: 'none',
        color: '#333',
        padding: '4px',
        boxSizing: 'border-box',
        zIndex: 5,
        fontFamily: 'inherit',
      }}
    />
  );
}
