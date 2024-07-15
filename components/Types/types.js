export const ElementType = {
    RECTANGLE: 'rectangle',
    LINE: 'line',
    CIRCLE: 'circle',
    TRIANGLE: 'triangle',
    SQUARE: 'square',
    ARROW: 'arrow',
    PAINT_BRUSH: 'paint_brush'
};

  
  

export class Rectangle {
    constructor(x1, y1, x2, y2, roughElement) {
        this.type = ElementType.RECTANGLE;
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this.roughElement = roughElement;
    }
}

export class Line {
    constructor(x1, y1, x2, y2, roughElement) {
        this.type = ElementType.LINE;
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this.roughElement = roughElement;
    }
}
