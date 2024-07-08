'use client';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import rough from 'roughjs/bundled/rough.esm';
import Buttons from './ButtonComponents/Button';
import { ElementType, Rectangle, Line } from '../components/Types/types';
import Selectors from './selctors';
import { findElement } from './ButtonComponents/Clicks/Transform';


const generator = rough.generator({
  roughness: 0,
  strokeWidth: 3,
  stroke: "black",
  bowing: 0,
});
//----------selection and move---------
let starx; //x value of mouse down
let stary; //y value of mouse down
let currentSelectedIndex = null;
let isDragging = false;

//-------------selection and move-----------

const createElement = {
  [ElementType.RECTANGLE]: (x1, y1, x2, y2) => {
    const roughElement = generator.rectangle(x1, y1, x2 - x1, y2 - y1);
    return new Rectangle(x1, y1, x2, y2, roughElement);
  },
  [ElementType.LINE]: (x1, y1, x2, y2) => {
    const roughElement = generator.line(x1, y1, x2, y2);
    return new Line(x1, y1, x2, y2, roughElement);
  },
};

const Canvas = () => {
    
    const [elements, setElements] = useState([]);//all elements in canvas
    const [activeElem,setActiveElem] = useState([])//selected elements
    const [drawing, setDrawing] = useState(false);
    const [panning, setPanning] = useState(false);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [mode, setMode] = useState("grab");//active element / current using
    const canvasRef = useRef(null);

  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);


    //Canvas initialization
    useLayoutEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.setTransform(zoom, 0, 0, zoom, pan.x, pan.y);
        ctx.clearRect(-pan.x, -pan.y, canvas.width / zoom, canvas.height / zoom);
        const roughCanvas = rough.canvas(canvas);
        elements.forEach(({ roughElement }) => roughCanvas.draw(roughElement));
      }, [elements, pan, zoom]);


  function getOffSet() {
    const canvas = canvasRef.current;
    let canvasOffset = canvas.getBoundingClientRect();
    offSetX = canvasOffset.left;
    offSetY = canvasOffset.top;
    console.log("offx,offy", offSetX, offSetY);
  }
  //check mouse pointer is on the rectangle
  function isMouseOnRectangle(x, y, shape) {
    let shapeLeft = shape.x1;
    let shapeRight = shape.x2;
    let shapeTop = shape.y1;
    let shapeBottom = shape.y2;
    if (x > shapeLeft && x < shapeRight && y > shapeTop && y < shapeBottom) {
      return true;
    } else {
      return false;
    }
  }

  //for identify mouse click is inside the shape
  function isMouseInShape(x, y, shape) {
    if (shape.type == "rectangle") {
      return isMouseOnRectangle(x, y, shape);
    } else if (shape.type == "line") {
      return isMouseOnLineSegment(x, y, shape.x1, shape.y1, shape.x2, shape.y2);
    }
  }

  function selectTheShapeMouseDown(startX, startY) {
    //select the clicked shape
    starx = startX;
    stary = startY;

    let index = 0;
    for (let shape of elements) {
      if (isMouseInShape(startX, startY, shape)) {
        currentSelectedIndex = index;
        isDragging = true;
        return;
      } else {
        isDragging = false;
      }
      index++;
    }
  }

  const updateShapeCordinates = (index, newX1, newY1, newx2, newy2) => {
    // Ensure the index is within the bounds of the elements array
    if (index < 0 || index >= elements.length) {
      console.error("Index out of bounds");
      return;
    }

    // Create a copy of the elements array
    const newElements = [...elements];

    // Update the coordinates of the specified rectangle
    if (elements[currentSelectedIndex].type == "rectangle") {
      const updatedRectangle = {
        ...newElements[index],
        x1: newX1,
        y1: newY1,
        x2: newx2,
        y2: newy2,
        roughElement: generator.rectangle(
          newX1,
          newY1,
          newx2 - newX1,
          newy2 - newY1
        ),
      };

      // Replace the old rectangle with the updated one
      newElements[index] = updatedRectangle;

      // Update the state with the new array
      setElements(newElements);
    } else if (elements[currentSelectedIndex].type == "line") {
      const updatedLine = {
        ...newElements[index],
        x1: newX1,
        y1: newY1,
        x2: newx2,
        y2: newy2,
        roughElement: generator.line(newX1, newY1, newx2, newy2),
      };

      // Replace the old rectangle with the updated one
      newElements[index] = updatedLine;

      // Update the state with the new array
      setElements(newElements);
    }
  };

  function selectTheShapeMove(mouseX, mouseY) {
    if (!isDragging) {
      return;
    } else if (isDragging) {
      let dx = mouseX - starx;
      let dy = mouseY - stary;

      let newx1 = elements[currentSelectedIndex].x1 + dx;
      let newy1 = elements[currentSelectedIndex].y1 + dy;
      let newx2 = elements[currentSelectedIndex].x2 + dx;
      let newy2 = elements[currentSelectedIndex].y2 + dy;

      updateShapeCordinates(
        currentSelectedIndex,
        newx1,
        newy1,
        newx2,
        newy2
      );

      starx = mouseX;
      stary = mouseY;
    }
  }
  function selectTheShapeMouseUp() {
    if (!isDragging) {
      return;
    }
    isDragging = false;
  }
  function selectTheRectangleMouseOut() {
    if (!isDragging) {
      return;
    }
    isDragging = false;
  }


  //check mouse pointer is on the line
  function isMouseOnLineSegment(mouseX, mouseY, x1, y1, x2, y2, tolerance = 5) {
    // Calculate distance between the point and the two ends of the line
    const distanceFromP1 = Math.sqrt((mouseX - x1) ** 2 + (mouseY - y1) ** 2);
    const distanceFromP2 = Math.sqrt((mouseX - x2) ** 2 + (mouseY - y2) ** 2);

    // Calculate the total length of the line segment
    const lineLength = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    // Check if the point is close enough to the line segment within the tolerance
    return (
      distanceFromP1 + distanceFromP2 >= lineLength - tolerance &&
      distanceFromP1 + distanceFromP2 <= lineLength + tolerance
    );
  }
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'r') {
                e.preventDefault(); // Prevent browser default behavior (like undoing text input)
                handleModeChange('rectangle');
            } else if (e.key === 'l') {
                e.preventDefault(); 
                handleModeChange('line');
            }else if (e.key === 'h') {
                e.preventDefault(); 
                handleModeChange('grab');
            }else if (e.key === 'v') {
                e.preventDefault(); 
                handleModeChange('select');
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [elements]); 

    const handleMouseDown = (e) => {
        if (mode === 'grab') {
            setPanning(true);
            return;
        }else if(mode === 'select'){
            const x = e.nativeEvent.offsetX;
            const y = e.nativeEvent.offsetY;
            selectTheShapeMouseDown(parseInt(e.clientX), parseInt(e.clientY));
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
        if (mode == "select") {
          selectTheShapeMove(parseInt(e.clientX), parseInt(e.clientY));
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
        if (mode === "select") {
          selectTheShapeMouseUp();
        }
    };

    const handleWheel = (e) => {
        const zoomFactor = 1.1;
        const newZoom = e.deltaY < 0 ? zoom * zoomFactor : zoom / zoomFactor;
        setZoom(newZoom);
    };

    const handleModeChange = (newMode) => {
        setMode(newMode);
    };

    
    //File handling------------------------------------------------------------------------------
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

    // Check if the point is close enough to the line segment within the tolerance
    return (
        <div style={{ overflow: 'hidden', width: '100vw', height: '100vh' }}>
            <Buttons 
                handleModeChange={handleModeChange} 
                handleLoad={handleLoad} 
                mode={mode} 
                setElements={setElements}
                undoStack={undoStack} 
                redoStack={redoStack}
                setUndoStack={setUndoStack}
                setRedoStack={setRedoStack}
                elements={elements}
                />
            <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
                onWheel={handleWheel}
                width={window.innerWidth}
                height={window.innerHeight}
                style={{ cursor: mode === 'grab' ? 'grab' : mode==='select'?'auto':'crosshair' }}
            />

            {/* ---- helper selectors around an active element --------------- */}
            {activeElem.length>0 && mode==='select'?
                <Selectors 
                    x1={activeElem[0].x1} 
                    x2={activeElem[0].x2} 
                    y1={activeElem[0].y1} 
                    y2={activeElem[0].y2}
                ></Selectors>
            :''}
        </div>
    );
  }

  

 

 
 

 



export default Canvas;
