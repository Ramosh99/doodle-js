import React, { useEffect } from 'react';

function Delete({ activeElem, elements, setElements, setActiveElem, setUndoStack, setRedoStack }) {
    // Listen for keydown event to delete active elements
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Backspace' || e.key === 'Delete') {
                handleDelete();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [activeElem, elements]);

    const handleDelete = () => {
        if (activeElem.length === 0) return;
    
        // Save current state to undo stack before deleting
        setUndoStack((prev) => [...prev, elements]);
        setRedoStack([]); // Clear the redo stack as we're starting a new action

        console.log('elements',elements)
        console.log('active elment', activeElem);
    
        // Filter out only the elements that are not in activeElem
        const updatedElements = elements.filter(
            (el) => activeElem.indexOf(el) === -1
        );

        console.log('updatedElements', updatedElements);
    
        setElements(updatedElements);
        setActiveElem([]); // Clear active elements after deletion
    };
    
    return null; // This component doesn't render anything
}

export default Delete;
