import React from 'react';
import { useEffect } from 'react';

const ZoomNGrag = ({zoom,setZoom,setPan}) => {
    useEffect(() => {
        const panFunction = (e) => {
          if (e.ctrlKey) {
            setZoom((prevZoom) => {
              const newZoom = prevZoom + e.deltaY * -0.01;
              return Math.min(Math.max(newZoom, 0.25), 2.5); // Clamp newZoom between 0.5 and 2
            });
          } else {
            setPan((prevPan) => ({
              x: prevPan.x - e.deltaX,
              y: prevPan.y - e.deltaY,
            }));
          }
        };
        document.addEventListener('wheel', panFunction, { passive: false });
        return () => {
          document.removeEventListener('wheel', panFunction);
        };
      }, []);
    return (
        <div style={{ 
            position: 'fixed', bottom:'10px', left:'150px',
            display:'flex',justifyContent:'space-around',alignItems:'center',
            width:'100px',height:'30px',backgroundColor:'white',borderRadius:'4px',
            boxShadow:'0 0 3px lightGrey' 
            }}>  
            <span>
            {`${Math.round(zoom * 100)}%`}
            </span>
        </div>
    );
}

export default ZoomNGrag;
