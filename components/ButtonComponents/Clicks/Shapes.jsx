import rough from 'roughjs/bundled/rough.esm';
import { ElementType, Rectangle, Line } from '../../Types/types';

const generator = rough.generator({
    roughness: 0,
    strokeWidth: 3,
    stroke: 'black',
    bowing: 0,
});

const createElement = {
    [ElementType.RECTANGLE]: (x1, y1, x2, y2) => {
        const roughElement = generator.rectangle(x1, y1, x2 - x1, y2 - y1);
        return new Rectangle(x1, y1, x2, y2, roughElement);
    },
    [ElementType.LINE]: (x1, y1, x2, y2) => {
        const roughElement = generator.line(x1, y1, x2, y2);
        return new Line(x1, y1, x2, y2, roughElement);
    }
};

const Shapes = () => {
    return null;
};

export { createElement };
export default Shapes;
