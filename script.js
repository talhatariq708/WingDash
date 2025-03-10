// Select elements
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const startScreen = document.getElementById("startScreen");
const gameOverScreen = document.getElementById("gameOverScreen");
const scoreText = document.getElementById("scoreText");
const restartBtn = document.getElementById("restartBtn");

// Resize Canvas to Fit Screen
function resizeCanvas() {
    let width = window.innerWidth * 0.9;
    let height = window.innerHeight * 0.75; // Maintain good aspect ratio

    canvas.width = width;
    canvas.height = height;
}

// Call resize on page load and window resize
window.addEventListener("resize", resizeCanvas);
window.addEventListener("load", resizeCanvas);

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

// Bird properties
const bird = {
    x: 50,
    y: canvas.height / 2,
    width: 40,
    height: 40,
    velocity: 0,
    gravity: 0.4,
    jumpPower: -6.5,
    angle: 0
};

// Pipe properties
const pipeWidth = 50;
const pipeSpeed = 2.5;
const pipeGap = 120;

// FPS Settings
const TARGET_FPS = 60;
const FRAME_DURATION = 1000 / TARGET_FPS;
let lastFrameTime = performance.now();

function createPipe() {
    const minPipeHeight = 50;
    const maxPipeHeight = canvas.height / 2;
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
    bird.y = canvas.height / 2;
    bird.velocity = 0;
    bird.angle = 0;
    pipes = [];

    startScreen.style.display = "none";
    gameOverScreen.style.display = "none";

    createPipe();
    requestAnimationFrame(gameLoop);
}

function restartGame() {
    gameRunning = false;
    startScreen.style.display = "block";
    gameOverScreen.style.display = "none";
}

function checkCollision() {
    if (bird.y <= 0 || bird.y + bird.height >= canvas.height) {
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

function gameLoop(currentTime) {
    if (!gameRunning) return;

    let deltaTime = currentTime - lastFrameTime;
    if (deltaTime < FRAME_DURATION) {
        requestAnimationFrame(gameLoop);
        return;
    }
    lastFrameTime = currentTime;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

    bird.velocity += bird.gravity;
    bird.y += bird.velocity;

    pipes.forEach(pipe => {
        pipe.x -= pipe.speed;
        ctx.drawImage(pipeImg, pipe.x, 0, pipe.width, pipe.topHeight);
        ctx.drawImage(pipeImg, pipe.x, canvas.height - pipe.bottomHeight, pipe.width, pipe.bottomHeight);
    });

    ctx.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);
    ctx.fillText(`Score: ${score}`, 20, 30);

    checkCollision();
    requestAnimationFrame(gameLoop);
}

// Event listeners
document.addEventListener("keydown", event => { if (event.code === "Space") jump(); });
canvas.addEventListener("touchstart", jump);
restartBtn.addEventListener("click", restartGame);
