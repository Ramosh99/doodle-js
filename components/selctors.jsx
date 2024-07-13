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
  zoom
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

  const { type, x1, x2, y1, y2 } = activeElem[0];


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

  return null;
}