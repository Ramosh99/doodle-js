export  const findElement=(setActiveElem,ar,x,y)=>{
    let foundElements=[]
    ar.find((el) => {
        if (el.type === 'rectangle' && (x>=el.x1 && x<=el.x2) && (y>=el.y1 && y<=el.y2)) {
          foundElements.push(el)
        }
      });
    setActiveElem(foundElements);
    console.log('activeElem:',foundElements)
}