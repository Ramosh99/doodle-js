'use client';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import rough from 'roughjs/bundled/rough.esm';
import Buttons from './ButtonComponents/Button';
//import jsPDF from 'jspdf';

const generator = rough.generator({
    roughness: 0,
    strokeWidth: 3,
    stroke: 'black',
    bowing: 0,
});

function createRectangle(x1, y1, x2, y2) {
    const roughElement = generator.rectangle(x1, y1, x2 - x1, y2 - y1);
    return { type: 'rectangle', x1, y1, x2, y2, roughElement };
}

function createLine(x1, y1, x2, y2) {
    const roughElement = generator.line(x1, y1, x2, y2);
    return { type: 'line', x1, y1, x2, y2, roughElement };
}

const Canvas = () => {
    const [elements, setElements] = useState([]);
    const [drawing, setDrawing] = useState(false);
    const [panning, setPanning] = useState(false);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [mode, setMode] = useState('rectangle');//active tool
    const canvasRef = useRef(null);

    useLayoutEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.setTransform(zoom, 0, 0, zoom, pan.x, pan.y);
        ctx.clearRect(-pan.x, -pan.y, canvas.width / zoom, canvas.height / zoom);

        const roughCanvas = rough.canvas(canvas);
        elements.forEach(({ roughElement }) => roughCanvas.draw(roughElement));
    }, [elements, pan, zoom]);

    const handleMouseDown = (e) => {
        if (mode === 'grab') {
            setPanning(true);
            return;
        }

        setDrawing(true);
        const { clientX, clientY } = e;
        const x = clientX - pan.x / zoom;
        const y = clientY - pan.y / zoom;
        const element = mode === 'rectangle' ? createRectangle(x, y, x, y) : createLine(x, y, x, y);
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
        const updatedElement = mode === 'rectangle' ? createRectangle(x1, y1, x, y) : createLine(x1, y1, x, y);
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
        // saev as a json
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
                switch (type) {
                    case 'rectangle':
                        return createRectangle(x1, y1, x2, y2);
                    case 'line':
                        return createLine(x1, y1, x2, y2);
                    default:
                        return null; // Handle other types if needed
                }
            }).filter(element => element !== null); // Remove any null elements
    
            setElements(elementsToSet);
        };
    
        reader.readAsText(file);
    };
    

    return (
        <div style={{ overflow: 'hidden', width: '100vw', height: '100vh' }}>
            <Buttons handleModeChange={handleModeChange} handleSave={handleSave} handleLoad={handleLoad} mode={mode}/>
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
