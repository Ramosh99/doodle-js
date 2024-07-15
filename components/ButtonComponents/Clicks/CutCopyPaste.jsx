import React, { useEffect, useState } from 'react';

function CutCopyPaste({ elements, activeElem, setElements, setActiveElem, setUndoStack, setRedoStack, clipboard, setClipboard, canvasRef, zoom, pan }) {
    const [mousePosition, setMousePosition] = useState(null);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.ctrlKey && e.key === 'c') {
                copyElements();
            } else if (e.ctrlKey && e.key === 'x') {
                cutElements();
            } else if (e.ctrlKey && e.key === 'v') {
                pasteElements();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [activeElem, clipboard, elements, mousePosition]);

    const handleMouseDown = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left - pan.x) / zoom;
        const y = (e.clientY - rect.top - pan.y) / zoom;
        setMousePosition({ x, y });
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        canvas.addEventListener('mousedown', handleMouseDown);
        return () => {
            canvas.removeEventListener('mousedown', handleMouseDown);
        };
    }, []);

    const copyElements = () => {
        if (activeElem.length > 0) {
            setClipboard(activeElem);
        }
    };

    const cutElements = () => {
        if (activeElem.length > 0) {
            setClipboard(activeElem);
            const remainingElements = elements.filter(element => !activeElem.includes(element));
            setUndoStack((prev) => [...prev, elements]);
            setRedoStack([]);
            setElements(remainingElements);
            setActiveElem([]);
        }
    };

    const pasteElements = () => {
        if (clipboard.length > 0 && mousePosition) {
            const offsetX = mousePosition.x - clipboard[0].x1;
            const offsetY = mousePosition.y - clipboard[0].y1;
            const pastedElements = clipboard.map(element => ({
                ...element,
                x1: element.x1 + offsetX,
                y1: element.y1 + offsetY,
                x2: element.x2 + offsetX,
                y2: element.y2 + offsetY,
            }));
            setUndoStack((prev) => [...prev, elements]);
            setRedoStack([]);
            setElements((prev) => [...prev, ...pastedElements]);
            setActiveElem(pastedElements);
        }
    };

    return null;
}

export default CutCopyPaste;
