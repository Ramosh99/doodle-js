'use client';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import rough from 'roughjs/bundled/rough.esm';
import Buttons from './ButtonComponents/Button';
import Selectors from './selctors';
import { findElement } from './ButtonComponents/Clicks/Transform';
import Shapes, { createElement } from './ButtonComponents/Clicks/Shapes';
import { selectTheShapeMove,selectTheShapeMouseDown,selectTheShapeMouseUp } from './ButtonComponents/Clicks/Move';
import Color from './ButtonComponents/Color';
import Delete from './ButtonComponents/Clicks/Delete';



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
  
  //----selection and move
  const [starx,setStarx]=useState(null);
  const [stary,setStary]=useState(null);
  const [currentSelectedIndex,setCurrentSelectedIndex]=useState(null);
  const [isDragging,setIsDragging]=useState(false);
  const [isResizing,setIsResizing]=useState(false); 
  const [resizingPoint,setResizingPoint]=useState("");  //for identify the clicked point of resizing shape

  //---------------------------------

  //------color initilization--------------
  const [activeColor, setActiveColor] = useState('');
  const [activeStrokeColor,setActiveStrokeColor]=useState('black');
  
  //--------------------------------

  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    // Update the dimensions state with the window dimensions
    setDimensions({ width: window.innerWidth, height: window.innerHeight });

    // Optional: Handle window resize
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };

    window.addEventListener('resize', handleResize);

    // Cleanup function to remove the event listener
    return () => window.removeEventListener('resize', handleResize);
  }, []); // Empty dependency array means this effect runs once on mount


    //Canvas initialization
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
        }else if(mode === 'select'){
            const x = e.nativeEvent.offsetX;
            const y = e.nativeEvent.offsetY;
            selectTheShapeMouseDown(
              parseInt(e.clientX), 
              parseInt(e.clientY),
              setStarx,
              setStary,
              setIsDragging,
              setCurrentSelectedIndex,

              setActiveElem,activeElem,elements,currentSelectedIndex,resizingPoint,isResizing,setIsResizing,activeColor,activeStrokeColor);
              setUndoStack((prev) => [...prev, elements]);
              setRedoStack([]);
          return;
        }

        // Save current state to undo stack before starting to draw
        setUndoStack((prev) => [...prev, elements]);
        setRedoStack([]); // Clear the redo stack as we're starting a new action

        setDrawing(true);
        const { clientX, clientY } = e;
        const x = clientX - pan.x / zoom;
        const y = clientY - pan.y / zoom;
        const element = createElement[mode](x, y, x, y,activeColor,activeStrokeColor);
        
        setElements((prev) => [...prev, element]);
  
    };

    const handleMouseMove = (e) => {
        if (panning) {
          setPan((prevPan) => ({
            x: prevPan.x + e.movementX,
            y: prevPan.y + e.movementY,
          }));
          setActiveElem([])
          return;
        }
        if (mode === 'select') {
          selectTheShapeMove(
            parseInt(e.clientX),
            parseInt(e.clientY),
            isDragging,
            starx,
            stary,
            currentSelectedIndex,
            elements,
            setActiveElem,
            setElements,
            setStarx,
            setStary,
            setUndoStack,
            setRedoStack,
            resizingPoint,
            isResizing,
            setIsResizing,
            activeColor,
            activeStrokeColor
          );
          return;
        }
      
        if (!drawing) return;
      
        const { clientX, clientY } = e;
        const x = clientX - pan.x / zoom;
        const y = clientY - pan.y / zoom;
        const index = elements.length - 1;
        const { x1, y1 } = elements[index];
        const updatedElement = createElement[mode](x1, y1, x, y,activeColor,activeStrokeColor);
        if (updatedElement === null) return;
        const elementsCopy = [...elements];
        elementsCopy[index] = updatedElement;
        setElements(elementsCopy);
      };
      

    const handleMouseUp = () => {
        setDrawing(false);
        setPanning(false);
        if (mode === "select") {
          selectTheShapeMouseUp(isDragging,setIsDragging,setUndoStack,elements,isResizing,setIsResizing,activeColor,activeStrokeColor);
        }
               
    };

    //------------------------------------------------zooming option--------------------------------
    // const handleWheel = (e) => {
    //     const zoomFactor = 1.1;
    //     const newZoom = e.deltaY < 0 ? zoom * zoomFactor : zoom / zoomFactor;
    //     setZoom(newZoom);
    // };

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
                return createElement[type](x1, y1, x2, y2,activeColor,activeStrokeColor);
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
                canvasRef={canvasRef}
                setElements={setElements}
                undoStack={undoStack} 
                redoStack={redoStack}
                setUndoStack={setUndoStack}
                setRedoStack={setRedoStack}
                elements={elements}
                setActiveElem={setActiveElem}
                />
            <Color currentSelectedIndex={currentSelectedIndex} elements={elements} setElements={setElements} activeElem={activeElem} setActiveElem={setActiveElem} activeColor={activeColor} setActiveColor={setActiveColor} activeStrokeColor={activeStrokeColor} setActiveStrokeColor={setActiveStrokeColor}></Color>
            <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
                // onWheel={handleWheel}
                width={dimensions.width}
                height={dimensions.height}
                style={{ cursor: mode === 'grab' ? 'grab' : mode==='select'?'auto':'crosshair' }}
            />

            {/* ---- helper selectors around an active element --------------- */}
            {activeElem.length>0 && mode==='select'?
                <Selectors pan={pan} zoom={zoom} isResizing={isResizing} mode={mode} setMode={setMode} setIsDragging={setIsDragging} setIsResizing={setIsResizing} resizingPoint={resizingPoint} setResizingPoint={setResizingPoint} activeElem={activeElem}
                ></Selectors>
            :''}
            <Shapes elements={elements} handleModeChange={handleModeChange}></Shapes>

            <Delete 
                elements={elements}
                setElements={setElements}
                activeElem={activeElem}undoStack
                setUndoStack={setUndoStack}
                setRedoStack={setRedoStack}
                setActiveElem={setActiveElem}

            />
        </div>
    );
  }

  

 

 
 

 



export default Canvas;
