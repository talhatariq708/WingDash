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

// Load sounds
const flapSound = new Audio("backgroundflap.mp3");
const gameOverSound = new Audio("game-over.mp3");
const swooshSound = new Audio("swoosh.mp3");

// Game state
let gameRunning = false;
let score = 0;
let highScore = localStorage.getItem("flappyHighScore") || 0;
let pipes = [];
let lastPipeTime = 0;
let lastUpdateTime = performance.now(); // Time tracking

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
const pipeSpeed = 100; // 100 pixels per second
const pipeGap = 120;
const minPipeHeight = 50;
const maxPipeHeight = 200;

// Set fixed timestep for consistent FPS (60 updates per second)
const FIXED_TIMESTEP = 1000 / 60; // 16.67ms (60 FPS)

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

function jump() {
    if (!gameRunning) {
        startGame();
    } else {
        bird.velocity = bird.jumpPower;
        bird.angle = -20;
        flapSound.play().catch(() => { });
    }
}

function startGame() {
    gameRunning = true;
    score = 0;
    bird.y = 200;
    bird.velocity = 0;
    bird.angle = 0;
    pipes = [];
    lastPipeTime = performance.now();
    lastUpdateTime = performance.now(); // Reset time tracking

    startScreen.style.display = "none";
    gameOverScreen.style.display = "none";

    createPipe();
    requestAnimationFrame(gameLoop);

    const TARGET_FPS = 60;
    const FRAME_DURATION = 1000 / TARGET_FPS;
    let lastFrameTime = 0;

    function gameLoop(currentTime) {
        if (!gameRunning) return;

        const deltaTime = currentTime - lastFrameTime;

        if (deltaTime < FRAME_DURATION) {
            requestAnimationFrame(gameLoop);
            return; // Skip this frame to maintain FPS limit
        }

        lastFrameTime = currentTime;

        updateGame(FRAME_DURATION); // Use fixed time step
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawBackground();
        drawBird();
        drawPipes();
        drawScore();

        requestAnimationFrame(gameLoop);
    }

}

function restartGame() {
    gameRunning = false;
    startScreen.style.display = "block";
    gameOverScreen.style.display = "none";
}

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
            swooshSound.play().catch(() => { });
        }
    });
}

function gameOver() {
    gameRunning = false;

    if (score > highScore) {
        highScore = score;
        localStorage.setItem("flappyHighScore", highScore);
    }

    scoreText.innerHTML = `Score: ${score} <br> High Score: ${highScore}`;
    gameOverScreen.style.display = "block";

    gameOverSound.play().catch(() => { });
}

function drawBackground() {
    ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
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
        ctx.save();
        ctx.translate(pipe.x + pipe.width / 2, pipe.topHeight);
        ctx.scale(1, -1);
        ctx.drawImage(pipeImg, -pipe.width / 2, 0, pipe.width, pipe.topHeight);
        ctx.restore();

        ctx.drawImage(pipeImg, pipe.x, canvas.height - pipe.bottomHeight, pipe.width, pipe.bottomHeight);
    });
}

function drawScore() {
    ctx.fillStyle = "black";
    ctx.font = "20px Arial";
    ctx.fillText(`Score: ${score}`, 20, 30);
}

// Main game loop with fixed time step
function gameLoop(currentTime) {
    if (!gameRunning) return;

    let deltaTime = currentTime - lastUpdateTime;

    if (deltaTime > 1000) {
        deltaTime = FIXED_TIMESTEP;
    }

    while (deltaTime >= FIXED_TIMESTEP) {
        updateGame(FIXED_TIMESTEP);
        deltaTime -= FIXED_TIMESTEP;
    }

    lastUpdateTime = currentTime;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    drawBird();
    drawPipes();
    drawScore();

    requestAnimationFrame(gameLoop);
}

// Update game logic
function updateGame(deltaTime) {
    bird.velocity += bird.gravity * (deltaTime / FIXED_TIMESTEP);
    bird.y += bird.velocity * (deltaTime / FIXED_TIMESTEP);

    if (bird.velocity > 0) {
        bird.angle = Math.min(bird.angle + 2, 40);
    }

    pipes.forEach(pipe => {
        pipe.x -= pipe.speed * (deltaTime / FIXED_TIMESTEP);
    });

    if (pipes.length && pipes[0].x + pipes[0].width < 0) {
        pipes.shift();
    }

    if (performance.now() - lastPipeTime > 1500) {
        createPipe();
        lastPipeTime = performance.now();
    }

    checkCollision();
}

// Event listeners
document.addEventListener("keydown", (event) => {
    if (event.code === "Space") jump();
});
canvas.addEventListener("touchstart", jump);
restartBtn.addEventListener("click", restartGame);

startScreen.style.display = "block";
