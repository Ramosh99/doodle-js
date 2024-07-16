// components/HomePage.js
'use client';
import dynamic from 'next/dynamic';

const Excalidraw = dynamic(() => import('@excalidraw/excalidraw').then(mod => mod.Excalidraw), 
{ ssr: false });

const HomePage = () => {
return (
  <div className="h-screen" >
    <Excalidraw/>
  </div>
);};

export default HomePage;
