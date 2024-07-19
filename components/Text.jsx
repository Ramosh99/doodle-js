import React from 'react'

export default function Text(prop) {

  return (
        <textarea 
            style={{
                position:'absolute',left:`${prop.prop.x1}px`,top:`${prop.prop.y1}px`,
                fontSize:'20px',
                width:'200px',
                height:'50px'
            }}
        >Type</textarea>
  )
}
