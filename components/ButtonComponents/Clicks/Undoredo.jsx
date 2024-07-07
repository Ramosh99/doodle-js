import React from 'react';
import { GrUndo, GrRedo } from "react-icons/gr";



const Undoredo = ({fileInputRef,handleLoad,elements,undoStack,redoStack,setUndoStack,setRedoStack,setElements}) => {
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
        <div style={{ 
            position: 'absolute', bottom:'10px', left:'20px',
            display:'flex',justifyContent:'space-around',alignItems:'center',
            width:'100px',height:'30px',backgroundColor:'white',borderRadius:'4px',
            boxShadow:'0 0 3px lightGrey' 
            }}>
            
            {/*---This is hidden--------- triggered by above icon */}
            <input ref={fileInputRef} type="file" style={{display:'none'}} onChange={handleLoad} />

            {/* --- Undo ---- */}
            <GrUndo onClick={handleUndo} style={{ color: undoStack.length === 0 ? 'gray' : 'inherit' }} />

            {/* --- Redo ---- */}
            <GrRedo onClick={handleRedo} style={{ color: redoStack.length === 0 ? 'gray' : 'inherit' }} />

        </div>
    );
}

export default Undoredo;
