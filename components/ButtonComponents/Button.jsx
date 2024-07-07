// Buttons.js
import React, { useRef } from 'react';
import { IoHandLeftOutline } from "react-icons/io5";
import { RiRectangleLine } from "react-icons/ri";
import { GoDash } from "react-icons/go";
import { FiSave } from "react-icons/fi";
import { LuDownload } from "react-icons/lu";
import { LuMousePointer2 } from "react-icons/lu";
import { GrUndo, GrRedo } from "react-icons/gr";
import Undoredo from './Clicks/Undoredo';
import { handleSave } from './Clicks/Save'; 

const Buttons = ({ handleModeChange, elements, handleLoad, mode, undoStack, redoStack, setUndoStack, setRedoStack, setElements }) => {
    const fileInputRef = useRef(null); // ref to file chooser

    const handleIconClick = () => { // function to trigger file chooser by LuDownload icon
        fileInputRef.current.click();
    };

    return (
        <>
            <div style={{ 
                position: 'absolute', top:'10px', left:'20px',
                display:'flex', justifyContent:'space-around', alignItems:'center',
                width:'600px', height:'30px', backgroundColor:'white', borderRadius:'4px',
                boxShadow:'0 0 3px lightGrey' 
            }}>
                {/* --- Mouse Pointer ---- */}
                <LuMousePointer2 className='selectIcon'></LuMousePointer2>

                {/* --- Grab ---- */}
                <IoHandLeftOutline
                    className={mode === 'grab' ? 'activeIcon' : 'selectIcon'} 
                    onClick={() => handleModeChange('grab')}
                >
                    Grab
                </IoHandLeftOutline>

                {/* --- Rectangle ---- */}
                <RiRectangleLine 
                    className={mode === 'rectangle' ? 'activeIcon' : 'selectIcon'} 
                    onClick={() => handleModeChange('rectangle')}
                >
                    Rectangle
                </RiRectangleLine>

                {/* --- Line ---- */}
                <GoDash 
                    className={mode === 'line' ? 'activeIcon' : 'selectIcon'} 
                    onClick={() => handleModeChange('line')}
                >
                    Line
                </GoDash>

                {/* --- Save ---- */}
                <FiSave 
                    className='selectIcon'
                    onClick={() => handleSave(elements)}
                    style={{marginLeft:'100px'}}
                >
                    Save
                </FiSave>

                {/* --- Load ---- */}
                <LuDownload onClick={handleIconClick} className='selectIcon' ></LuDownload>
            </div>
            
            {/* --- UndoRedo ---- */}
            <Undoredo 
                elements={elements} 
                fileInputRef={fileInputRef} 
                handleLoad={handleLoad} 
                undoStack={undoStack} 
                redoStack={redoStack} 
                setUndoStack={setUndoStack} 
                setRedoStack={setRedoStack} 
                setElements={setElements}
            />
        </>
    );
};

export default Buttons;
