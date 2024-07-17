import React from "react";
import { useEffect } from "react";

export default function Selectors({
  isResizing,
  mode,
  setMode,
  activeElem,
  resizingPoint,
  setResizingPoint,
  setIsResizing,
  setIsDragging,
  pan,
  zoom,
  shape
}) {
  const handleCornerClick = (corner) => {
    // identify resizing points
    setResizingPoint(corner);
    setIsResizing(true);
    setIsDragging(false);
  };

  useEffect(() => {
    const handleMouseUp = () => {
      setIsResizing(false);
      setIsDragging(false);
      setResizingPoint("");
    };

    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [setIsResizing, setIsDragging, setResizingPoint]);

  if (!activeElem.length || mode !== "select") {
    return null;
  }

  const { type, x1, x2, y1, y2 } = shape;


    // Adjust positions according to the current pan and zoom values
    const adjustedX1 = x1 * zoom + pan.x;
    const adjustedX2 = x2 * zoom + pan.x;
    const adjustedY1 = y1 * zoom + pan.y;
    const adjustedY2 = y2 * zoom + pan.y;
    
  if (type === "rectangle") {
    return (
      <div>
        <div
          className="selectors scale-cursorTL"
          id="TL"
          style={{ top: `${adjustedY1 - 4}px`, left: `${adjustedX1 - 4}px` }}
          onMouseDown={() => handleCornerClick("topleft")}
        ></div>
        <div
          className="selectors scale-cursorTM"
          id="TM"
          style={{ top: `${adjustedY1 - 4}px`, left: `${adjustedX1 + (adjustedX2 - adjustedX1) / 2 - 4}px` }}
          onMouseDown={() => handleCornerClick("topmiddle")}
        ></div>
        <div
          className="selectors scale-cursorTR"
          id="TR"
          style={{ top: `${adjustedY1 - 4}px`, left: `${adjustedX2 - 4}px` }}
          onMouseDown={() => handleCornerClick("topright")}
        ></div>
        <div
          className="selectors scale-cursorBL"
          id="BL"
          style={{ top: `${adjustedY2 - 4}px`, left: `${adjustedX1 - 4}px` }}
          onMouseDown={() => handleCornerClick("bottomleft")}
        ></div>
        <div
          className="selectors scale-cursorBM"
          id="BM"
          style={{ top: `${adjustedY2 - 4}px`, left: `${adjustedX1 + (adjustedX2 - adjustedX1) / 2 - 4}px` }}
          onMouseDown={() => handleCornerClick("bottommiddle")}
        ></div>
        <div
          className="selectors scale-cursorBR"
          id="BR"
          style={{ top: `${adjustedY2 - 4}px`, left: `${adjustedX2 - 4}px` }}
          onMouseDown={() => handleCornerClick("bottomright")}
        ></div>
        <div
          className="selectors scale-cursorLM"
          id="LM"
          style={{ top: `${adjustedY1 + (adjustedY2 - adjustedY1) / 2 - 4}px`, left: `${adjustedX1 - 4}px` }}
          onMouseDown={() => handleCornerClick("leftmiddle")}
        ></div>
        <div
          className="selectors scale-cursorRM"
          id="RM"
          style={{ top: `${adjustedY1 + (adjustedY2 - adjustedY1) / 2 - 4}px`, left: `${adjustedX2 - 4}px` }}
          onMouseDown={() => handleCornerClick("rightmiddle")}
        ></div>
      </div>
    );
  } else if (type === "line") {
    return (
      <div>
        <div
          className="selectors scaleline"
          id="start"
          style={{ top: `${adjustedY1 - 4}px`, left: `${adjustedX1 - 4}px` }}
          onMouseDown={() => handleCornerClick("starting")}
        ></div>
        <div
          className="selectors scaleline"
          id="end"
          style={{ top: `${adjustedY2 - 4}px`, left: `${adjustedX2 - 4}px` }}
          onMouseDown={() => handleCornerClick("ending")}
        ></div>
      </div>
    );
  }
  else if (type === "circle") {
    const radius = Math.hypot(x2 - x1, y2 - y1);
    const adjustedRadius = radius * zoom;
    const centerX = adjustedX1;
    const centerY = adjustedY1;
  
    // Calculate positions for the 8 points
    const points = {
      topLeft: { x: centerX - adjustedRadius, y: centerY - adjustedRadius },
      topMiddle: { x: centerX, y: centerY - adjustedRadius },
      topRight: { x: centerX + adjustedRadius, y: centerY - adjustedRadius },
      middleLeft: { x: centerX - adjustedRadius, y: centerY },
      middleRight: { x: centerX + adjustedRadius, y: centerY },
      bottomLeft: { x: centerX - adjustedRadius, y: centerY + adjustedRadius },
      bottomMiddle: { x: centerX, y: centerY + adjustedRadius },
      bottomRight: { x: centerX + adjustedRadius, y: centerY + adjustedRadius },
    };
  
    return (
      <div>
        {/* Circle Resizing Points */}
        <div
          className="selectors scale-cursorTL"
          id="TL"
          style={{ top: `${points.topLeft.y - 4}px`, left: `${points.topLeft.x - 4}px` }}
          onMouseDown={() => handleCornerClick("topleft")}
        ></div>
        <div
          className="selectors scale-cursorTM"
          id="TM"
          style={{ top: `${points.topMiddle.y - 4}px`, left: `${points.topMiddle.x - 4}px` }}
          onMouseDown={() => handleCornerClick("topmiddle")}
        ></div>
        <div
          className="selectors scale-cursorTR"
          id="TR"
          style={{ top: `${points.topRight.y - 4}px`, left: `${points.topRight.x - 4}px` }}
          onMouseDown={() => handleCornerClick("topright")}
        ></div>
        <div
          className="selectors scale-cursorLM"
          id="LM"
          style={{ top: `${points.middleLeft.y - 4}px`, left: `${points.middleLeft.x - 4}px` }}
          onMouseDown={() => handleCornerClick("leftmiddle")}
        ></div>
        <div
          className="selectors scale-cursorRM"
          id="RM"
          style={{ top: `${points.middleRight.y - 4}px`, left: `${points.middleRight.x - 4}px` }}
          onMouseDown={() => handleCornerClick("rightmiddle")}
        ></div>
        <div
          className="selectors scale-cursorBL"
          id="BL"
          style={{ top: `${points.bottomLeft.y - 4}px`, left: `${points.bottomLeft.x - 4}px` }}
          onMouseDown={() => handleCornerClick("bottomleft")}
        ></div>
        <div
          className="selectors scale-cursorBM"
          id="BM"
          style={{ top: `${points.bottomMiddle.y - 4}px`, left: `${points.bottomMiddle.x - 4}px` }}
          onMouseDown={() => handleCornerClick("bottommiddle")}
        ></div>
        <div
          className="selectors scale-cursorBR"
          id="BR"
          style={{ top: `${points.bottomRight.y - 4}px`, left: `${points.bottomRight.x - 4}px` }}
          onMouseDown={() => handleCornerClick("bottomright")}
        ></div>
  
        {/* Lines connecting the points */}
        <div
          style={{
            position: "absolute",
            top: `${points.topLeft.y}px`,
            left: `${points.topLeft.x}px`,
            width: `${2 * adjustedRadius}px`,
            height: "1px",
            backgroundColor: "blue",
          }}
        ></div>
        <div
          style={{
            position: "absolute",
            top: `${points.topRight.y}px`,
            left: `${points.topRight.x}px`,
            width: "1px",
            height: `${2 * adjustedRadius}px`,
            backgroundColor: "blue",
          }}
        ></div>
        <div
          style={{
            position: "absolute",
            top: `${points.bottomLeft.y}px`,
            left: `${points.bottomLeft.x}px`,
            width: `${2 * adjustedRadius}px`,
            height: "1px",
            backgroundColor: "blue",
          }}
        ></div>
        <div
          style={{
            position: "absolute",
            top: `${points.topLeft.y}px`,
            left: `${points.topLeft.x}px`,
            width: "1px",
            height: `${2 * adjustedRadius}px`,
            backgroundColor: "blue",
          }}
        ></div>
      </div>
    );
  }
  else if (type === "triangle") {
    // Calculate triangle's points and adjust for zoom and pan
    const points = {
      pointA: { x: adjustedX1, y: adjustedY1 },
      pointB: { x: adjustedX2, y: adjustedY2 },
      pointC: { x: adjustedX1-((adjustedX2-adjustedX1)), y: adjustedY2 }
    };

    return (
      <div>
        {/* Selector for point A */}
        <div
          className="selectors scale-cursorA"
          style={{ top: `${points.pointA.y - 4}px`, left: `${points.pointA.x - 4}px` }}
          onMouseDown={() => handleCornerClick("pointA")}
        ></div>

        {/* Selector for point B */}
        <div
          className="selectors scale-cursorB"
          style={{ top: `${points.pointB.y - 4}px`, left: `${points.pointB.x - 4}px` }}
          onMouseDown={() => handleCornerClick("pointB")}
        ></div>

        {/* Selector for point C */}
        <div
          className="selectors scale-cursorC"
          style={{ top: `${points.pointC.y - 4}px`, left: `${points.pointC.x - 4}px` }}
          onMouseDown={() => handleCornerClick("pointC")}
        ></div>
      </div>
    );
  }
  else if (type === "arrow") {
    return (
      <div>
        <div
          className="selectors scaleline"
          id="start"
          style={{ top: `${adjustedY1 - 4}px`, left: `${adjustedX1 - 4}px` }}
          onMouseDown={() => handleCornerClick("starting")}
        ></div>
        <div
          className="selectors scaleline"
          id="end"
          style={{ top: `${adjustedY2 - 4}px`, left: `${adjustedX2 - 4}px` }}
          onMouseDown={() => handleCornerClick("ending")}
        ></div>
      </div>
    );
  }
  return null;
}