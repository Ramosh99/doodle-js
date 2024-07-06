import React from 'react';

const Buttons = ({ handleModeChange, handleSave, handleLoad }) => {
    return (
        <div style={{ position: 'absolute', top: 0, left: 0, padding: 10 }}>
            <button onClick={() => handleModeChange('rectangle')}>Rectangle</button>
            <button onClick={() => handleModeChange('line')}>Line</button>
            <button onClick={() => handleModeChange('grab')}>Grab</button>
            <button onClick={handleSave}>Save</button>
            <input type="file" onChange={handleLoad} />
        </div>
    );
};

export default Buttons;
