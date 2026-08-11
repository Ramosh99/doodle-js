export const handleSave = ({ elements }) => {
  const json = JSON.stringify(elements);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'canvas.json';
  link.click();
  URL.revokeObjectURL(url);
};

export const exportPNG = ({ canvasRef }) => {
  const canvas = canvasRef.current;
  if (!canvas) return;
  const link = document.createElement('a');
  link.download = 'canvas.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
};

const Save = () => null;
export default Save;
