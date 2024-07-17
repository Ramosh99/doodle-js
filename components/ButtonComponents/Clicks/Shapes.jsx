import rough from 'roughjs/bundled/rough.esm';
import { ElementType, Rectangle, Line } from '../../Types/types';
import { useEffect } from 'react';
import { getSvgPathFromStroke } from '@/app/drawio/utils';
import getStroke from "perfect-freehand";


const generator = rough.generator();

export const drawElement = (roughCanvas, element, ctx) => {
  switch (element.type) {
    case 'rectangle':
    case 'line':
    case 'circle':
    case 'triangle':
    case 'square':
    case 'arrow':
      roughCanvas.draw(element.roughElement);
      break;
    case 'paint_brush':
      const stroke = getSvgPathFromStroke(getStroke(element.points, {
        size: 5,
        thinning: 0.7,
        smoothing: 0.5,
      }));
      ctx.fillStyle = 'red'; // Set fill style to red
      ctx.fill(new Path2D(stroke));
      break;
    default:
      console.log("no element type found");
      break;
  }
}


const createElement = {
    [ElementType.RECTANGLE]: (x1, y1, x2, y2,fillcolor,strokecolor) => {
      const roughElement = generator.rectangle(x1, y1, x2 - x1, y2 - y1, {
        fill:fillcolor,
        stroke: strokecolor,
        strokeWidth: 2,
        roughness: 2,
        fillWeight: 3, // thicker lines for hachure
        fillStyle: 'solid' // solid fill
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
    [ElementType.ARROW]: (x1, y1, x2, y2, strokeColor) => {
      const angle = Math.atan2(y2 - y1, x2 - x1);
      const arrowLength = 20; // Length of the arrowhead lines
    
      const arrowPoint1 = [
        x2 - arrowLength * Math.cos(angle - Math.PI / 6),
        y2 - arrowLength * Math.sin(angle - Math.PI / 6)
      ];
    
      const arrowPoint2 = [
        x2 - arrowLength * Math.cos(angle + Math.PI / 6),
        y2 - arrowLength * Math.sin(angle + Math.PI / 6)
      ];
    
      const roughElement = generator.linearPath([
        [x1, y1], // Start of the arrow tail
        [x2, y2], // End of the arrow tail
        arrowPoint1, // One side of the arrowhead
        [x2, y2], // Back to the end of the arrow tail
        arrowPoint2, // Other side of the arrowhead
      ]
    ,        
    {
      stroke: strokeColor,
      strokeWidth: 2,
    }
    );
    
      // return roughElement;
      return { type: ElementType.ARROW, x1, y1, x2, y2, roughElement };
    },
    [ElementType.PAINT_BRUSH]: (x1, y1) => {({
      type: ElementType.PAINT_BRUSH,
      })
      return { type: ElementType.PAINT_BRUSH, points:[{x:x1,y:y1}] };
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
