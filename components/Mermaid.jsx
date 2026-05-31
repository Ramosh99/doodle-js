'use client';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import mermaid from 'mermaid';

let renderCounter = 0;

function getRenderId() {
  renderCounter++;
  return `mermaid-render-${renderCounter}`;
}

function cleanupMermaidNode(id) {
  // Mermaid adds hidden nodes to the body; remove them after render
  ['', 'd'].forEach(prefix => {
    const el = document.getElementById(`${prefix}${id}`);
    if (el) el.remove();
  });
}

function initMermaid(theme) {
  const themeVars =
    theme === 'dark'
      ? {
          background: '#0d1117',
          primaryColor: '#6366f1',
          primaryTextColor: '#e2e8f0',
          primaryBorderColor: '#4f46e5',
          lineColor: '#94a3b8',
          secondaryColor: '#1e293b',
          tertiaryColor: '#0f172a',
          noteBkgColor: '#1e1b4b',
          noteTextColor: '#c7d2fe',
          activationBkgColor: '#1e293b',
        }
      : theme === 'forest'
      ? { primaryColor: '#22c55e', lineColor: '#4b5563' }
      : undefined;

  mermaid.initialize({
    startOnLoad: false,
    theme,
    securityLevel: 'loose',
    fontFamily: 'SFMono-Regular, Consolas, "Courier New", monospace',
    logLevel: 'error',
    suppressErrorRendering: false,
    flowchart: { useMaxWidth: false, htmlLabels: true, curve: 'basis' },
    sequence: { useMaxWidth: false, actorMargin: 60, showSequenceNumbers: true },
    er: { useMaxWidth: false },
    mindmap: { useMaxWidth: false },
    ...(themeVars ? { themeVariables: themeVars } : {}),
  });
}

export default function Mermaid({ chartCode, theme = 'dark' }) {
  const [svgContent, setSvgContent] = useState('');
  const [error, setError] = useState(null);
  const [isRendering, setIsRendering] = useState(false);
  const debounceRef = useRef(null);
  const lastRenderIdRef = useRef(null);

  const render = useCallback(async (code, currentTheme) => {
    if (!code || !code.trim()) return;

    setIsRendering(true);
    setError(null);

    // Clean up previous render's orphaned nodes
    if (lastRenderIdRef.current) {
      cleanupMermaidNode(lastRenderIdRef.current);
    }

    const renderId = getRenderId();
    lastRenderIdRef.current = renderId;

    try {
      initMermaid(currentTheme);
      const { svg } = await mermaid.render(renderId, code.trim());
      setSvgContent(svg);
      setError(null);
    } catch (err) {
      cleanupMermaidNode(renderId);
      // Extract the meaningful part of the error
      const msg = (err?.message || String(err))
        .replace(/^Error:\s*/i, '')
        .split('\n')
        .slice(0, 6)
        .join('\n');
      setError(msg);
      setSvgContent('');
    } finally {
      setIsRendering(false);
    }
  }, []);

  useEffect(() => {
    // Debounce: wait 400ms after last keystroke before re-rendering
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      render(chartCode, theme);
    }, 400);

    return () => clearTimeout(debounceRef.current);
  }, [chartCode, theme, render]);

  if (error) {
    return (
      <div
        style={{
          backgroundColor: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          borderRadius: '10px',
          padding: '20px 24px',
          color: '#fca5a5',
          fontFamily: 'SFMono-Regular, Consolas, "Courier New", monospace',
          fontSize: '12.5px',
          whiteSpace: 'pre-wrap',
          lineHeight: '1.6',
          maxWidth: '680px',
          margin: '40px auto',
          boxShadow: '0 4px 24px rgba(239, 68, 68, 0.06)',
        }}
      >
        <div
          style={{
            fontWeight: '700',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#f87171',
            fontSize: '13px',
          }}
        >
          <span>⚠️</span> Mermaid Compilation Error:
        </div>
        <div style={{ opacity: 0.85 }}>{error}</div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        minHeight: '300px',
        padding: '32px',
        boxSizing: 'border-box',
        position: 'relative',
      }}
    >
      {/* Subtle loading overlay when re-rendering */}
      {isRendering && svgContent && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(7, 10, 19, 0.4)',
            borderRadius: '8px',
            zIndex: 5,
          }}
        >
          <div
            style={{
              width: '20px',
              height: '20px',
              border: '2px solid rgba(255,255,255,0.12)',
              borderLeftColor: '#6366f1',
              borderRadius: '50%',
              animation: 'mermaid-spin 0.75s linear infinite',
            }}
          />
          <style>{`@keyframes mermaid-spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {/* Initial loading state (no SVG yet) */}
      {isRendering && !svgContent && (
        <div style={{ textAlign: 'center', color: '#64748b' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              border: '3px solid rgba(255,255,255,0.08)',
              borderLeftColor: '#6366f1',
              borderRadius: '50%',
              animation: 'mermaid-spin 0.75s linear infinite',
              margin: '0 auto 12px',
            }}
          />
          <style>{`@keyframes mermaid-spin{to{transform:rotate(360deg)}}`}</style>
          <span style={{ fontSize: '13px' }}>Compiling diagram…</span>
        </div>
      )}

      {/* Rendered SVG */}
      {svgContent && (
        <div
          dangerouslySetInnerHTML={{ __html: svgContent }}
          style={{ opacity: isRendering ? 0.5 : 1, transition: 'opacity 0.2s ease' }}
        />
      )}
    </div>
  );
}
