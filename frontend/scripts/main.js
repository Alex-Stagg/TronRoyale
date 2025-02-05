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
let gameOver = false;
let winner = null; // New global variable for winner
// Initialize direction and starting position; head is at center initially
let direction = { x: speed, y: 0 };
let vertices = [{ x: canvas.width / 2, y: canvas.height / 2 }];
let cellSize = 5;
let x = canvas.width / 2;
let y = canvas.height / 2;

// New variables for player2
let p2Direction = { x: speed, y: 0 };
let p2Vertices = [{ x: canvas.width * 3/4, y: canvas.height / 2 }];
let p2CellSize = 5;
let p2X = canvas.width * 3/4;
let p2Y = canvas.height / 2;
const p2Color = '#ff00ff'; // Neon magenta for player2

// Handle key presses to change direction and record turns
document.addEventListener('keydown', (e) => {
    if (gameOver) {
        // Reset both players
        x = canvas.width / 2;
        y = canvas.height / 2;
        vertices = [{ x, y }];
        direction = { x: speed, y: 0 };
        p2X = canvas.width * 3/4;
        p2Y = canvas.height / 2;
        p2Vertices = [{ x: p2X, y: p2Y }];
        p2Direction = { x: speed, y: 0 };
        gameOver = false;
        winner = null; // Reset winner
        gameLoop();
        return;
    }
    
    // Player1 controls (arrow keys)
    const newDir1 = (
        e.key === 'ArrowUp' ? { x: 0, y: -speed } :
        e.key === 'ArrowDown' ? { x: 0, y: speed } :
        e.key === 'ArrowLeft' ? { x: -speed, y: 0 } :
        e.key === 'ArrowRight' ? { x: speed, y: 0 } :
        null
    );
    if (newDir1 && !(newDir1.x === -direction.x && newDir1.y === -direction.y)) {
        vertices.push({ x, y });
        direction = newDir1;
    }
    
    // Player2 controls (WASD: w-up, s-down, a-left, d-right)
    const newDir2 = (
        e.key === 'w' || e.key === 'W' ? { x: 0, y: -speed } :
        e.key === 's' || e.key === 'S' ? { x: 0, y: speed } :
        e.key === 'a' || e.key === 'A' ? { x: -speed, y: 0 } :
        e.key === 'd' || e.key === 'D' ? { x: speed, y: 0 } :
        null
    );
    if (newDir2 && !(newDir2.x === -p2Direction.x && newDir2.y === -p2Direction.y)) {
        p2Vertices.push({ x: p2X, y: p2Y });
        p2Direction = newDir2;
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

// New function to draw a player tail with bloom effect; color parameter controls the look.
function drawPlayerTail(startVertices, currentX, currentY, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = cellSize;
    ctx.shadowColor = color;
    ctx.shadowBlur = 25;
    ctx.beginPath();
    ctx.moveTo(startVertices[0].x, startVertices[0].y);
    for (let i = 1; i < startVertices.length; i++) {
        ctx.lineTo(startVertices[i].x, startVertices[i].y);
    }
    ctx.lineTo(currentX, currentY);
    ctx.stroke();
    ctx.restore();
}

// Modify drawGameOverMessage to display winner if available
function drawGameOverMessage() {
    ctx.save();
    ctx.fillStyle = '#ff4500';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    if (winner) {
        ctx.fillText(winner + ' Wins!', canvas.width / 2, canvas.height / 2 - 20);
    } else {
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 20);
    }
    ctx.font = '24px Arial';
    ctx.fillText('Press any key to restart', canvas.width / 2, canvas.height / 2 + 20);
    ctx.restore();
}

// New helper functions for collision detection
function isOutOfBounds(x, y, size) {
    return x < 0 || x > canvas.width - size || y < 0 || y > canvas.height - size;
}

function checkSelfCollision(vertices, head, loserWinner) {
    if (vertices.length < 2) return false;
    const segStart = vertices[vertices.length - 1];
    for (let i = 0; i < vertices.length - 1; i++) {
        if (linesIntersect(vertices[i].x, vertices[i].y, vertices[i + 1].x, vertices[i + 1].y, segStart.x, segStart.y, head.x, head.y)) {
            gameOver = true;
            winner = loserWinner;
            return true;
        }
    }
    return false;
}

function checkTrailCollision(trailVertices, head, loserWinner) {
    if (trailVertices.length < 2) return false;
    const segStart = trailVertices[trailVertices.length - 1];
    for (let i = 0; i < trailVertices.length - 1; i++) {
        if (linesIntersect(trailVertices[i].x, trailVertices[i].y, trailVertices[i + 1].x, trailVertices[i + 1].y, segStart.x, segStart.y, head.x, head.y)) {
            gameOver = true;
            winner = loserWinner;
            return true;
        }
    }
    return false;
}

function gameLoop() {
    // Clear entire canvas for new frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (!gameOver) {
        // Update player1 position
        x += direction.x;
        y += direction.y;
        // Update player2 position
        p2X += p2Direction.x;
        p2Y += p2Direction.y;
        
        // Optimized collision detection using helper functions
        if (checkSelfCollision(vertices, { x, y }, 'Player 2')) { }
        if (isOutOfBounds(x, y, cellSize)) {
            gameOver = true;
            winner = 'Player 2';
        }
        if (checkSelfCollision(p2Vertices, { x: p2X, y: p2Y }, 'Player 1')) { }
        if (isOutOfBounds(p2X, p2Y, p2CellSize)) {
            gameOver = true;
            winner = 'Player 1';
        }
        if (checkTrailCollision(p2Vertices, { x, y }, 'Player 2')) { }
        if (checkTrailCollision(vertices, { x: p2X, y: p2Y }, 'Player 1')) { }
    }
    
    // Draw player tails if not game over
    if (!gameOver) {
        drawPlayerTail(vertices, x, y, '#00ffff'); // Player1: neon cyan
        drawPlayerTail(p2Vertices, p2X, p2Y, p2Color); // Player2: neon magenta
    } else {
        drawGameOverMessage();
    }
    
    requestAnimationFrame(gameLoop);
}

// Start the game loop
gameLoop();
