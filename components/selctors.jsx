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
}) {
  if (!activeElem.length || mode !== "select") {
    return null;
  }

  const { type, x1, x2, y1, y2 } = activeElem[0];

  const handleCornerClick = (corner) => {
    //identify resizing points
    setResizingPoint(corner);
    setIsResizing(true);
    setIsDragging(false);
  };

  useEffect(() => { //for stopping resizing, when releasing the mouse pointer
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
//-------------------------yasiru changed aboove code with setisdragging and setresizing pooint-----------------------
  if (type === "rectangle") {
    return (
      <div>
        <div
          className="selectors scale-cursorTL"
          id="TL"
          style={{ top: `${y1 - 4}px`, left: `${x1 - 4}px` }}
          onMouseDown={() => handleCornerClick("topleft")}
        ></div>
        <div
          className="selectors scale-cursorTM"
          id="TM"
          style={{ top: `${y1 - 4}px`, left: `${x1 + (x2 - x1) / 2 - 4}px` }}
          onMouseDown={() => handleCornerClick("topmiddle")}
        ></div>
        <div
          className="selectors scale-cursorTR"
          id="TR"
          style={{ top: `${y1 - 4}px`, left: `${x2 - 4}px` }}
          onMouseDown={() => handleCornerClick("topright")}
        ></div>
        <div
          className="selectors scale-cursorBL"
          id="BL"
          style={{ top: `${y2 - 4}px`, left: `${x1 - 4}px` }}
          onMouseDown={() => handleCornerClick("bottomleft")}
        ></div>
        <div
          className="selectors scale-cursorBM"
          id="BM"
          style={{ top: `${y2 - 4}px`, left: `${x1 + (x2 - x1) / 2 - 4}px` }}
          onMouseDown={() => handleCornerClick("bottommiddle")}
        ></div>
        <div
          className="selectors scale-cursorBR"
          id="BR"
          style={{ top: `${y2 - 4}px`, left: `${x2 - 4}px` }}
          onMouseDown={() => handleCornerClick("bottomright")}
        ></div>
        <div
          className="selectors scale-cursorLM"
          id="LM"
          style={{ top: `${y1 + (y2 - y1) / 2 - 4}px`, left: `${x1 - 4}px` }}
          onMouseDown={() => handleCornerClick("leftmiddle")}
        ></div>
        <div
          className="selectors scale-cursorRM"
          id="RM"
          style={{ top: `${y1 + (y2 - y1) / 2 - 4}px`, left: `${x2 - 4}px` }}
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
          style={{ top: `${y1 - 4}px`, left: `${x1 - 4}px` }}
          onMouseDown={() => handleCornerClick("starting")}
        ></div>
        <div
          className="selectors scaleline"
          id="end"
          style={{ top: `${y2 - 4}px`, left: `${x2 - 4}px` }}
          onMouseDown={() => handleCornerClick("ending")}
        ></div>
      </div>
    );
  }

  return null;
}
