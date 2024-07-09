import rough from 'roughjs/bundled/rough.esm';
import { ElementType, Rectangle, Line } from '../../Types/types';
import { useEffect } from 'react';

const generator = rough.generator();

const createElement = {
    [ElementType.RECTANGLE]: (x1, y1, x2, y2) => {
        const roughElement = generator.rectangle(x1, y1, x2 - x1, y2 - y1, {
            stroke: '#000000', // Explicitly set stroke color for rectangle
            strokeWidth: 2,  // Explicitly set stroke width for rectangle
            roughness: 2, // Adjusted roughness for a smoother appearance
        });
        return new Rectangle(x1, y1, x2, y2, roughElement);
    },
    [ElementType.LINE]: (x1, y1, x2, y2) => {
        const roughElement = generator.line(x1, y1, x2, y2, {
            stroke: '#000000', // Explicitly set stroke color for line
            strokeWidth: 2,  // Explicitly set stroke width for line
        });
        return new Line(x1, y1, x2, y2, roughElement);
    }
};

const Shapes = ({ handleModeChange, elements }) => {
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'r') {
                e.preventDefault(); // Prevent browser default behavior (like undoing text input)
                handleModeChange('rectangle');
            } else if (e.key === 'l') {
                e.preventDefault();
                handleModeChange('line');
            } else if (e.key === 'h') {
                e.preventDefault();
                handleModeChange('grab');
            } else if (e.key === 'v') {
                e.preventDefault();
                handleModeChange('select');
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
