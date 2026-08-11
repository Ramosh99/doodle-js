import rough from 'roughjs/bundled/rough.esm';
import { ElementType, Rectangle, Line } from '../../Types/types';
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
    case 'ellipse':
      roughCanvas.draw(element.roughElement);
      break;
    case 'paint_brush': {
      const stroke = getSvgPathFromStroke(getStroke(element.points, {
        size: 5,
        thinning: 0.7,
        smoothing: 0.5,
      }));
      ctx.fillStyle = element.color || '#000000';
      ctx.fill(new Path2D(stroke));
      break;
    }
    default:
      break;
  }
};

const createElement = {
  [ElementType.RECTANGLE]: (x1, y1, x2, y2, fillcolor, strokecolor, sw = 2) => {
    const roughElement = generator.rectangle(x1, y1, x2 - x1, y2 - y1, {
      fill: fillcolor,
      stroke: strokecolor,
      strokeWidth: sw,
      roughness: 2,
      fillWeight: 3,
      fillStyle: 'solid',
    });
    return new Rectangle(x1, y1, x2, y2, roughElement);
  },

  [ElementType.LINE]: (x1, y1, x2, y2, fillcolor, strokecolor, sw = 2) => {
    const roughElement = generator.line(x1, y1, x2, y2, {
      roughness: 2,
      stroke: strokecolor,
      strokeWidth: sw,
    });
    return new Line(x1, y1, x2, y2, roughElement);
  },

  [ElementType.CIRCLE]: (x1, y1, x2, y2, fillcolor, strokecolor, sw = 2) => {
    const radius = Math.hypot(x2 - x1, y2 - y1);
    const roughElement = generator.circle(x1, y1, radius * 2, {
      fillStyle: 'solid',
      roughness: 2,
      fill: fillcolor,
      stroke: strokecolor,
      strokeWidth: sw,
    });
    return { type: ElementType.CIRCLE, x1, y1, x2, y2, roughElement };
  },

  [ElementType.ELLIPSE]: (x1, y1, x2, y2, fillcolor, strokecolor, sw = 2) => {
    const centerX = (x1 + x2) / 2;
    const centerY = (y1 + y2) / 2;
    const width = Math.abs(x2 - x1);
    const height = Math.abs(y2 - y1);
    const roughElement = generator.ellipse(centerX, centerY, width, height, {
      fill: fillcolor,
      fillStyle: 'solid',
      roughness: 2,
      stroke: strokecolor,
      strokeWidth: sw,
    });
    return { type: ElementType.ELLIPSE, x1, y1, x2, y2, roughElement };
  },

  [ElementType.TRIANGLE]: (x1, y1, x2, y2, fillcolor, strokecolor, sw = 2) => {
    const roughElement = generator.polygon(
      [[x1, y1], [x2, y2], [(2 * x1) - x2, y2], [x1, y1]],
      { fill: fillcolor, fillStyle: 'solid', roughness: 2, stroke: strokecolor, strokeWidth: sw }
    );
    return { type: ElementType.TRIANGLE, x1, y1, x2, y2, roughElement };
  },

  [ElementType.ARROW]: (x1, y1, x2, y2, fillcolor, strokecolor, sw = 2) => {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const arrowLength = 20;
    const arrowPoint1 = [
      x2 - arrowLength * Math.cos(angle - Math.PI / 6),
      y2 - arrowLength * Math.sin(angle - Math.PI / 6),
    ];
    const arrowPoint2 = [
      x2 - arrowLength * Math.cos(angle + Math.PI / 6),
      y2 - arrowLength * Math.sin(angle + Math.PI / 6),
    ];
    const roughElement = generator.linearPath(
      [[x1, y1], [x2, y2], arrowPoint1, [x2, y2], arrowPoint2],
      { stroke: strokecolor, roughness: 2, strokeWidth: sw }
    );
    return { type: ElementType.ARROW, x1, y1, x2, y2, roughElement };
  },

  [ElementType.PAINT_BRUSH]: (x1, y1, x2, y2, fillColor) => {
    return {
      type: ElementType.PAINT_BRUSH,
      points: [{ x: x1, y: y1 }],
      color: fillColor || '#000000',
      x1, y1, x2: x1, y2: y1,
    };
  },

  [ElementType.TEXT]: (x1, y1, x2, y2) => {
    return { type: ElementType.TEXT, x1, y1, x2, y2 };
  },
};

const Shapes = () => null;

export { createElement };
export default Shapes;
