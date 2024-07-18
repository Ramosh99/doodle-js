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
import { RiPencilFill } from "react-icons/ri";
import { PiTextTBold } from "react-icons/pi";
import { HiArrowLongRight } from "react-icons/hi2";
import { MdOutlineRefresh } from "react-icons/md";
import ZoomNGrag from './Clicks/ZoomNGrag';

const Buttons = ({ zoom,setZoom,setPan,handleModeChange, elements,canvasRef, handleLoad, mode, undoStack, redoStack, setUndoStack, setRedoStack, setElements,setActiveElem }) => {

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
                position: 'fixed', top:'10px', left:'20px',
                display:'flex', justifyContent:'space-around', alignItems:'center',
                width:'420px', height:'30px', backgroundColor:'white', borderRadius:'4px',
                boxShadow:'0 0 3px lightGrey',
            }}>
                {/* --- Select ---- */}
                <div className='toolTipCov'>
                    <LuMousePointer2 
                        className={mode === 'select' ? 'activeIcon' : 'selectIcon'} 
                        onClick={() => handleModeChange('select')}
                    ></LuMousePointer2>
                    <p className='toolTip'>Select</p>
                </div>


                {/* --- Grab ---- */}
                <div className='toolTipCov'>
                    <IoHandLeftOutline
                        className={mode === 'grab' ? 'activeIcon' : 'selectIcon'} 
                        onClick={() => handleModeChange('grab')}
                    ></IoHandLeftOutline>
                    <p className='toolTip'>hand</p>
                </div>


                {/* --- Line ---- */}
                <div className='toolTipCov'>
                    <GoDash 
                        className={mode === 'line' ? 'activeIcon' : 'selectIcon'} 
                        onClick={() => handleModeChange('line')}
                    ></GoDash>
                    <p className='toolTip'>Line</p>
                </div>


                {/* --- Arrow ---- */}
                <div className='toolTipCov'>
                    <HiArrowLongRight
                        className={mode === 'arrow' ? 'activeIcon' : 'selectIcon'}
                        onClick={() => handleModeChange('arrow')}
                    ></HiArrowLongRight>
                    <p className='toolTip'>Arrow</p>
                </div>

                    
                {/* --- Pencil ---- */}
                <div className='toolTipCov'>
                    <RiPencilFill
                        className={mode === 'paint_brush' ? 'activeIcon' : 'selectIcon'}
                        onClick={() => handleModeChange('paint_brush')}
                    ></RiPencilFill>
                    <p className='toolTip'>Pencil</p>
                </div>


                {/* --- Recatngle ---- */}
                <div className='toolTipCov'>
                    <RiRectangleLine 
                        className={mode === 'rectangle' ? 'activeIcon' : 'selectIcon'} 
                        onClick={() => handleModeChange('rectangle')}
                    ></RiRectangleLine>
                    <p className='toolTip'>Rectangle</p> 
                </div>


                {/* --- Triangle ---- */}
                <div className='toolTipCov'>
                    <RiTriangleLine 
                        className={mode === 'triangle' ? 'activeIcon' : 'selectIcon'} 
                        onClick={() => handleModeChange('triangle')}
                    ></RiTriangleLine>
                    <p className='toolTip'>Triangle</p>
                </div>


                {/* --- Circle ---- */}
                <div className='toolTipCov'>
                   <RiCircleLine
                        className={mode === 'circle' ? 'activeIcon' : 'selectIcon'}
                        onClick={() => handleModeChange('circle')}
                    ></RiCircleLine>
                    <p className='toolTip'>Circle</p>
                </div>


                {/*---- Text ------ */}
                <div className='toolTipCov'>
                    <PiTextTBold
                        className={mode === 'text' ? 'activeIcon' : 'selectIcon'}
                        onClick={() => handleModeChange('text')}
                    ></PiTextTBold>
                    <p className='toolTip'>Text</p>
                </div>


                {/* --- Reset canvas ---- */}
                <MdOutlineRefresh
                    className='selectIcon'
                    onClick={() => {
                        setElements([]);
                        setActiveElem([]);
                    }}
                />

                {/* --- Save ---- */}
                <div className='toolTipCov' style={{marginLeft:'60px'}}>
                    <FiSave 
                        className='selectIcon'
                        onClick={() => handleSave({elements})}
                    ></FiSave>
                    <p className='toolTip'>Save</p>
                </div>

                {/* --- Load ---- */}
                <div className='toolTipCov'>
                    <LuDownload onClick={handleIconClick} className='selectIcon' ></LuDownload>
                    <p className='toolTip'>Load</p>
                </div>
                {/*---This is hidden--------- triggered by above icon */}
                <input ref={fileInputRef} type="file" style={{display:'none'}} onChange={handleLoad} />

            </div>
            
            {/* --- UndoRedo ---- */}
            <ZoomNGrag zoom={zoom} setZoom={setZoom} setPan={setPan}/>
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
