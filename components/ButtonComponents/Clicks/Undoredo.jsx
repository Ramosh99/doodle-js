import React from 'react';
import { GrUndo, GrRedo } from "react-icons/gr";



const Undoredo = ({elements,undoStack,redoStack,setUndoStack,setRedoStack,setElements,setActiveElem}) => {

    const handleUndo = () => {
        if (undoStack.length  === 0) return;
        setActiveElem([]);
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
            position: 'fixed', bottom:'10px', left:'20px',zIndex:20,
            display:'flex',justifyContent:'space-around',alignItems:'center',
            width:'100px',height:'30px',backgroundColor:'white',borderRadius:'4px',
            boxShadow:'0 0 3px lightGrey' 
            }}>

            {/* --- Undo ---- */}
            <GrUndo id="btn-undo" className='selectIcon' onClick={handleUndo} style={{cursor:'pointer' ,color: undoStack.length === 0 ? 'gray' : 'inherit' }} />

            {/* --- Redo ---- */}
            <GrRedo id="btn-redo" className='selectIcon' onClick={handleRedo} style={{cursor:'pointer' ,color: redoStack.length === 0 ? 'gray' : 'inherit' }} />

        </div>
    );
}

export default Undoredo;
