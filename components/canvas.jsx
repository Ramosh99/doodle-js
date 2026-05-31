'use client';
import React, { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import rough from 'roughjs/bundled/rough.esm';
import Buttons from './ButtonComponents/Button';
import Selectors from './selctors';
import Shapes, { createElement, drawElement } from './ButtonComponents/Clicks/Shapes';
import { selectTheShapeMove,selectTheShapeMouseDown,selectTheShapeMouseUp } from './ButtonComponents/Clicks/Move';
import Color from './ButtonComponents/Color';
import Delete from './ButtonComponents/Clicks/Delete';
import CutCopyPaste from './ButtonComponents/Clicks/CutCopyPaste';
import { ElementType } from './Types/types';
// import handleLoad from './ButtonComponents/Clicks/Load';
import { AddText } from './ButtonComponents/Clicks/Write';
import Text from './Text';
import AIIntegration from './AIIntegration';

const KEYBOARD_SHORTCUTS_ENABLED = false;


const Canvas = () => {
    
    const [elements, setElements] = useState([]);//all elements in canvas
    const [activeElem,setActiveElem] = useState([])//selected elements
    const [drawing, setDrawing] = useState(false);
    const [panning, setPanning] = useState(false);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [ZoomOffset, setZoomOffset] = useState({ x: 0, y: 0 });
    const [mode, setMode] = useState("select");//active element / current using
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
  const [editingIndex, setEditingIndex] = useState(null);

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
    setDimensions({ width: window.innerWidth, height: window.innerHeight });
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []); // Empty dependency array means this effect runs once on mount
   
  //--------to identify whether ctrl is pressed or not
   useEffect(() => {
    if (!KEYBOARD_SHORTCUTS_ENABLED) {
      setIsCtrlPressed(false);
      return;
    }

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
        // Reset the current transformation matrix to the identity matrix
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        // Clear the entire canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const scaledWidth = canvas.width * zoom;
        const scaledHeight = canvas.height * zoom;

        const scaleOffsetX = (scaledWidth - canvas.width) / 2;
        const scaleOffsetY = (scaledHeight - canvas.height) / 2;
        
        setZoomOffset({ x: scaleOffsetX, y: scaleOffsetY });
        // Apply new transformations for zoom and pan
        ctx.setTransform(zoom, 0, 0, zoom, pan.x * zoom - scaleOffsetX, pan.y * zoom - scaleOffsetY);  
        const roughCanvas = rough.canvas(canvas);
        elements.forEach(element => drawElement(roughCanvas, element, ctx));
      }, [elements, pan, zoom]);


    const handleMouseDown = (e) => {
      const { clientX, clientY } = e;
      const x = (clientX - pan.x * zoom + ZoomOffset.x)/zoom;
      const y = (clientY - pan.y * zoom + ZoomOffset.y)/zoom;

      setMousePosition({ x, y });

        if (mode === 'grab') {
            setPanning(true);
            return;
        }else if(mode === 'select'){
              console.log(elements);
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

        let element = createElement[mode](x, y, x, y,activeColor,activeStrokeColor);

        setElements((prev) => [...prev, element]);
  
    };

    const handleMouseMove = (e) => {
      setIsCtrlPressedCount(isCtrlPressedCount=>isCtrlPressedCount+1);
      const { clientX, clientY } = e;
      const x = (clientX - pan.x * zoom + ZoomOffset.x)/zoom;
      const y = (clientY - pan.y * zoom + ZoomOffset.y)/zoom;

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
        
        // ------------------------------- maintaining x1<x2 & y1<y2 ----------------------
        const element = elements[elements.length-1];
        if (element) {
          if(element.type==="rectangle"){
            if(element.x2<element.x1){
              let tmp = element.x1;
              element.x1=element.x2;
              element.x2=tmp;
            }
            if(element.y2<element.y1){
              let tmp = element.y1;
              element.y1=element.y2;
              element.y2=tmp;
            }
          } 
        }

        if (mode === "text") {
          const index = elements.length - 1;
          setEditingIndex(index);
          setMode("select");
        }
    };

    const handleDoubleClick = (e) => {
      if (mode !== "select") return;
      const { clientX, clientY } = e;
      const x = (clientX - pan.x * zoom + ZoomOffset.x)/zoom;
      const y = (clientY - pan.y * zoom + ZoomOffset.y)/zoom;

      // Find if we double clicked a text element
      const clickedTextIndex = elements.findIndex((el) => {
        return el.type === "text" && x >= el.x1 && x <= el.x2 && y >= el.y1 && y <= el.y2;
      });

      if (clickedTextIndex !== -1) {
        setEditingIndex(clickedTextIndex);
      }
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
        console.log(loadedElements);
        const elementsToSet = loadedElements.map((el) => {
          const { type, x1, y1, x2, y2, roughElement, points, text } = el;
          if (type === ElementType.PAINT_BRUSH) {
            return { type: ElementType.PAINT_BRUSH, points, x1, y1, x2, y2 };
          } else if (type === ElementType.TEXT) {
            return { type: ElementType.TEXT, x1, y1, x2, y2, text };
          } else {
            const fill = roughElement && roughElement.options ? roughElement.options.fill : undefined;
            const stroke = roughElement && roughElement.options ? roughElement.options.stroke : 'black';
            return createElement[type](x1, y1, x2, y2, fill, stroke);
          }
        }).filter(element => element !== null);
    
        setElements(elementsToSet);
      };
    
      reader.readAsText(file);
    };
    
  
  

    // Check if the point is close enough to the line segment within the tolerance
    return (
        <div style={{ overflow: 'hidden', width: '100vw', height: '100vh' ,position:'relative'}}>
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
                zoom={zoom}
                setZoom={setZoom}
                setPan={setPan}
                />
              <AIIntegration setElements={setElements} setActiveElem={setActiveElem} />
              <a
                href="/eraser"
                style={{
                  position: 'fixed',
                  top: '10px',
                  right: '535px',
                  zIndex: 100,
                  background: 'linear-gradient(135deg, #0f172a, #1e293b)',
                  color: '#cbd5e1',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '24px',
                  padding: '8px 18px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease-in-out',
                  fontSize: '14px',
                  textDecoration: 'none'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px) scale(1.03)';
                  e.currentTarget.style.color = '#f8fafc';
                  e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.4)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(99, 102, 241, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.color = '#cbd5e1';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                  e.currentTarget.style.boxShadow = '0 4px 14px rgba(0, 0, 0, 0.25)';
                }}
              >
                <span>✏️</span> Doodlejs.io Workspace
              </a>
            <Color currentSelectedIndex={currentSelectedIndex} elements={elements} setElements={setElements} activeElem={activeElem} setActiveElem={setActiveElem} activeColor={activeColor} setActiveColor={setActiveColor} activeStrokeColor={activeStrokeColor} setActiveStrokeColor={setActiveStrokeColor}></Color>
            <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
                onDoubleClick={handleDoubleClick}
                // onWheel={handleWheel}
                width={dimensions.width}
                height={dimensions.height}
                style={{
                  position:'fixed',
                  cursor: mode === 'grab' ? 'grab' : 
                          mode === 'select' ? 'auto' : 
                          mode === 'paint_brush' ? "url('data:image/x-icon;base64,AAACAAEAICAQAAIAAwDoAgAAFgAAACgAAAAgAAAAQAAAAAEABAAAAAAAAAIAAAAAAAAAAAAAEAAAAAAAAAAAAAAAxJ0AALiTAACefgAAq4kAANuvAADougAAGqsAAJF0AADPpQAAAJ4FAA7PAAAAxc8A/8wAAACRBQCrCwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACDQAAAAAAAAAAAAAAAAAAINCEAAAAAAAAAAAAAAAAAg0IJAAAAAAAAAAAAAAAACDQgBQAAAAAAAAAAAAAAAINCDAYAAAAAAAAAAAAAAAg0IMBtAAAAAAAAAAAAAACDQgwG0AAAAAAAAAAAAAAINCAAbQAAAAAAAAAAAAAAg0IJVtAAAAAAAAAAAAAACDQgkG0AAAAAAAAAAAAAAINCCQDQAAAAAAAAAAAAAA6nALAAAAAAAAAAAAAAAADqcAsAAAAAAAAAAAAAAAAOpwCwAAAAAAAAAAAAAAAA6nALAAAAAAAAAAAAAAAADqcAsAAAAAAAAAAAAAAAAIpwCwAAAAAAAAAAAAAAAAg3ALAAAAAAAAAAAAAAAACDQAsAAAAAAAAAAAAAAAAINACwAAAAAAAAAAAAAAAAg0ALAAAAAAAAAAAAAAAACDQgkAAAAAAAAAAAAAAAAANCCQAAAAAAAAAAAAAAAAA0IZAAAAAAAAAAAAAAAAAAQgAAAAAAAAAAAAAAAAAADwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//////////////4////8H///+A////AP///gD///wA///4AP//8AH//+AD///AB///gA///wAf//4Bv//8A///+Af///AP///gH///wD///4B///8A///+Af///AP///gH///4D///8B////A////h////5///////////////w=='), auto" : 
                          'crosshair'
                }}               
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
      ZoomOffset={ZoomOffset}
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


            {elements.map((el,ind)=>{
              if (el.type !== 'text') return null;
              return (
                <Text 
                  key={el.id || ind} 
                  prop={el} 
                  isEditing={editingIndex === ind}
                  onChange={(newText) => {
                    const newElements = [...elements];
                    newElements[ind] = { ...newElements[ind], text: newText };
                    setElements(newElements);
                  }}
                  onFinishEditing={() => {
                    setEditingIndex(null);
                    // Remove if empty
                    if (!elements[ind].text || elements[ind].text.trim() === '') {
                      const newElements = elements.filter((_, i) => i !== ind);
                      setElements(newElements);
                      setActiveElem([]);
                    }
                  }}
                />
              );
            })}
        </div>
    );
  }
export default Canvas;
