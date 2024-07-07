

export const handleSave = (elements) => {
    const json = JSON.stringify(elements);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'canvas.json';
    link.click();
};

const Save = () => {
    return null;
};

// export const handleLoad = (event, setElements) => {
//     const file = event.target.files[0];
//     if (!file) return;
    
//     const reader = new FileReader();
//     reader.onload = (e) => {
//         const json = e.target.result;
//         const loadedElements = JSON.parse(json);
        
//         // Map loaded elements to their corresponding shapes
//         const elementsToSet = loadedElements.map(({ type, x1, y1, x2, y2 }) => {
//             return createElement[type](x1, y1, x2, y2);
//         }).filter(element => element !== null); // Remove any null elements
        
//         setElements(elementsToSet);
//     };
    
//     reader.readAsText(file);
// };  

export default Save;
