'use client';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import rough from 'roughjs/bundled/rough.esm';
import Buttons from './ButtonComponents/Button';
import { ElementType, Rectangle, Line } from '../components/Types/types';
//import jsPDF from 'jspdf';

const generator = rough.generator({
    roughness: 0,
    strokeWidth: 3,
    stroke: 'black',
    bowing: 0,
});

const createElement = {
    [ElementType.RECTANGLE]: (x1, y1, x2, y2) => {
        const roughElement = generator.rectangle(x1, y1, x2 - x1, y2 - y1);
        return new Rectangle(x1, y1, x2, y2, roughElement);
    },
    [ElementType.LINE]: (x1, y1, x2, y2) => {
        const roughElement = generator.line(x1, y1, x2, y2);
        return new Line(x1, y1, x2, y2, roughElement);
    }

};

const Canvas = () => {
    const [elements, setElements] = useState([]);
    const [drawing, setDrawing] = useState(false);
    const [panning, setPanning] = useState(false);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [mode, setMode] = useState(ElementType.RECTANGLE);//active tool
    const canvasRef = useRef(null);

    const [undoStack, setUndoStack] = useState([]);
    const [redoStack, setRedoStack] = useState([]);

    useLayoutEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.setTransform(zoom, 0, 0, zoom, pan.x, pan.y);
        ctx.clearRect(-pan.x, -pan.y, canvas.width / zoom, canvas.height / zoom);

        const roughCanvas = rough.canvas(canvas);
        elements.forEach(({ roughElement }) => roughCanvas.draw(roughElement));
    }, [elements, pan, zoom]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.ctrlKey && e.key === 'z') {
                e.preventDefault(); // Prevent browser default behavior (like undoing text input)
                handleUndo();
            } else if (e.ctrlKey && e.key === 'y') {
                e.preventDefault(); // Prevent browser default behavior (like redoing text input)
                handleRedo();
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [elements]); // Include elements as a dependency to update listener when elements change
    

    const handleMouseDown = (e) => {
        if (mode === 'grab') {
            setPanning(true);
            return;
        }

        // Save current state to undo stack before starting to draw
        setUndoStack((prev) => [...prev, elements]);
        setRedoStack([]); // Clear the redo stack as we're starting a new action

        setDrawing(true);
        const { clientX, clientY } = e;
        const x = clientX - pan.x / zoom;
        const y = clientY - pan.y / zoom;

        const element = createElement[mode](x, y, x, y);
        setElements((prev) => [...prev, element]);
    };

    const handleMouseMove = (e) => {
        if (panning) {
            setPan((prevPan) => ({
                x: prevPan.x + e.movementX,
                y: prevPan.y + e.movementY,
            }));
            return;
        }

        if (!drawing) return;

        const { clientX, clientY } = e;
        const x = clientX - pan.x / zoom;
        const y = clientY - pan.y / zoom;
        const index = elements.length - 1;
        const { x1, y1 } = elements[index];
        const updatedElement = createElement[mode](x1, y1, x, y);
        const elementsCopy = [...elements];
        elementsCopy[index] = updatedElement;
        setElements(elementsCopy);
    };

    const handleMouseUp = () => {
        setDrawing(false);
        setPanning(false);
    };

    const handleWheel = (e) => {
        const zoomFactor = 1.1;
        const newZoom = e.deltaY < 0 ? zoom * zoomFactor : zoom / zoomFactor;
        setZoom(newZoom);
    };

    const handleModeChange = (newMode) => {
        setMode(newMode);
    };

    const handleSave = () => {
        const json = JSON.stringify(elements);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'canvas.json';
        link.click();
    };

    const handleLoad = (event) => {
        const file = event.target.files[0];
        if (!file) return;
    
        const reader = new FileReader();
        reader.onload = (e) => {
            const json = e.target.result;
            const loadedElements = JSON.parse(json);
    
            // Map loaded elements to their corresponding shapes
            const elementsToSet = loadedElements.map(({ type, x1, y1, x2, y2 }) => {
                return createElement[type](x1, y1, x2, y2);
            }).filter(element => element !== null); // Remove any null elements
    
            setElements(elementsToSet);
        };
    
        reader.readAsText(file);
    };

    const handleUndo = () => {
        if (undoStack.length  === 0) return;
        const newElements = undoStack[undoStack.length - 1];
        setRedoStack((prev) => [...prev, elements]);
        setUndoStack((prev) => prev.slice(0, prev.length - 1));
        setElements(newElements);
    };

    const handleRedo = () => {
        if (redoStack.length === 0) return;
        const newElements = redoStack[redoStack.length - 1];
        setUndoStack((prev) => [...prev, elements]);
        setRedoStack((prev) => prev.slice(0, prev.length - 1));
        setElements(newElements);
    };
    

    return (
        <div style={{ overflow: 'hidden', width: '100vw', height: '100vh' }}>
            <Buttons 
                handleModeChange={handleModeChange} 
                handleSave={handleSave} 
                handleLoad={handleLoad} 
                mode={mode} 
                handleUndo={handleUndo} 
                handleRedo={handleRedo} 
                undoStack={undoStack} 
                redoStack={redoStack}
                />
            <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
                onWheel={handleWheel}
                width={window.innerWidth}
                height={window.innerHeight}
                style={{ cursor: mode === 'grab' ? 'grab' : 'crosshair' }}
            />
        </div>
    );
};

export default Canvas;
