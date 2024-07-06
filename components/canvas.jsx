'use client'; 
import React, {useLayoutEffect, useRef, useState } from 'react';
import rough from 'roughjs/bundled/rough.esm'; // Import rough.js for sketchy drawing
import Buttons from './ButtonComponents/Button'; // Importing the Buttons component



// Configure rough generator with smooth lines
const generator = rough.generator({
    roughness: 0, // No roughness for smooth lines
    strokeWidth: 3, // Thicker lines for better visibility
    stroke: 'black', // Line color
    bowing: 0, // No bowing for straight lines
});

// Function to create a rectangle with rough.js
function createRectangle(x1, y1, x2, y2) {
    const roughElement = generator.rectangle(x1, y1, x2 - x1, y2 - y1);
    return { x1, y1, x2, y2, roughElement };
}

// Function to create a line with rough.js
function createLine(x1, y1, x2, y2) {
    const roughElement = generator.line(x1, y1, x2, y2);
    return { x1, y1, x2, y2, roughElement };
}

// Main Canvas component
const Canvas = () => {
    const [elements, setElements] = useState([]); // State to store drawn elements
    const [drawing, setDrawing] = useState(false); // State to indicate drawing state
    const [panning, setPanning] = useState(false); // State to indicate panning state
    const [pan, setPan] = useState({ x: 0, y: 0 }); // State to store panning offset
    const [zoom, setZoom] = useState(1); // State to store zoom level
    const [mode, setMode] = useState('rectangle'); // State to store current drawing mode
    const canvasRef = useRef(null); // Reference to the canvas element

    // Effect to redraw the canvas when elements, pan, or zoom change
    useLayoutEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.setTransform(zoom, 0, 0, zoom, pan.x, pan.y);
        ctx.clearRect(-pan.x, -pan.y, canvas.width / zoom, canvas.height / zoom);

        const roughCanvas = rough.canvas(canvas);
        elements.forEach(({ roughElement }) => roughCanvas.draw(roughElement));
    }, [elements, pan, zoom]);

    // Handle mouse down event for drawing or panning
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

    // Handle mouse move event for updating drawing or panning
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

    // Handle mouse up event to stop drawing or panning
    const handleMouseUp = () => {
        setDrawing(false);
        setPanning(false);
    };

    // Handle mouse wheel event to zoom in and out
    const handleWheel = (e) => {
        const zoomFactor = 1.1;
        const newZoom = e.deltaY < 0 ? zoom * zoomFactor : zoom / zoomFactor;
        setZoom(newZoom);
    };

    // Handle mode change (rectangle/line/grab)
    const handleModeChange = (newMode) => {
        setMode(newMode);
    };

    return (
        <div style={{ overflow: 'hidden', width: '100vw', height: '100vh' }}>
            <Buttons handleModeChange={handleModeChange} /> {/* Render Buttons component for mode selection */}
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
