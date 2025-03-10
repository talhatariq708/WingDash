// Select elements
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const startScreen = document.getElementById("startScreen");
const gameOverScreen = document.getElementById("gameOverScreen");
const scoreText = document.getElementById("scoreText");
const restartBtn = document.getElementById("restartBtn");

// Adjust canvas size
canvas.width = 400;
canvas.height = 500;

// Load images
const birdImg = new Image();
birdImg.src = "flappybird.png";

const pipeImg = new Image();
pipeImg.src = "flappybirdpipe.png";

const bgImg = new Image();
bgImg.src = "sunset_background.png";

// Off-screen canvas for background caching
const offscreenBgCanvas = document.createElement("canvas");
offscreenBgCanvas.width = canvas.width;
offscreenBgCanvas.height = canvas.height;
const offscreenBgCtx = offscreenBgCanvas.getContext("2d");

// Draw background on off-screen canvas once loaded
bgImg.onload = function () {
    offscreenBgCtx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
};

// Load sounds
const flapSound = new Audio("backgroundflap.mp3");
const gameOverSound = new Audio("game-over.mp3");
const swooshSound = new Audio("swoosh.mp3");

// Game state variables
let gameRunning = false;
let score = 0;
let highScore = localStorage.getItem("flappyHighScore") || 0;
let pipes = [];
let lastPipeTime = 0;
let lastTime = 0;

// Bird properties
const bird = {
    x: 50,
    y: 200,
    width: 40,
    height: 40,
    velocity: 0,
    gravity: 0.4,
    jumpPower: -6.5,
    angle: 0
};

// Pipe properties
const pipeWidth = 50;
const pipeSpeed = 2;
const pipeGap = 120;
const minPipeHeight = 50;
const maxPipeHeight = 200;

// Create pipes
function createPipe() {
    const topHeight = Math.floor(Math.random() * (maxPipeHeight - minPipeHeight)) + minPipeHeight;

    pipes.push({
        x: canvas.width,
        topHeight: topHeight,
        bottomHeight: canvas.height - (topHeight + pipeGap),
        width: pipeWidth,
        speed: pipeSpeed,
        passed: false
    });
}

// Jump function
function jump() {
    if (!gameRunning) {
        startGame();
    } else {
        bird.velocity = bird.jumpPower;
        bird.angle = -20;
        flapSound.currentTime = 0;
        flapSound.play().catch(() => { });
    }
}

// Start game function
function startGame() {
    gameRunning = true;
    score = 0;
    bird.y = 200;
    bird.velocity = 0;
    bird.angle = 0;
    pipes = [];
    lastPipeTime = performance.now();

    startScreen.style.display = "none";
    gameOverScreen.style.display = "none";

    createPipe();
    requestAnimationFrame(updateGame);
}

// Restart game function
function restartGame() {
    gameRunning = false;
    startScreen.style.display = "block";
    gameOverScreen.style.display = "none";
}

// Check collision
function checkCollision() {
    if (bird.y < 0) {
        bird.y = 0;
        bird.velocity = 0;
    }

    if (bird.y + bird.height >= canvas.height) {
        gameOver();
    }

    pipes.forEach(pipe => {
        if (
            bird.x + bird.width > pipe.x &&
            bird.x < pipe.x + pipe.width &&
            (bird.y < pipe.topHeight || bird.y + bird.height > canvas.height - pipe.bottomHeight)
        ) {
            gameOver();
        }

        if (!pipe.passed && bird.x > pipe.x + pipe.width) {
            score++;
            pipe.passed = true;
            swooshSound.currentTime = 0;
            swooshSound.play().catch(() => { });
        }
    });
}

// Game over function
function gameOver() {
    gameRunning = false;

    if (score > highScore) {
        highScore = score;
        localStorage.setItem("flappyHighScore", highScore);
    }

    scoreText.innerHTML = `Score: ${score} <br> High Score: ${highScore}`;
    gameOverScreen.style.display = "block";

    gameOverSound.currentTime = 0;
    gameOverSound.play().catch(() => { });
}

// Draw functions
function drawBackground() {
    ctx.drawImage(offscreenBgCanvas, 0, 0);
}

function drawBird() {
    ctx.save();
    ctx.translate(bird.x + bird.width / 2, bird.y + bird.height / 2);
    ctx.rotate((bird.angle * Math.PI) / 180);
    ctx.drawImage(birdImg, -bird.width / 2, -bird.height / 2, bird.width, bird.height);
    ctx.restore();
}

function drawPipes() {
    pipes.forEach(pipe => {
        // Draw the top pipe (flipped)
        ctx.save();
        ctx.translate(pipe.x + pipe.width / 2, pipe.topHeight);
        ctx.scale(1, -1); // Flip the image
        ctx.drawImage(pipeImg, -pipe.width / 2, 0, pipe.width, pipe.topHeight);
        ctx.restore();

        // Draw the bottom pipe
        ctx.drawImage(pipeImg, pipe.x, canvas.height - pipe.bottomHeight, pipe.width, pipe.bottomHeight);
    });
}

function drawScore() {
    ctx.fillStyle = "black";
    ctx.font = "20px Arial";
    ctx.fillText(`Score: ${score}`, 20, 30);
}

// Update game logic with delta time
function updateGame(currentTime) {
    if (!gameRunning) return;

    const deltaTime = (currentTime - lastTime) / 16.67; // Normalize to 60 FPS
    lastTime = currentTime;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    drawBird();
    drawPipes();
    drawScore();

    // Bird physics (apply deltaTime)
    bird.velocity += bird.gravity * deltaTime;
    bird.y += bird.velocity * deltaTime;

    if (bird.velocity > 0) {
        bird.angle = Math.min(bird.angle + 2, 40);
    }

    // Update pipes (apply deltaTime)
    pipes.forEach(pipe => {
        pipe.x -= pipe.speed * deltaTime;
    });

    // Remove off-screen pipes
    if (pipes.length && pipes[0].x + pipes[0].width < 0) {
        pipes.shift();
    }

    // Add new pipes at intervals
    if (performance.now() - lastPipeTime > 1500) {
        createPipe();
        lastPipeTime = performance.now();
    }

    checkCollision();

    requestAnimationFrame(updateGame);
}

// Event listeners
document.addEventListener("keydown", (event) => {
    if (event.code === "Space") jump();
});
canvas.addEventListener("touchstart", jump);
restartBtn.addEventListener("click", restartGame);

// Show start screen
startScreen.style.display = "block";
