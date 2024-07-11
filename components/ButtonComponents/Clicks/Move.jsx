import rough from "roughjs/bundled/rough.esm";
//check mouse pointer is on the rectangle
export function isMouseOnRectangle(x, y, shape) {
  let shapeLeft = shape.x1;
  let shapeRight = shape.x2;
  let shapeTop = shape.y1;
  let shapeBottom = shape.y2;
  if (x > shapeLeft && x < shapeRight && y > shapeTop && y < shapeBottom) {
    return true;
  } else {
    return false;
  }
}

//check mouse pointer is on the line
export function isMouseOnLineSegment(
  mouseX,
  mouseY,
  x1,
  y1,
  x2,
  y2,
  tolerance = 5
) {
  // Calculate distance between the point and the two ends of the line
  const distanceFromP1 = Math.sqrt((mouseX - x1) ** 2 + (mouseY - y1) ** 2);
  const distanceFromP2 = Math.sqrt((mouseX - x2) ** 2 + (mouseY - y2) ** 2);

  // Calculate the total length of the line segment
  const lineLength = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  // Check if the point is close enough to the line segment within the tolerance
  return (
    distanceFromP1 + distanceFromP2 >= lineLength - tolerance &&
    distanceFromP1 + distanceFromP2 <= lineLength + tolerance
  );
}

//for identify mouse click is inside the shape
export function isMouseInShape(x, y, shape) {
  if (shape.type == "rectangle") {
    return isMouseOnRectangle(x, y, shape);
  } else if (shape.type == "line") {
    return isMouseOnLineSegment(x, y, shape.x1, shape.y1, shape.x2, shape.y2);
  }
}

function distanceToLineSegment(x, y, x1, y1, x2, y2) {
  const A = x - x1;
  const B = y - y1;
  const C = x2 - x1;
  const D = y2 - y1;

  const dot = A * C + B * D;
  const len_sq = C * C + D * D;
  let param = dot / len_sq;

  if (param < 0 || (x1 === x2 && y1 === y2)) {
    param = 0;
  } else if (param > 1) {
    param = 1;
  }

  const xx = x1 + param * C;
  const yy = y1 + param * D;
  const dx = x - xx;
  const dy = y - yy;
  return Math.sqrt(dx * dx + dy * dy);
}

// Calculate the minimum distance from a point to any line segment of the shape
function minDistanceToShape(x, y, shape) {
  if (shape.type === "rectangle") {
    const distances = [
      distanceToLineSegment(x, y, shape.x1, shape.y1, shape.x2, shape.y1),
      distanceToLineSegment(x, y, shape.x2, shape.y1, shape.x2, shape.y2),
      distanceToLineSegment(x, y, shape.x2, shape.y2, shape.x1, shape.y2),
      distanceToLineSegment(x, y, shape.x1, shape.y2, shape.x1, shape.y1),
    ];
    return Math.min(...distances);
  } else if (shape.type === "line") {
    return distanceToLineSegment(x, y, shape.x1, shape.y1, shape.x2, shape.y2);
  }
  return Infinity;
}

export function selectTheShapeMouseDown(
  startX,
  startY,
  setStarx,
  setStary,
  setIsDragging,
  setCurrentSelectedIndex,
  setActiveElem,
  elements,
  currentSelectedIndex,
  resizingPoint,
  isResizing,
  setIsResizing
) {
  //select the clicked shape
  setStarx(startX);
  setStary(startY);

  let closestIndex = -1;
  let closestDistance = Infinity;

  elements.forEach((shape, index) => {
    if (isMouseInShape(startX, startY, shape)) {
      const distance = minDistanceToShape(startX, startY, shape);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    }
  });

  if (closestIndex !== -1) {
    setCurrentSelectedIndex(closestIndex);
    setIsDragging(true);
    setActiveElem([elements[closestIndex]]);
    if (elements[closestIndex].type === 'rectangle' && resizingPoint) {
      setIsResizing(true);
    }
  } else {
    setIsDragging(false);
    setActiveElem([]);
  }
}

