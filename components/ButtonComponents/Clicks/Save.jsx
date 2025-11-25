export const handleSave = ({elements}) => {



    const json = JSON.stringify(elements);
    console.log('data store in ',elements);
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

 

export default Save;
