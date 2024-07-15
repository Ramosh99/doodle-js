import React, { useRef, useState } from 'react'
import { RiPaintFill } from "react-icons/ri";
import { MdOutlineBrush } from "react-icons/md";
import { GoDotFill } from "react-icons/go";
import { IoIosColorPalette } from "react-icons/io";
import { FaPlus } from "react-icons/fa";
import { CgColorPicker } from "react-icons/cg";
import { FaGripLines } from "react-icons/fa";
import { updateRealCordinates } from './Clicks/Move';

export default function Color({currentSelectedIndex,elements,setElements,activeColor,setActiveColor,activeStrokeColor,setActiveStrokeColor,activeElem,setActiveElem}) {

    const [mode,setMode]=useState('fill'); //fill or stroke
    const [expanded, setExpanded] = useState(false);

    const [colorPallete, setColorPallete] = useState(['black','blue','lightGreen','yellow','red','white'])
    const [colorPickerColor, setColorPickerColor] = useState('')
   
    const colorPickerRef=useRef(null)
    const colorPickerHandler = () => {
        colorPickerRef.current.click()
    }

  const handleActiveColor = (color) => {//what happens when selecting a color spot
    if(mode=='fill') {
        setActiveColor(color);
         
        if(activeElem.length!=0)
        {
            updateRealCordinates(activeElem[0].x1,activeElem[0].y1,activeElem[0].x2,activeElem[0].y2,setActiveElem,setElements,currentSelectedIndex,elements,color, elements[currentSelectedIndex].roughElement.options.stroke,elements[currentSelectedIndex].type);          
        }
        
        
    }else{
        setActiveStrokeColor(color)
        if(activeElem.length!=0)
            {
                updateRealCordinates(activeElem[0].x1,activeElem[0].y1,activeElem[0].x2,activeElem[0].y2,setActiveElem,setElements,currentSelectedIndex,elements,elements[currentSelectedIndex].roughElement.options.fill, color,elements[currentSelectedIndex].type);          
            }
    }
    setExpanded(false)
  }

  const handleExpanded = (mode) => { //what happens when clickking the fill/stroke icons
    if(!expanded){
        setExpanded(true)
    }else if(expanded){
        setExpanded(false)
    }
    setMode(mode)
  }

  return (
    <div style={{
        position: 'absolute', top:'10px', right:'20px',
        display:'flex',flexDirection:'column', justifyContent:'space-around', alignItems:'center',
        backgroundColor:'white', borderRadius:'4px',
        boxShadow:'0 0 3px lightGrey',
        width:'80px'
    }}>
    <div 
        style={{ 
                height:'30px', width:'90%',
                display:'flex', justifyContent:'space-around', alignItems:'center',
                borderBottom:expanded?'1px solid lightGrey':'',
        }}
        >
            <RiPaintFill 
                style={{fontSize:'20px',cursor:'pointer',color:activeColor}} 
                onClick={()=>handleExpanded('fill')}
            ></RiPaintFill>
            <MdOutlineBrush 
                style={{fontSize:'20px',cursor:'pointer',color:activeStrokeColor}}
                onClick={()=>handleExpanded('stroke')}
            ></MdOutlineBrush>
    </div>

    {/* =================    expanded drop down menu ================ */}

    {expanded?
    <div style={{display:'flex',justifyContent:'space-around',alignItems:'start'}}>
        {/* ---- color list ----------------- */}
        <div 
            style={{
                display:'flex',flexDirection:'column',justifyContent:'center',alignItems:'center',paddingTop:'10px',paddingBottom:'10px',marginRight:'10px'
            }}>
            {
                colorPallete.map((col,index)=>{
                    return <ColorSpot key={index} col={col} mode={mode} handleActiveColor={handleActiveColor}></ColorSpot>
                })
            }
        </div>

        {/* --- other options ----------------- */}
        <div 
            style={{
                display:'flex',flexDirection:'column',justifyContent:'space-around',alignItems:'center',
                height:'100px',paddingTop:'10px',
                position:'relative'
            }}
        >
            {/* select another color */}
            <IoIosColorPalette 
                className='selectIcon'
                onClick={colorPickerHandler}
            ></IoIosColorPalette>
            <CgColorPicker className='selectIcon'></CgColorPicker>{/* eye dropper */}
            <FaPlus className='selectIcon'></FaPlus>{/* add new color to pallete */}
            <input 
                ref={colorPickerRef}
                type='color' 
                value={colorPickerColor} 
                onChange={(e)=>setColorPickerColor(e.target.value)}
                style={{
                    borderRadius:'50%',
                    width:'1px',height:'1px',position:'absolute',
                    left:'-300px',top:'-25px',
                    pointerEvents:'none'
                }}
            >
            </input>
        </div>
    
    </div>
    :''} 

    </div>
  )
}

//a color spot out of the color pallete collection
const ColorSpot=({ mode, col, handleActiveColor })=>{
  return (
    <>
    {mode=='fill'?
    <div 
        style={{
            width:'15px',height:'15px',marginTop:'3px',marginBottom:'3px',
            border:'1px solid grey',borderRadius:'50%',
            backgroundColor:col,
            cursor :'pointer'
        }}
        onClick={()=>handleActiveColor(col)}
    >
    </div>:
    <div 
        style={{
            height:'15px',width:'15px',position:'relative',
            marginBottom:'3px',marginTop:'3px',
            cursor :'pointer'
        }}
        onClick={()=>handleActiveColor(col)}
    >
        <div
            style={{
                position:'absolute',top:'0px',left:'0px',
                width:'15px',height:'15px',
                backgroundColor:col,
                borderRadius:'50%',
                border:'1px solid grey'
            }}
        ></div>
        <div
            style={{
                position:'absolute',top:'3px',left:'3px',
                width:'9px',height:'9px',
                backgroundColor:'white',
                borderRadius:'50%',
                border:'1px solid grey'
            }}
        >
        </div>
    </div>}
    </>
  )
}
