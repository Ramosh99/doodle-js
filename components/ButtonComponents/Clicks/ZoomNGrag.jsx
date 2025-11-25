import React from 'react';
import { useEffect } from 'react';

const ZoomNGrag = ({ zoom, setZoom, setPan }) => {
  useEffect(() => {
    const panFunction = (e) => {
      if (e.ctrlKey) {
        e.preventDefault(); // Prevent the default action to ensure zoom behavior is smooth
        setZoom((prevZoom) => {
          const newZoom = prevZoom + e.deltaY * -0.01;
          // Correctly clamp newZoom between 0.25 and 2.5
          return Math.min(Math.max(newZoom, 0.25), 2.5);
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
  }, [setZoom, setPan]); // Include setZoom and setPan in the dependency array

  const handleZoomIn = () => {
    setZoom((prevZoom) => Math.min(prevZoom + 0.1, 2.5));
  };

  const handleZoomOut = () => {
    setZoom((prevZoom) => Math.max(prevZoom - 0.1, 0.25));
  };

  return (
  <>
     <button
  style={{ 
    position: 'fixed', bottom: '10px', left: '150px', zIndex: 20,
    display: 'flex', justifyContent: 'space-around', alignItems: 'center',
    width: '30px', height: '30px', backgroundColor: 'white', borderRadius: '4px',
    boxShadow: '0 0 3px lightGrey',
    cursor: 'pointer' // Add cursor pointer for better UX
  }}
  onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f0f0'} // Change background color on hover
  onMouseLeave={(e) => e.target.style.backgroundColor = 'white'} // Revert background color on mouse leave
  onClick={handleZoomOut}
>
  -
</button>
<div style={{ 
    position: 'fixed', bottom: '10px', left: '185px', zIndex: 20,
    display: 'flex', justifyContent: 'space-around', alignItems: 'center',
    width: '60px', height: '30px', backgroundColor: 'white', borderRadius: '4px',
    boxShadow: '0 0 3px lightGrey' 
}}>  
    <span>
    {`${Math.round(zoom * 100)}%`}
    </span>
</div>
<button
  style={{ 
    position: 'fixed', bottom: '10px', left: '250px', zIndex: 20,
    display: 'flex', justifyContent: 'space-around', alignItems: 'center',
    width: '30px', height: '30px', backgroundColor: 'white', borderRadius: '4px',
    boxShadow: '0 0 3px lightGrey',
    cursor: 'pointer' // Add cursor pointer for better UX
  }}
  onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f0f0'} // Change background color on hover
  onMouseLeave={(e) => e.target.style.backgroundColor = 'white'} // Revert background color on mouse leave
  onClick={handleZoomIn}
>
  +
</button>
    </>
  );
}

export default ZoomNGrag;