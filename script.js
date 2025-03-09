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
birdImg.src = "flappybird.png"; // Ensure correct path

const pipeImg = new Image();
pipeImg.src = "flappybirdpipe.png"; // Ensure correct path

const bgImg = new Image();
bgImg.src = "sunset_background.png"; // Ensure correct path

// Load sounds
const flapSound = new Audio("backgroundflap.mp3"); // Ensure correct path
const gameOverSound = new Audio("game-over.mp3"); // Ensure correct path
const swooshSound = new Audio("swoosh.mp3"); // Ensure correct path

// Game state
let gameRunning = false;
let score = 0;
let highScore = localStorage.getItem("flappyHighScore") || 0;
let pipes = [];

// Bird properties
const bird = {
    x: 50,
    y: 200, // Start at a reasonable height
    width: 40,
    height: 40,
    velocity: 0,
    gravity: 0.5,
    jumpPower: -8, // Adjust jump power for better control
    angle: 0 // Rotation angle for animation
};

// Pipe properties
function createPipe() {
    const gap = 120;
    const minHeight = 50;
    const maxHeight = 200;
    const topHeight = Math.floor(Math.random() * (maxHeight - minHeight)) + minHeight;

    pipes.push({
        x: canvas.width,
        topHeight: topHeight,
        bottomHeight: canvas.height - (topHeight + gap),
        width: 50,
        speed: 2,
        passed: false // To track if bird passed the pipe
    });
}

// Jump function
function jump() {
    if (!gameRunning) {
        startGame();
    } else {
        bird.velocity = bird.jumpPower;
        bird.angle = -25; // Tilt bird upwards when jumping
        flapSound.currentTime = 0; // Reset sound for repeated play
        flapSound.play().catch(error => console.log("Error playing sound:", error));
    }
}

// Start game function
function startGame() {
    gameRunning = true;
    score = 0;
    bird.y = 200; // Reset to start position
    bird.velocity = 0;
    bird.angle = 0;
    pipes = [];

    startScreen.style.display = "none";
    gameOverScreen.style.display = "none";

    createPipe();
    updateGame();
}

// Restart game function
function restartGame() {
    gameRunning = false;
    startScreen.style.display = "block";
    gameOverScreen.style.display = "none";
}

// Check collision
function checkCollision() {
    // Prevent bird from flying too high
    if (bird.y < 0) {
        bird.y = 0;
        bird.velocity = 0;
    }

    // Check if the bird hits the ground
    if (bird.y + bird.height >= canvas.height) {
        gameOver();
    }

    // Check collision with pipes
    pipes.forEach(pipe => {
        if (
            bird.x + bird.width > pipe.x &&
            bird.x < pipe.x + pipe.width &&
            (bird.y < pipe.topHeight || bird.y + bird.height > canvas.height - pipe.bottomHeight)
        ) {
            gameOver();
        }

        // Check if bird successfully passed a pipe
        if (!pipe.passed && bird.x > pipe.x + pipe.width) {
            score++;
            pipe.passed = true; // Mark as passed to avoid multiple counts

            // Play swoosh sound when passing a pipe
            swooshSound.currentTime = 0; // Reset sound for repeated play
            swooshSound.play().catch(error => console.log("Error playing swoosh sound:", error));
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

    // Play game-over sound
    gameOverSound.currentTime = 0; // Reset sound
    gameOverSound.play().catch(error => console.log("Error playing game-over sound:", error));
}

// Draw background
function drawBackground() {
    ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
}

// Draw bird with rotation
function drawBird() {
    ctx.save();
    ctx.translate(bird.x + bird.width / 2, bird.y + bird.height / 2);
    ctx.rotate((bird.angle * Math.PI) / 180);
    ctx.drawImage(birdImg, -bird.width / 2, -bird.height / 2, bird.width, bird.height);
    ctx.restore();
}

// Draw pipes with images
function drawPipes() {
    pipes.forEach(pipe => {
        // Draw top pipe (flipped)
        ctx.save();
        ctx.translate(pipe.x + pipe.width / 2, pipe.topHeight);
        ctx.scale(1, -1); // Flip image vertically
        ctx.drawImage(pipeImg, -pipe.width / 2, 0, pipe.width, pipe.topHeight);
        ctx.restore();

        // Draw bottom pipe
        ctx.drawImage(pipeImg, pipe.x, canvas.height - pipe.bottomHeight, pipe.width, pipe.bottomHeight);
    });
}

// Draw score
function drawScore() {
    ctx.fillStyle = "black";
    ctx.font = "20px Arial";
    ctx.fillText(`Score: ${score}`, 20, 30);
}

// Update game
function updateGame() {
    if (!gameRunning) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    drawBird();
    drawPipes();
    drawScore();

    // Update bird movement
    bird.velocity += bird.gravity;
    bird.y += bird.velocity;

    // Prevent bird from going off the top of the screen
    if (bird.y < 0) {
        bird.y = 0;
        bird.velocity = 0;
    }

    // Adjust bird tilt angle (animation)
    if (bird.velocity > 0) {
        bird.angle = Math.min(bird.angle + 2, 40); // Tilt down when falling
    }

    // Update pipes
    pipes.forEach(pipe => {
        pipe.x -= pipe.speed;
    });

    // Remove off-screen pipes
    pipes = pipes.filter(pipe => pipe.x + pipe.width > 0);

    // Add new pipes at correct intervals
    if (pipes.length === 0 || pipes[pipes.length - 1].x < canvas.width - 200) {
        createPipe();
    }

    // Check collision
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
