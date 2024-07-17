'use client';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import rough from 'roughjs/bundled/rough.esm';
import Buttons from './ButtonComponents/Button';
import Selectors from './selctors';
import { findElement } from './ButtonComponents/Clicks/Transform';
import Shapes, { createElement, drawElement } from './ButtonComponents/Clicks/Shapes';
import { selectTheShapeMove,selectTheShapeMouseDown,selectTheShapeMouseUp } from './ButtonComponents/Clicks/Move';
import Color from './ButtonComponents/Color';
import Delete from './ButtonComponents/Clicks/Delete';
import CutCopyPaste from './ButtonComponents/Clicks/CutCopyPaste';
import { ElementType } from './Types/types';



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
  const [clipboard, setClipboard] = useState([]); // Clipboard for copy-paste and cut-paste 
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
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

  //--------multiple selection-------
  const [isCtrlPressed, setIsCtrlPressed] = useState(false);
  const [isCtrlPressedCount,setIsCtrlPressedCount]=useState(0);
  //------------------

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
   //--------to identify whether ctrl is pressed or not
   useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Control') {
        setIsCtrlPressed(true);
      }
    };

    const handleKeyUp = (event) => {
      if (event.key === 'Control') {
        setIsCtrlPressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Cleanup event listeners on component unmount
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isCtrlPressedCount]);


      //Canvas initialization
      useLayoutEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.setTransform(zoom, 0, 0, zoom, pan.x, pan.y);
        ctx.clearRect(-pan.x, -pan.y, canvas.width / zoom, canvas.height / zoom);
        const roughCanvas = rough.canvas(canvas);
        elements.forEach(element => drawElement(roughCanvas,element,ctx));
        // elements.forEach(({ roughElement }) => roughCanvas.draw(roughElement));
        
      }, [elements, pan, zoom]);



    const handleMouseDown = (e) => {
      const { clientX, clientY } = e;
      const x = clientX - pan.x / zoom;
      const y = clientY - pan.y / zoom;

      setMousePosition({ x, y });

        if (mode === 'grab') {
            setPanning(true);
            return;
        }else if(mode === 'select'){

            selectTheShapeMouseDown(
              parseInt(x), 
              parseInt(y),
              setStarx,
              setStary,
              setIsDragging,
              setCurrentSelectedIndex,
              setActiveElem,
              activeElem,
              elements,
              currentSelectedIndex,
              resizingPoint,
              isResizing,
              setIsResizing,
              activeColor,
              activeStrokeColor,
              isCtrlPressed
            );

            // Save current state to undo stack before starting to draw
            setUndoStack((prev) => [...prev, elements]);
            setRedoStack([]);

            return;
        }

        // Save current state to undo stack before starting to draw
        setUndoStack((prev) => [...prev, elements]);
        setRedoStack([]); // Clear the redo stack as we're starting a new action

        setDrawing(true);

        const element = createElement[mode](x, y, x, y,activeColor,activeStrokeColor);
        
        setElements((prev) => [...prev, element]);
  
    };

    const handleMouseMove = (e) => {
      setIsCtrlPressedCount(isCtrlPressedCount=>isCtrlPressedCount+1);
      const { clientX, clientY } = e;
      const x = clientX - pan.x / zoom;
      const y = clientY - pan.y / zoom;

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
            parseInt(x),
            parseInt(y),
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
      

        const index = elements.length - 1;
        const { x1, y1 } = elements[index];
        const updatedElement = createElement[mode](x1, y1, x, y,activeColor,activeStrokeColor);
        if (updatedElement === null) return;
        const elementsCopy = [...elements];

        if(mode==='paint_brush'){
          elementsCopy[index].points = [...elementsCopy[index].points, { x, y }];
        }
        else{
          elementsCopy[index] = updatedElement;
        }
        setElements(elementsCopy);
      };
      

    const handleMouseUp = () => {
        setDrawing(false);
        setPanning(false);
        if (mode === "select") {
          selectTheShapeMouseUp(
            isDragging,
            setIsDragging,
            setUndoStack,
            elements,
            isResizing,
            setIsResizing,
            activeColor,
            activeStrokeColor
          );
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
            console.log(loadedElements);
            const elementsToSet = loadedElements.flatMap(({ type, x1, y1, x2, y2, roughElement, points }) => {
                if (type !== ElementType.PAINT_BRUSH) {
                    return createElement[type](x1, y1, x2, y2, roughElement.options.fill, roughElement.options.stroke);
                } else {
                    console.log(type);
                    return points.map(point => createElement[ElementType.PAINT_BRUSH](point.x, point.y));
                    // console.log(points.x);
                }
            }).filter(element => element !== null);
    
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
            {activeElem.length > 0 && mode === 'select' ?
  activeElem.map((element, index) => (
    <Selectors
      key={index}
      pan={pan}
      zoom={zoom}
      isResizing={isResizing}
      mode={mode}
      setMode={setMode}
      setIsDragging={setIsDragging}
      setIsResizing={setIsResizing}
      resizingPoint={resizingPoint}
      setResizingPoint={setResizingPoint}
      activeElem={activeElem}
      shape={element}
    />
  ))
  : ''
}
            <Shapes elements={elements} handleModeChange={handleModeChange}></Shapes>
            <Delete 
              elements={elements}
              setElements={setElements}
              activeElem={activeElem}
              setUndoStack={setUndoStack}
              setRedoStack={setRedoStack}
              setActiveElem={setActiveElem}
            />

            <CutCopyPaste 
              elements={elements}
              setElements={setElements}
              activeElem={activeElem}
              setActiveElem={setActiveElem}
              setRedoStack={setRedoStack}
              setUndoStack={setUndoStack}
              clipboard={clipboard}
              setClipboard={setClipboard}
              canvasRef={canvasRef}
              zoom={zoom}
              pan={pan}
              mousePosition={mousePosition}
            />
        </div>
    );
  }
export default Canvas;
