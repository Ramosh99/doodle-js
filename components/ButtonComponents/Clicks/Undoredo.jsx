import { useEffect } from "react";
import React from 'react';
import { GrUndo, GrRedo } from "react-icons/gr";



const Undoredo = ({elements,undoStack,redoStack,setUndoStack,setRedoStack,setElements,setActiveElem}) => {
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
            position: 'absolute', bottom:'10px', left:'20px',
            display:'flex',justifyContent:'space-around',alignItems:'center',
            width:'100px',height:'30px',backgroundColor:'white',borderRadius:'4px',
            boxShadow:'0 0 3px lightGrey' 
            }}>

            {/* --- Undo ---- */}
            <GrUndo className='selectIcon' onClick={handleUndo} style={{cursor:'pointer' ,color: undoStack.length === 0 ? 'gray' : 'inherit' }} />

            {/* --- Redo ---- */}
            <GrRedo className='selectIcon' onClick={handleRedo} style={{cursor:'pointer' ,color: redoStack.length === 0 ? 'gray' : 'inherit' }} />

        </div>
    );
}

export default Undoredo;
