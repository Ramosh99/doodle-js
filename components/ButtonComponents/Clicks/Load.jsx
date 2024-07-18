import React from 'react';
import { ElementType } from 'components/Types/types';
import { createElement } from './Shapes';

const handleLoad = ({setElements}) => {
    const file = event.target.files[0];
    if (!file) return;
  
    const reader = new FileReader();
    reader.onload = (e) => {
      const json = e.target.result;
      const loadedElements = JSON.parse(json);
      console.log(loadedElements);
      const elementsToSet = loadedElements.flatMap(({ type, x1, y1, x2, y2, roughElement, points }) => {
        if (type !== ElementType.PAINT_BRUSH) {
          return createElement[type](x1, y1, x2, y2, roughElement.options.fill, roughElement.options.stroke);
        } else {
          return { type: ElementType.PAINT_BRUSH, points }; // Directly return the points
        }
      }).filter(element => element !== null);
  
      setElements(elementsToSet);
    };
  
    reader.readAsText(file);

}

export default handleLoad;
