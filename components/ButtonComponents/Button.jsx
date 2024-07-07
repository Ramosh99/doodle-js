import React, { useRef } from 'react';
import { IoHandLeftOutline } from "react-icons/io5";
import { RiRectangleLine } from "react-icons/ri";
import { GoDash } from "react-icons/go";
import { FiSave } from "react-icons/fi";
import { LuDownload } from "react-icons/lu";
import { LuMousePointer2 } from "react-icons/lu";
import { GrUndo, GrRedo } from "react-icons/gr";

const Buttons = ({ handleModeChange, handleSave, handleLoad ,mode, handleUndo, handleRedo, undoStack, redoStack}) => {

    const fileInputRef = useRef(null);//ref to file chooser

    const handleIconClick = () => {//function to trigger file chooser by LuDownload icon
      fileInputRef.current.click();
    };


    return (
        <>
            <div style={{ 
                position: 'absolute', top:'10px', left:'20px',
                display:'flex',justifyContent:'space-around',alignItems:'center',
                width:'600px',height:'30px',backgroundColor:'white',borderRadius:'4px',
                boxShadow:'0 0 3px lightGrey' 
                }}>

                {/* --- Mouse Pointer ---- */}
                <LuMousePointer2 className='selectIcon'></LuMousePointer2>

                {/* --- Grab ---- */}
                <IoHandLeftOutline
                    className={mode=='grab'?'activeIcon':'selectIcon'} 
                    onClick={() => handleModeChange('grab')}
                    >Grab
                </IoHandLeftOutline>

                {/* --- Reactangle ---- */}
                <RiRectangleLine 
                    className={mode=='rectangle'?'activeIcon':'selectIcon'} 
                    onClick={() => handleModeChange('rectangle')}
                    >Rectangle
                </RiRectangleLine>

                {/* --- Line ---- */}
                <GoDash 
                    className={mode=='line'?'activeIcon':'selectIcon'} 
                    onClick={() => handleModeChange('line')}
                    >Line
                </GoDash>

                {/* --- Save ---- */}
                <FiSave 
                    className='selectIcon'
                    onClick={handleSave}
                    style={{marginLeft:'100px'}}
                    >Save
                </FiSave>

                {/* --- Load ---- */}
                <LuDownload onClick={handleIconClick} className='selectIcon' ></LuDownload>
                {/*---This is hidden--------- triggered by above icon */}
                <input ref={fileInputRef} type="file" style={{display:'none'}} onChange={handleLoad} />

            </div>

            <div style={{ 
                position: 'absolute', bottom:'10px', left:'20px',
                display:'flex',justifyContent:'space-around',alignItems:'center',
                width:'100px',height:'30px',backgroundColor:'white',borderRadius:'4px',
                boxShadow:'0 0 3px lightGrey' 
                }}>

                {/* --- Undo ---- */}
                <GrUndo onClick={handleUndo} style={{ color: undoStack.length === 0 ? 'gray' : 'inherit' }} />

                {/* --- Redo ---- */}
                <GrRedo onClick={handleRedo} style={{ color: redoStack.length === 0 ? 'gray' : 'inherit' }} />

            </div>

        </>
    );
};

export default Buttons;
