import React, { useRef, useState } from 'react'
import { RiPaintFill } from "react-icons/ri";
import { MdOutlineBrush } from "react-icons/md";
import { IoIosColorPalette } from "react-icons/io";
import { FaPlus } from "react-icons/fa";
import { IoCloseCircleOutline } from "react-icons/io5";
import { updateRealCordinates } from './Clicks/Move';

export default function Color({currentSelectedIndex,elements,setElements,activeColor,setActiveColor,activeStrokeColor,setActiveStrokeColor,activeElem,setActiveElem}) {

    const [mode,setMode]=useState('fill'); //fill or stroke
    const [expanded, setExpanded] = useState(false);
    const [colorPalleteOpen, setColorPalleteOpen] = useState(false);

    const [colorPallete, setColorPallete] = useState(['#000000','#0000ff','#00ff00','#ffff00','#ff0000','#ffffff'])
    const [strokePallete, setStrokePallete] = useState(['#000000','#0000ff','#00ff00','#ffff00','#ff0000','#ffffff'])
    const [colorPickerColor, setColorPickerColor] = useState('#000000')
    const [colorSpotindex, setColorSpotIndex] = useState(null)
    const [strokeSpotindex, setStrokeSpotIndex] = useState(null)

    const addNewColor = () => {
        if(mode=='fill'){
            if(!colorPallete.includes(colorPickerColor)){
                setColorPallete([...colorPallete,colorPickerColor])
            }
        }else{
            if(!strokePallete.includes(colorPickerColor)){
                setStrokePallete([...strokePallete,colorPickerColor])
            }
        }

    }

    const removeColor = () => {
        if(mode=='fill'){
            let tmp=colorSpotindex-1
            setColorSpotIndex(tmp)
            setActiveColor(colorPallete[tmp])
            setColorPallete(colorPallete.filter((col,ind)=>ind!=colorSpotindex))
        }else{
            let tmp=strokeSpotindex-1
            setStrokeSpotIndex(tmp)
            setActiveStrokeColor(strokePallete[tmp])
            setStrokePallete(strokePallete.filter((col,ind)=>ind!=strokeSpotindex))
        }
    }

    const colorPickerRef=useRef(null)
    const colorPickerHandler = () => {
        setColorPalleteOpen(!colorPalleteOpen)
        colorPickerRef.current.click()
    }

  const handleActiveColor = (color,key) => {//what happens when selecting a color spot
    setColorPickerColor(color)
    if(mode=='fill') {
        setActiveColor(color);
        setColorSpotIndex(key)
        if(activeElem.length!=0)
        {
            updateRealCordinates(activeElem[0].x1,activeElem[0].y1,activeElem[0].x2,activeElem[0].y2,setActiveElem,setElements,currentSelectedIndex,elements,color, elements[currentSelectedIndex].roughElement.options.stroke,elements[currentSelectedIndex].type);          
        }
        
        
    }else{
        setActiveStrokeColor(color)
        setStrokeSpotIndex(key)
        if(activeElem.length!=0)
            {
                updateRealCordinates(activeElem[0].x1,activeElem[0].y1,activeElem[0].x2,activeElem[0].y2,setActiveElem,setElements,currentSelectedIndex,elements,elements[currentSelectedIndex].roughElement.options.fill, color,elements[currentSelectedIndex].type);          
            }
    }
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
            <div className='toolTipCov'>
                <RiPaintFill 
                    className='selectIcon'
                    style={{fontSize:'20px',cursor:'pointer',color:activeColor}} 
                    onClick={()=>handleExpanded('fill')}
                ></RiPaintFill>
                <p className='toolTip'>Fill</p>
            </div>
            <div className='toolTipCov'>
                <MdOutlineBrush 
                    className='selectIcon'
                    style={{fontSize:'20px',cursor:'pointer',color:activeStrokeColor}}
                    onClick={()=>handleExpanded('stroke')}
                ></MdOutlineBrush>
                <p className='toolTip'>Stroke</p>
            </div>
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
                mode=='fill'?colorPallete.map((col,index)=>{
                    return <ColorSpot key={index} col={col} mode={mode} handleActiveColor={handleActiveColor} activeSpotIndex={colorSpotindex} ind={index}></ColorSpot>
                }):strokePallete.map((col,index)=>{
                    return <ColorSpot key={index} col={col} mode={mode} handleActiveColor={handleActiveColor} activeSpotIndex={strokeSpotindex} ind={index}></ColorSpot>
                })
            }
        </div>

        {/* --- other options ----------------- */}
        <div 
            style={{
                display:'flex',flexDirection:'column',justifyContent:'start',alignItems:'center',
                position:'relative',paddingTop:'13px',
                height:'100px'
            }}
        >
            <IoIosColorPalette style={{marginBottom:'5px'}} className='selectIcon' onClick={colorPickerHandler}></IoIosColorPalette>
            <FaPlus style={{marginBottom:'5px'}} className='selectIcon' onClick={addNewColor}></FaPlus>
            {mode=='fill'&&colorSpotindex>5||mode=='stroke'&&strokeSpotindex>5?<IoCloseCircleOutline className='selectIcon' onClick={removeColor}></IoCloseCircleOutline>:''}
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
const ColorSpot=({ mode, col, handleActiveColor,ind,activeSpotIndex })=>{
  return (
    <>
    {mode=='fill'?
    <div 
        style={{
            width:'15px',height:'15px',marginTop:'3px',marginBottom:'3px',
            border:activeSpotIndex===ind?'3px solid grey':'1px solid grey',
            borderRadius:'50%',
            backgroundColor:col,
            cursor :'pointer'
        }}
        onClick={()=>handleActiveColor(col,ind)}
    >
    </div>:
    <div 
        style={{
            height:'15px',width:'15px',position:'relative',
            marginBottom:'3px',marginTop:'3px',
            cursor :'pointer'
        }}
        onClick={()=>handleActiveColor(col,ind)}
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
                border:activeSpotIndex===ind?'3px solid grey':'1px solid grey'
            }}
        >
        </div>
    </div>}
    </>
  )
}
