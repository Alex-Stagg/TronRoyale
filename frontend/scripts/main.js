// Initialize canvas and context
const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');

// Set canvas dimensions to fill the window
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Utility: draw a filled rectangle (unused here but available)
function drawRectangle(x, y, width, height, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
}

// Update canvas dimensions on window resize
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

let speed = 2;
// Initialize direction and starting position; head is at center initially
let direction = { x: speed, y: 0 };
let vertices = [{ x: canvas.width / 2, y: canvas.height / 2 }];
let cellSize = 5;
let x = canvas.width / 2;
let y = canvas.height / 2;

// Handle key presses to change direction and record turns
document.addEventListener('keydown', (e) => {
    // Determine new direction based on pressed arrow key
    const newDir = (
        e.key === 'ArrowUp' ? { x: 0, y: -speed } :
        e.key === 'ArrowDown' ? { x: 0, y: speed } :
        e.key === 'ArrowLeft' ? { x: -speed, y: 0 } :
        e.key === 'ArrowRight' ? { x: speed, y: 0 } : 
        null
    );
    if (newDir && (newDir.x !== direction.x || newDir.y !== direction.y)) {
        // Record current head position as a turning point
        vertices.push({ x, y });
        direction = newDir;
    }
});

// Helper: standard line intersection algorithm for collision detection
function linesIntersect(ax, ay, bx, by, cx, cy, dx, dy) {
    // Compute vector components
    let rX = bx - ax, rY = by - ay;
    let sX = dx - cx, sY = dy - cy;
    // Compute determinant
    let denom = rX * sY - rY * sX;
    if (denom === 0) return false; // Lines are parallel
    // Compute intersection parameters
    let t = ((cx - ax) * sY - (cy - ay) * sX) / denom;
    let u = ((cx - ax) * rY - (cy - ay) * rX) / denom;
    // Check if intersection occurs strictly between endpoints (not at vertices)
    return (t > 0 && t < 1 && u > 0 && u < 1);
}

function gameLoop() {
    // Clear entire canvas for new frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Update head position based on current direction
    x += direction.x;
    y += direction.y;
    
    // Collision detection:
    // Check current segment (from last vertex to current head) against every previous segment
    if (vertices.length >= 1) {
        const segStart = vertices[vertices.length - 1];
        const segEnd = { x, y };
        for (let i = 0; i < vertices.length - 1; i++) {
            const prevStart = vertices[i];
            const prevEnd = vertices[i + 1];
            if (linesIntersect(prevStart.x, prevStart.y, prevEnd.x, prevEnd.y, segStart.x, segStart.y, segEnd.x, segEnd.y)) {
                alert('Game Over!');
                // Reset head, vertices, and direction on collision
                x = canvas.width / 2;
                y = canvas.height / 2;
                vertices = [{ x, y }];
                direction = { x: speed, y: 0 };
                return requestAnimationFrame(gameLoop);
            }
        }
    }
    
    // Draw tail as a continuous line connecting vertices and ending at current head position
    ctx.strokeStyle = '#00ffff'; // Neon cyan
    ctx.lineWidth = cellSize;
    ctx.beginPath();
    // Start at first vertex
    ctx.moveTo(vertices[0].x, vertices[0].y);
    // Connect all turning points
    for (let i = 1; i < vertices.length; i++) {
        ctx.lineTo(vertices[i].x, vertices[i].y);
    }
    // Draw line to current head position
    ctx.lineTo(x, y);
    ctx.stroke();
    
    // Boundary collision: check if head is outside canvas bounds
    if (x < 0 || x > canvas.width - cellSize || y < 0 || y > canvas.height - cellSize) {
        alert('Game Over!');
        // Reset on boundary collision
        x = canvas.width / 2;
        y = canvas.height / 2;
        vertices = [{ x, y }];
        direction = { x: speed, y: 0 };
    }
    requestAnimationFrame(gameLoop);
}

// Start the game loop
gameLoop();
