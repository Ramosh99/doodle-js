import React, { useState } from 'react'
import { RiPaintFill } from "react-icons/ri";
import { MdOutlineBrush } from "react-icons/md";
import { GoDotFill } from "react-icons/go";
import { IoIosColorPalette } from "react-icons/io";
import { FaPlus } from "react-icons/fa";
import { CgColorPicker } from "react-icons/cg";
import { FaGripLines } from "react-icons/fa";

export default function Color() {

    const [mode,setMode]=useState('fill'); //fill or stroke
    const [expanded, setExpanded] = useState(false);

    const [colorPallete, setColorPallete] = useState(['black','blue','lightGreen','yellow','red','grey'])
    const [activeColor, setActiveColor] = useState('black');
    const [activeStrokeColor,setActiveStrokeColor]=useState('black');

  const handleActiveColor = (color) => {//what happens when selecting a color spot
    if(mode=='fill') {
        setActiveColor(color)
    }else{
        setActiveStrokeColor(color)
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
                colorPallete.map((col)=>{
                    return <ColorSpot col={col} mode={mode} handleActiveColor={handleActiveColor}></ColorSpot>
                })
            }
        </div>

        {/* --- other options ----------------- */}
        <div 
            style={{
                display:'flex',flexDirection:'column',justifyContent:'space-around',alignItems:'center',
                height:'100px',paddingTop:'10px'
            }}
        >
            <IoIosColorPalette className='selectIcon'></IoIosColorPalette>{/* select another color */}
            <CgColorPicker className='selectIcon'></CgColorPicker>{/* eye dropper */}
            <FaPlus className='selectIcon'></FaPlus>{/* add new color to pallete */}
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
    <GoDotFill 
        style={{fontSize:'20px',cursor:'pointer',color:col}}
        onClick={()=>handleActiveColor(col)}
    >
    </GoDotFill>:
    <FaGripLines
            style={{fontSize:'20px',cursor:'pointer',color:col}}
            onClick={()=>handleActiveColor(col)}
    ></FaGripLines>}
    </>
  )
}
