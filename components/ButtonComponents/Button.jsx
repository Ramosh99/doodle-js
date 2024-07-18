// Buttons.js
import React, { useRef, useState } from 'react';
import { IoHandLeftOutline } from "react-icons/io5";
import { RiArrowDownLine, RiArrowRightLine, RiBrush2Line, RiCircleLine, RiRectangleLine, RiTriangleLine } from "react-icons/ri";
import { GoCircle, GoDash } from "react-icons/go";
import { FiSave } from "react-icons/fi";
import { LuDownload } from "react-icons/lu";
import { LuMousePointer2 } from "react-icons/lu";
import Undoredo from './Clicks/Undoredo';
import { handleSave } from './Clicks/Save'; 
import { FaAngleDown } from "react-icons/fa";
import { FaPencilAlt } from "react-icons/fa"
import { HiArrowLongRight } from "react-icons/hi2";
import { MdOutlineRefresh } from "react-icons/md";

const Buttons = ({ handleModeChange, elements,canvasRef, handleLoad, mode, undoStack, redoStack, setUndoStack, setRedoStack, setElements,setActiveElem }) => {

    //shape selector options-----------------------------------------------------------------------
    const [shapeMenu,setShapeMenu] = useState(false); // to show/hide shape menu
    const [activeShape, setActiveShape] = useState('rectangle'); 
    const handleActiveShape = (shape) => { 
        setActiveShape(shape);
        handleModeChange(shape)
        setShapeMenu(false);
    }


    //file handling options-------------------------------------------------------------------------
    const fileInputRef = useRef(null); // ref to file chooser
    const handleIconClick = () => { // function to trigger file chooser by LuDownload icon
        fileInputRef.current.click();
    };

    return (
        <>
            <div style={{ 
                position: 'absolute', top:'10px', left:'20px',
                display:'flex', justifyContent:'space-around', alignItems:'center',
                width:'400px', height:'30px', backgroundColor:'white', borderRadius:'4px',
                boxShadow:'0 0 3px lightGrey',
            }}>
                {/* --- Mouse Pointer ---- */}
                <LuMousePointer2 
                    className={mode === 'select' ? 'activeIcon' : 'selectIcon'} 
                    onClick={() => handleModeChange('select')}
                ></LuMousePointer2>

                {/* --- Grab ---- */}
                <IoHandLeftOutline
                    className={mode === 'grab' ? 'activeIcon' : 'selectIcon'} 
                    onClick={() => handleModeChange('grab')}
                >
                    Grab
                </IoHandLeftOutline>

                <HiArrowLongRight
                    className={mode === 'arrow' ? 'activeIcon' : 'selectIcon'}
                    onClick={() => handleModeChange('arrow')}
                >
                </HiArrowLongRight>
                <FaPencilAlt
                    className={mode === 'paint_brush' ? 'activeIcon' : 'selectIcon'}
                    onClick={() => handleModeChange('paint_brush')}
                >
                </FaPencilAlt>

                {/* =========   Shape selector ==================================== */}
                <div>
                    {/*---active shape with drop arrow--------------- */}
                   <div style={{display:'flex',justifyContent:'center',alignItems:'center'}}>
                    {activeShape==='rectangle'?                   
                        <RiRectangleLine 
                            className={mode === 'rectangle' ? 'activeIcon' : 'selectIcon'} 
                            onClick={() => handleModeChange('rectangle')}
                         >
                        </RiRectangleLine> 
                        :activeShape==='circle'?
                        <RiCircleLine
                            className={mode === 'circle' ? 'activeIcon' : 'selectIcon'}
                            onClick={() => handleModeChange('circle')}
                        >
                        </RiCircleLine>
                        :activeShape==='triangle'?
                        <RiTriangleLine 
                            className={mode === 'triangle' ? 'activeIcon' : 'selectIcon'} 
                            onClick={() => handleModeChange('triangle')}
                        >
                        </RiTriangleLine>
                        :''}
                     <FaAngleDown style={{fontSize:'10px',cursor:'pointer'}} onClick={()=>setShapeMenu(!shapeMenu)}></FaAngleDown>  
                   </div>  

                    {/*----- drop down menu---------------------- */}
                    {shapeMenu?<div 
                    className='drop'
                    style={{
                        display:'flex',flexDirection:'column',justifyContent:'space-around',alignItems:'center',position:'absolute',top:'25px',
                        backgroundColor:'white',
                        borderRadius:'4px',borderTopLeftRadius:'0',borderTopRightRadius:'0',
                        borderTop:'1px solid lightGrey',
                        boxShadow:'0px 2px 3px lightGrey',
                        padding:'5px'
                        }}>
                    {activeShape!=='rectangle'?<RiRectangleLine className='selectIconMenu' onClick={()=>handleActiveShape('rectangle')}></RiRectangleLine>:''}
                    {activeShape!=='circle'?<RiCircleLine className='selectIconMenu' onClick={()=>handleActiveShape('circle')}></RiCircleLine>:''}
                    {activeShape!=='triangle'?<RiTriangleLine className='selectIconMenu' onClick={()=>handleActiveShape('triangle')}></RiTriangleLine>:''}
                </div>
                :''}             
                </div>


                {/* --- Line ---- */}
                <GoDash 
                    className={mode === 'line' ? 'activeIcon' : 'selectIcon'} 
                    onClick={() => handleModeChange('line')}
                >
                    Line
                </GoDash>

                {/* --- Reset canvas ---- */}
                <MdOutlineRefresh
                    className='selectIcon'
                    onClick={() => setElements([])}
                />

                {/* --- Save ---- */}
                <FiSave 
                    className='selectIcon'
                    onClick={() => handleSave({elements})}
                    style={{marginLeft:'100px'}}
                >
                    Save
                </FiSave>

                {/* --- Load ---- */}
                <LuDownload onClick={handleIconClick} className='selectIcon' ></LuDownload>
                {/*---This is hidden--------- triggered by above icon */}
                <input ref={fileInputRef} type="file" style={{display:'none'}} onChange={handleLoad} />

            </div>
            
            {/* --- UndoRedo ---- */}
            <Undoredo 
                elements={elements} 
                undoStack={undoStack} 
                redoStack={redoStack} 
                setUndoStack={setUndoStack} 
                setRedoStack={setRedoStack} 
                setElements={setElements}
                setActiveElem={setActiveElem}
            />
        </>
    );
};

export default Buttons;
