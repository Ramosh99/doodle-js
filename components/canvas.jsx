'use client';

import React, {  useEffect, useLayoutEffect, useRef, useState } from 'react';
import { RoughCanvas } from 'roughjs/bin/canvas';
import rough from 'roughjs/bundled/rough.esm';

const generator = rough.generator();

function createElement(x1, y1, x2, y2) {
    const roughElement = generator.rectangle(x1, y1, x2-x1, y2-y1);
    // const roughElement = generator.line(x1, y1, x2, y2);
    return {x1, y1, x2, y2, roughElement};

}

const Canvas = () => {
    
    const [Element, setElement] = useState([]);
    const [Drawing, setDrawing] = useState(false);

    useLayoutEffect(() => {
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

        const roughCanvas = rough.canvas(canvas);

        // const line = generator.line(10, 10, 200, 100);
        // const rectangle = generator.rectangle(10, 10, 200, 200);
        // const circle = generator.circle(120, 120, 50);
        // roughCanvas.draw(line);
        // roughCanvas.draw(rectangle);
        // roughCanvas.draw(circle);

        Element.forEach(({roughElement}) => roughCanvas.draw(roughElement));


    }, [Element]);


    //catch moments
    const handleMouseDown = (e) => {
        setDrawing(true);
    
        const {clientX, clientY} = e;
        
        const elementIs = createElement(clientX, clientY, clientX, clientY);
    
        // Pushing element to array correctly
        setElement((prev) => [...prev, elementIs]);
    };
    const handleMouseMove = (e) => {
        if (!Drawing) return;

        const {clientX, clientY} = e;
        const index = Element.length-1;
        const {x1, y1} = Element[index];
        const Update_Element = createElement(x1, y1, clientX, clientY);
        
        //taking copy of existing element
        const elementsCopy = [...Element];
        elementsCopy[index] = Update_Element;
        setElement(elementsCopy);

        // const {clientX, clientY} = e;
        console.log(clientX, clientY);
    };
    const handleMouseUp = () => {
        setDrawing(false);
    };


  return (
    <div>
      <canvas id='canvas' onMouseDown={handleMouseDown} onMouseUp={handleMouseUp} onMouseMove={handleMouseMove}  width={window.innerWidth} height={window.innerHeight}></canvas>
    </div>
  );
};

export default Canvas;