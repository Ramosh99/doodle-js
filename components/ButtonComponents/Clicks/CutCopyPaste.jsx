import React, { useEffect, useState } from 'react';
import { createElement } from './Shapes';
import { ElementType } from '../../Types/types';

function CutCopyPaste({ elements, activeElem, setElements, setActiveElem, setUndoStack, setRedoStack, clipboard, setClipboard, mousePosition }) {

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
            const pastedElements = clipboard.map(element => {
                const { type, x1, y1, x2, y2, roughElement, points } = element;
                if (type === ElementType.PAINT_BRUSH) {
                    const newPoints = points.map(point => ({ x: point.x + offsetX, y: point.y + offsetY }));
                    return createElement[type](x1 + offsetX, y1 + offsetY, x2 + offsetX, y2 + offsetY, newPoints);
                } else {
                    return createElement[type](x1 + offsetX, y1 + offsetY, x2 + offsetX, y2 + offsetY, roughElement.options.fill, roughElement.options.stroke);
                }
            });
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