export const updateShapeCordinates = (
  index,
  newX1,
  newY1,
  newx2,
  newy2,
  elements,
  setActiveElem,
  setElements,
  setUndoStack,
  setRedoStack,
  isDragging,
  isResizing,
  resizingPoint
) => {
  const generator = rough.generator({
    roughness: 0,
    strokeWidth: 3,
    stroke: "black",
    bowing: 0,
  });

  // Ensure the index is within the bounds of the elements array
  if (index < 0 || index >= elements.length) {
    console.error("Index out of bounds");
    return;
  }

  setUndoStack((prev) => [...prev, elements]);
  // Create a copy of the elements array
  const newElements = [...elements];

  // Update the coordinates of the specified rectangle
  if (elements[index].type == "rectangle") {
    if (!isDragging && isResizing) {
      if (resizingPoint == "topleft") {
        const updatedRectangle = {
          ...newElements[index],
          x1: newX1,
          y1: newY1,
          x2: elements[index].x2,
          y2: elements[index].y2,
          roughElement: generator.rectangle(
            newX1,
            newY1,
            elements[index].x2 - newX1,
            elements[index].y2 - newY1
          ),
        };

        // Replace the old rectangle with the updated one
        newElements[index] = updatedRectangle;

        // Update the state with the new array
        setActiveElem([updatedRectangle]);
        setElements(newElements);
      } else if (resizingPoint == "topmiddle") {
        const updatedRectangle = {
          ...newElements[index],
          x1: elements[index].x1,
          y1: newY1,
          x2: elements[index].x2,
          y2: elements[index].y2,
          roughElement: generator.rectangle(
            elements[index].x1,
            newY1,
            elements[index].x2 - elements[index].x1,
            elements[index].y2 - newY1
          ),
        };

        // Replace the old rectangle with the updated one
        newElements[index] = updatedRectangle;

        // Update the state with the new array
        setActiveElem([updatedRectangle]);
        setElements(newElements);
      } else if (resizingPoint == "topright") {
        const updatedRectangle = {
          ...newElements[index],
          x1: elements[index].x1,
          y1: newY1,
          x2: newX1,
          y2: elements[index].y2,
          roughElement: generator.rectangle(
            elements[index].x1,
            newY1,
            newX1 - elements[index].x1,
            elements[index].y2 - newY1
          ),
        };

        // Replace the old rectangle with the updated one
        newElements[index] = updatedRectangle;

        // Update the state with the new array
        setActiveElem([updatedRectangle]);
        setElements(newElements);
      } else if (resizingPoint == "bottomleft") {
        const updatedRectangle = {
          ...newElements[index],
          x1: newX1,
          y1: elements[index].y1,
          x2: elements[index].x2,
          y2: newY1,
          roughElement: generator.rectangle(
            newX1,
            elements[index].y1,
            elements[index].x2 - newX1,
            newY1 - elements[index].y1
          ),
        };

        // Replace the old rectangle with the updated one
        newElements[index] = updatedRectangle;

        // Update the state with the new array
        setActiveElem([updatedRectangle]);
        setElements(newElements);
      } else if (resizingPoint == "bottommiddle") {
        const updatedRectangle = {
          ...newElements[index],
          x1: elements[index].x1,
          y1: elements[index].y1,
          x2: elements[index].x2,
          y2: newY1,
          roughElement: generator.rectangle(
            elements[index].x1,
            elements[index].y1,
            elements[index].x2 - elements[index].x1,
            newY1 - elements[index].y1
          ),
        };

        // Replace the old rectangle with the updated one
        newElements[index] = updatedRectangle;

        // Update the state with the new array
        setActiveElem([updatedRectangle]);
        setElements(newElements);
      } else if (resizingPoint == "bottomright") {
        const updatedRectangle = {
          ...newElements[index],
          x1: elements[index].x1,
          y1: elements[index].y1,
          x2: newX1,
          y2: newY1,
          roughElement: generator.rectangle(
            elements[index].x1,
            elements[index].y1,
            newX1 - elements[index].x1,
            newY1 - elements[index].y1
          ),
        };

        // Replace the old rectangle with the updated one
        newElements[index] = updatedRectangle;

        // Update the state with the new array
        setActiveElem([updatedRectangle]);
        setElements(newElements);
      } else if (resizingPoint == "leftmiddle") {
        const updatedRectangle = {
          ...newElements[index],
          x1: newX1,
          y1: elements[index].y1,
          x2: elements[index].x2,
          y2: elements[index].y2,
          roughElement: generator.rectangle(
            newX1,
            elements[index].y1,
            elements[index].x2 - newX1,
            elements[index].y2 - elements[index].y1
          ),
        };

        // Replace the old rectangle with the updated one
        newElements[index] = updatedRectangle;

        // Update the state with the new array
        setActiveElem([updatedRectangle]);
        setElements(newElements);
      } else if (resizingPoint == "rightmiddle") {
        const updatedRectangle = {
          ...newElements[index],
          x1: elements[index].x1,
          y1: elements[index].y1,
          x2: newX1,
          y2: elements[index].y2,
          roughElement: generator.rectangle(
            elements[index].x1,
            elements[index].y1,
            newX1 - elements[index].x1,
            elements[index].y2 - elements[index].y1
          ),
        };

        // Replace the old rectangle with the updated one
        newElements[index] = updatedRectangle;

        // Update the state with the new array
        setActiveElem([updatedRectangle]);
        setElements(newElements);
      }
    } else {
      const updatedRectangle = {
        ...newElements[index],
        x1: newX1,
        y1: newY1,
        x2: newx2,
        y2: newy2,
        roughElement: generator.rectangle(
          newX1,
          newY1,
          newx2 - newX1,
          newy2 - newY1
        ),
      };

      // Replace the old rectangle with the updated one
      newElements[index] = updatedRectangle;

      // Update the state with the new array
      setActiveElem([updatedRectangle]);
      setElements(newElements);
    }
  } else if (elements[index].type == "line") {
    if (!isDragging && isResizing) {
      if (resizingPoint == "starting") {
        const updatedLine = {
          ...newElements[index],
          x1: newX1,
          y1: newY1,
          x2: elements[index].x2,
          y2: elements[index].y2,
          roughElement: generator.line(
            newX1,
            newY1,
            elements[index].x2,
            elements[index].y2
          ),
        };

        // Replace the old rectangle with the updated one
        newElements[index] = updatedLine;

        // Update the state with the new array
        setActiveElem([updatedLine]);
        setElements(newElements);
      } else if (resizingPoint == "ending") {
        const updatedLine = {
          ...newElements[index],
          x1: elements[index].x1,
          y1: elements[index].y1,
          x2: newX1,
          y2: newY1,
          roughElement: generator.line(
            elements[index].x1,
            elements[index].y1,
            newX1,
            newY1
          ),
        };

        // Replace the old rectangle with the updated one
        newElements[index] = updatedLine;

        // Update the state with the new array
        setActiveElem([updatedLine]);
        setElements(newElements);
      }
    } else {
      const updatedLine = {
        ...newElements[index],
        x1: newX1,
        y1: newY1,
        x2: newx2,
        y2: newy2,
        roughElement: generator.line(newX1, newY1, newx2, newy2),
      };

      // Replace the old rectangle with the updated one
      newElements[index] = updatedLine;

      // Update the state with the new array
      setActiveElem([updatedLine]);
      setElements(newElements);
    }
  }
};

