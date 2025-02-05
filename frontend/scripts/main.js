// Initialize the canvas and set its dimensions
const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');

// Set canvas dimensions
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Function to draw a rectangle on the canvas
function drawRectangle(x, y, width, height, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
}

// Event listener for mouse clicks to draw on the canvas
canvas.addEventListener('click', (event) => {
    const rectX = event.clientX - 25; // Center the rectangle
    const rectY = event.clientY - 25; // Center the rectangle
    drawRectangle(rectX, rectY, 50, 50, 'blue'); // Draw a blue rectangle
});

// Resize the canvas when the window is resized
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});