import React from 'react'

export default function Selectors({mode,x1,x2,y1,y2}) {
  return (
 <>
    <div>
        <div className='selectors' id='TL' style={{top:`${y1-4}px`,left:`${x1-4}px`}}></div>
        <div className='selectors' id='TM' style={{top:`${y1-4}px`,left:`${x1+(x2-x1)/2-4}px`}}></div>
        <div className='selectors' id='TR' style={{top:`${y1-4}px`,left:`${x2-4}px`}}></div>
        <div className='selectors' id='BL' style={{top:`${y2-4}px`,left:`${x1-4}px`}}></div>
        <div className='selectors' id='BM' style={{top:`${y2-4}px`,left:`${x1+(x2-x1)/2-4}px`}}></div>
        <div className='selectors' id='BR' style={{top:`${y2-4}px`,left:`${x2-4}px`}}></div>
        <div className='selectors' id='LM' style={{top:`${y1+(y2-y1)/2-4}px`,left:`${x1-4}px`}}></div>
        <div className='selectors' id='RM' style={{top:`${y1+(y2-y1)/2-4}px`,left:`${x2-4}px`}}></div>
    </div>
 </>
  )
}
