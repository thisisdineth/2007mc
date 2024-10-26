// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyD1LRguv9N_gRI2kZFjdqNA5fvN8AqXyx4",
    authDomain: "mc2007-48ecf.firebaseapp.com",
    projectId: "mc2007-48ecf",
    storageBucket: "mc2007-48ecf.appspot.com",
    messagingSenderId: "636819382403",
    appId: "1:636819382403:web:e5465f37c94df79409bbb6",
    measurementId: "G-CZ57NENM1Z"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

let gameStarted = false;
let score = 0;
let direction = 'RIGHT';
let snake = [{ x: 9 * 32, y: 10 * 32 }];
let food = generateFood();
let eagles = generateEagles(2);

// DOM elements
let gameCanvas, startButton, gameOverScreen, restartButton, leaveButton, finalScore, scoreTable;

document.addEventListener('DOMContentLoaded', () => {
    gameCanvas = document.getElementById('gameCanvas');
    startButton = document.getElementById('startGameButton');
    gameOverScreen = document.getElementById('gameOverScreen');
    restartButton = document.getElementById('restartGameButton');
    leaveButton = document.getElementById('leaveGameButton');
    finalScore = document.getElementById('finalScore');
    scoreTable = document.querySelector('#scoreTable tbody');

    // Event listeners
    startButton?.addEventListener('click', startGame);
    restartButton?.addEventListener('click', restartGame);
    leaveButton?.addEventListener('click', () => alert('Thanks for playing!'));

    // Load leaderboard once authenticated
    firebase.auth().onAuthStateChanged(user => {
        if (user) loadScores();
    });
});

function generateFood() {
    return {
        x: Math.floor(Math.random() * 19) * 32,
        y: Math.floor(Math.random() * 15) * 32
    };
}

function generateEagles(count) {
    return Array.from({ length: count }, () => ({
        x: Math.floor(Math.random() * 19) * 32,
        y: Math.floor(Math.random() * 15) * 32
    }));
}

function startGame() {
    if (gameStarted) return;
    gameStarted = true;
    score = 0;
    snake = [{ x: 9 * 32, y: 10 * 32 }];
    direction = 'RIGHT';
    startButton.style.display = 'none';
    drawGame();
}

function drawGame() {
    const ctx = gameCanvas.getContext('2d');
    ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);

    // Draw snake
    snake.forEach(segment => {
        ctx.fillStyle = 'green';
        ctx.font = '28px Arial';
        ctx.fillText('🐍', segment.x, segment.y + 30);
    });

    // Draw food (frog emoji)
    ctx.font = '32px Arial';
    ctx.fillText('🐸', food.x, food.y + 32);

    // Draw eagles (multiple eagle emojis)
    eagles.forEach(eagle => ctx.fillText('🦅', eagle.x, eagle.y + 32));

    moveSnake();

    if (checkCollision()) {
        gameOver();
    } else {
        setTimeout(drawGame, 150); // Slow down snake speed
    }
}

function moveSnake() {
    let head = { ...snake[0] };
    if (direction === 'UP') head.y -= 32;
    else if (direction === 'DOWN') head.y += 32;
    else if (direction === 'LEFT') head.x -= 32;
    else if (direction === 'RIGHT') head.x += 32;

    // Wrap-around logic for the snake
    head.x = (head.x + gameCanvas.width) % gameCanvas.width;
    head.y = (head.y + gameCanvas.height) % gameCanvas.height;

    // Check if snake has eaten the food
    if (head.x === food.x && head.y === food.y) {
        score++;
        food = generateFood();
        snake.unshift(head); // Add new head
        eagles = generateEagles(2); // Change eagle positions after eating
    } else {
        snake.pop(); // Remove last segment
        snake.unshift(head); // Add new head
    }

    updateScore();
}

function updateScore() {
    const scoreElement = document.getElementById('currentScore');
    if (scoreElement) {
        scoreElement.innerText = `Score: ${score}`;
    }
}

function checkCollision() {
    const [head, ...body] = snake;

    // Check for collision with eagles
    for (let eagle of eagles) {
        if (head.x === eagle.x && head.y === eagle.y) {
            return true; // Game over if hitting eagle
        }
    }

    // Check for collision with self
    return body.some(segment => segment.x === head.x && segment.y === head.y);
}

function gameOver() {
    gameStarted = false;
    alert(`Game Over! Your score: ${score}`);
    gameOverScreen.style.display = 'block';
    finalScore.innerText = `Final Score: ${score}`;
    saveScore();
}

function saveScore() {
    const user = auth.currentUser;
    if (user) {
        db.ref('scores/' + user.uid).once('value').then(snapshot => {
            const highScore = snapshot.val()?.score || 0;
            if (score > highScore) {
                return db.ref('scores/' + user.uid).set({
                    name: user.displayName || user.email,
                    score: score,
                    profilePicture: user.photoURL || 'default_profile_pic.png'
                });
            }
        }).then(loadScores).catch(console.error);
    }
}

function loadScores() {
    db.ref('scores').orderByChild('score').limitToLast(10).once('value').then(snapshot => {
        const scores = [];
        snapshot.forEach(childSnapshot => scores.push(childSnapshot.val()));
        displayScores(scores.reverse());
    });
}

function displayScores(scores) {
    scoreTable.innerHTML = '';

    scores.forEach((score, index) => {
        const badge = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
        scoreTable.innerHTML += `<tr>
            <td>${index + 1}</td>
            <td>${badge} ${score.name}</td>
            <td>${score.score}</td>
            <td><img src="${score.profilePicture}" alt="Profile" width="30" height="30"></td>
        </tr>`;
    });
}

function restartGame() {
    gameOverScreen.style.display = 'none';
    startGame();
}

// Control the snake with arrow keys
document.addEventListener('keydown', event => {
    if (event.key === 'ArrowUp' && direction !== 'DOWN') direction = 'UP';
    else if (event.key === 'ArrowDown' && direction !== 'UP') direction = 'DOWN';
    else if (event.key === 'ArrowLeft' && direction !== 'RIGHT') direction = 'LEFT';
    else if (event.key === 'ArrowRight' && direction !== 'LEFT') direction = 'RIGHT';
});
