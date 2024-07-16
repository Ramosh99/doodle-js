'use client';
import React, { useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { ExcalidrawAPI } from '@excalidraw/excalidraw';

// Dynamically import Excalidraw to avoid SSR issues
const Excalidraw = dynamic(() => import('@excalidraw/excalidraw').then(mod => mod.Excalidraw), { ssr: false });

const createStarElement = (x, y) => {
  const points = [
    { x: 50, y: 0 },
    { x: 61, y: 35 },
    { x: 98, y: 35 },
    { x: 68, y: 57 },
    { x: 79, y: 91 },
    { x: 50, y: 70 },
    { x: 21, y: 91 },
    { x: 32, y: 57 },
    { x: 2, y: 35 },
    { x: 39, y: 35 },
  ];

  return {
    id: ExcalidrawAPI.generateId(),
    type: 'customStar',
    x,
    y,
    width: 100,
    height: 100,
    strokeColor: 'black',
    backgroundColor: 'yellow',
    points,
    angle: 0,
    strokeWidth: 1,
    roughness: 1,
    seed: Math.random(),
  };
};

const CustomExcalidraw = () => {
  const excalidrawRef = useRef(null);

  useEffect(() => {
    if (excalidrawRef.current) {
      const starIcon = (
        <div style={{ width: 24, height: 24, background: 'yellow', clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' }} />
      );

      ExcalidrawAPI.register({
        name: 'Star',
        icon: starIcon,
        handler: () => {
          const { x, y } = excalidrawRef.current.state.pointer;
          const star = createStarElement(x, y);
          excalidrawRef.current.updateScene({
            elements: [...excalidrawRef.current.getSceneElements(), star],
          });
        },
      });

      // Force re-render to apply the new toolbar item
      excalidrawRef.current.forceUpdate();
    }
  }, []);

  return (
    <div style={{ height: '500px' }}>
      <Excalidraw ref={excalidrawRef} />
    </div>
  );
};

export default CustomExcalidraw;
