import React from 'react';

// Component for the control buttons
const Buttons = ({ handleModeChange }) => {
    return (
        <div style={{ 
            position: 'fixed', top: 10, left: 10, 
            zIndex: 1 , 
            width:'200px',
            display:'flex',justifyContent:"space-around",alignItems:'center',
            boxShadow:'0 0 3px 0 lightGrey',
            }}>
            <button onClick={() => handleModeChange('grab')}>Grab</button>
            <button onClick={() => handleModeChange('rectangle')}>Rectangle</button>
            <button onClick={() => handleModeChange('line')}>Line</button>
        </div>
    );
};

export default Buttons;
