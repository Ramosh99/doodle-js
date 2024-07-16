import React, { useEffect, useState } from 'react';

function CutCopyPaste({ elements, activeElem, setElements, setActiveElem, setUndoStack, setRedoStack,
     clipboard, setClipboard, mousePosition }) {

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

    const copyElements = () => {
        if (activeElem.length > 0) {
            setClipboard(activeElem);
            console.log('clipboard', activeElem);
            console.log('elements', elements);
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
            console.log('pastedElements', pastedElements);
            setUndoStack((prev) => [...prev, elements]);
            setRedoStack([]);
            setElements((prev) => {
                const updatedElements = [...prev, ...pastedElements];
                console.log('updated elements', updatedElements);
                return updatedElements;
            });
            setActiveElem(pastedElements);
        }
    };

    return null;
}

export default CutCopyPaste;