export function selectTheShapeMove(
  mouseX,
  mouseY,
  isDragging,
  starx,
  stary,
  currentSelectedIndex,
  elements,
  setActiveElem,
  setElements,
  setStarx,
  setStary,
  setUndoStack,
  setRedoStack,
  resizingPoint,
  isResizing,
  setIsResizing
) {
  if (!isDragging && !isResizing) {
    return;
  } else if (isDragging) {
    let dx = mouseX - starx;
    let dy = mouseY - stary;

    let newx1 = elements[currentSelectedIndex].x1 + dx;
    let newy1 = elements[currentSelectedIndex].y1 + dy;
    let newx2 = elements[currentSelectedIndex].x2 + dx;
    let newy2 = elements[currentSelectedIndex].y2 + dy;

    updateShapeCordinates(
      currentSelectedIndex,
      newx1,
      newy1,
      newx2,
      newy2,
      elements,
      setActiveElem,
      setElements,
      setUndoStack,
      setRedoStack,
      isDragging,
      isResizing,
      resizingPoint
    );

    setStarx(mouseX);
    setStary(mouseY);
  } else if (isResizing) {
    updateShapeCordinates(
      currentSelectedIndex,
      mouseX,
      mouseY,
      mouseX,
      mouseY,
      elements,
      setActiveElem,
      setElements,
      setUndoStack,
      setRedoStack,
      isDragging,
      isResizing,
      resizingPoint
    );

    setStarx(mouseX);
    setStary(mouseY);
  }
}
export function selectTheShapeMouseUp(
  isDragging,
  setIsDragging,
  setUndoStack,
  elements,
  isResizing,
  setIsResizing
) {
  if (!isDragging) {
    setIsResizing(false);
    return;
  }
  setIsDragging(false);
}

export function selectTheRectangleMouseOut(isDragging, setIsDragging) {
  if (!isDragging) {
    return;
  }
  setIsDragging(false);
}
