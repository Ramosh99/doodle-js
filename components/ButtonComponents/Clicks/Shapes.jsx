import rough from 'roughjs/bundled/rough.esm';
import { ElementType, Rectangle, Line } from '../../Types/types';
import { useEffect } from 'react';

const generator = rough.generator();

const createElement = {
    [ElementType.RECTANGLE]: (x1, y1, x2, y2,fillcolor,strokecolor) => {
      const roughElement = generator.rectangle(x1, y1, x2 - x1, y2 - y1, {
        fill:fillcolor,
        stroke: strokecolor,
        strokeWidth: 2,
        roughness: 2,
      });
      return new Rectangle(x1, y1, x2, y2, roughElement);
    },
    [ElementType.LINE]: (x1, y1, x2, y2,fillcolor,strokecolor) => {
      const roughElement = generator.line(x1, y1, x2, y2, {
        stroke: strokecolor,
        strokeWidth: 2,
      });
      return new Line(x1, y1, x2, y2, roughElement);
    },
    [ElementType.CIRCLE]: (x1, y1, x2, y2,fillcolor,strokecolor) => {
      const radius = Math.hypot(x2 - x1, y2 - y1);
      const roughElement = generator.circle(x1, y1, radius * 2, {
        fill:fillcolor,
        stroke: strokecolor,
        strokeWidth: 2,
      });
      return { type: ElementType.CIRCLE, x1, y1, x2, y2, roughElement };
    },
    [ElementType.TRIANGLE]: (x1, y1, x2, y2,fillcolor,strokecolor) => {
      const roughElement = generator.polygon([[x1, y1], [x2, y2], [(2*x1)-x2, y2], [x1, y1]], {
        fill:fillcolor,
        stroke: strokecolor,
        strokeWidth: 2,
      });
      return { type: ElementType.TRIANGLE, x1, y1, x2, y2, roughElement };
    },

  };
  
  

  const Shapes = ({ handleModeChange, elements }) => {
    useEffect(() => {
      const handleKeyDown = (e) => {
        switch (e.key) {
          case 'r':
            e.preventDefault();
            handleModeChange(ElementType.RECTANGLE);
            break;
          case 'l':
            e.preventDefault();
            handleModeChange(ElementType.LINE);
            break;
          case 'h':
            e.preventDefault();
            handleModeChange('grab');
            break;
          case 'v':
            e.preventDefault();
            handleModeChange('select');
            break;
          case 'c':
            e.preventDefault();
            handleModeChange(ElementType.CIRCLE);
            break;
          case 't':
            e.preventDefault();
            handleModeChange(ElementType.TRIANGLE);
            break;
          case 's':
            e.preventDefault();
            handleModeChange(ElementType.SQUARE);
            break;
          default:
            break;
        }
      };
  
      window.addEventListener('keydown', handleKeyDown);
  
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }, [elements]);
  
    return null;
  };
  
  

export { createElement };
export default Shapes;
