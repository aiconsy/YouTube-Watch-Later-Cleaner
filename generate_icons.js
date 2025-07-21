const fs = require('fs');
const { createCanvas } = require('canvas');

// Icon sizes required for Chrome extension
const sizes = [16, 32, 48, 128];

function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // YouTube red background with rounded corners
  const radius = size * 0.2;
  ctx.fillStyle = '#FF0000';
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, radius);
  ctx.fill();
  
  // White play button (left side)
  ctx.fillStyle = '#FFFFFF';
  const playSize = size * 0.25;
  const playX = size * 0.25;
  const playY = size * 0.375;
  ctx.beginPath();
  ctx.moveTo(playX, playY);
  ctx.lineTo(playX + playSize, playY + playSize * 0.5);
  ctx.lineTo(playX, playY + playSize);
  ctx.closePath();
  ctx.fill();
  
  // White trash can (right side)
  const trashX = size * 0.6;
  const trashY = size * 0.35;
  const trashWidth = size * 0.25;
  const trashHeight = size * 0.3;
  
  // Trash can body
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(trashX, trashY, trashWidth, trashHeight);
  
  // Trash can lid
  const lidWidth = trashWidth * 1.2;
  const lidHeight = size * 0.08;
  ctx.fillRect(trashX - (lidWidth - trashWidth) / 2, trashY - lidHeight, lidWidth, lidHeight);
  
  // Trash can handle
  const handleWidth = size * 0.08;
  const handleHeight = size * 0.12;
  ctx.fillRect(trashX + trashWidth / 2 - handleWidth / 2, trashY - lidHeight - handleHeight, handleWidth, handleHeight);
  
  return canvas.toBuffer('image/png');
}

// Generate all icon sizes
sizes.forEach(size => {
  const iconBuffer = generateIcon(size);
  fs.writeFileSync(`icon${size}.png`, iconBuffer);
  console.log(`Generated icon${size}.png`);
});

console.log('All icons generated successfully!'); 