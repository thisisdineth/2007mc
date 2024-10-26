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
let speed = 200; // Initial speed of the snake
let direction = 'RIGHT';
let snake = [{ x: 9 * 32, y: 10 * 32 }];
let food = generateFood();
let eagle = generateEagle();
let obstacles = generateObstacles(5); // Generate some obstacles
let lives = 3; // Player lives

// Function to generate food at random positions
function generateFood() {
    return {
        x: Math.floor(Math.random() * 19) * 32,
        y: Math.floor(Math.random() * 15) * 32
    };
}

// Function to generate eagle at random positions
function generateEagle() {
    return {
        x: Math.floor(Math.random() * 19) * 32,
        y: Math.floor(Math.random() * 15) * 32
    };
}

// Function to generate obstacles
function generateObstacles(num) {
    const obstacles = [];
    for (let i = 0; i < num; i++) {
        obstacles.push({
            x: Math.floor(Math.random() * 19) * 32,
            y: Math.floor(Math.random() * 15) * 32
        });
    }
    return obstacles;
}

// Start Game Function
document.getElementById('startGameButton').addEventListener('click', startGame);

function startGame() {
    if (gameStarted) return;
    gameStarted = true;
    score = 0; // Reset score
    speed = 200; // Reset speed
    lives = 3; // Reset lives
    snake = [{ x: 9 * 32, y: 10 * 32 }];
    direction = 'RIGHT'; // Reset direction
    document.getElementById('startGameButton').style.display = 'none';
    drawGame();
}

// Draw Game Function
function drawGame() {
    const ctx = document.getElementById('gameCanvas').getContext('2d');
    ctx.clearRect(0, 0, 640, 480);

    // Draw snake
    snake.forEach((segment) => {
        ctx.fillStyle = 'red'; // Red snake
        ctx.fillRect(segment.x, segment.y, 32, 32);
        ctx.strokeStyle = 'black';
        ctx.strokeRect(segment.x, segment.y, 32, 32);
    });

    // Draw food (frog emoji)
    ctx.font = '32px Arial';
    ctx.fillText('🐸', food.x + 5, food.y + 25);

    // Draw eagle (eagle emoji)
    ctx.fillText('🦅', eagle.x + 5, eagle.y + 25);

    // Draw obstacles
    ctx.fillStyle = 'black';
    obstacles.forEach(obstacle => {
        ctx.fillRect(obstacle.x, obstacle.y, 32, 32);
    });

    // Move snake
    moveSnake();

    if (checkCollision()) {
        gameOver();
    } else {
        setTimeout(drawGame, speed); // Adjust speed
    }
}

// Move Snake Function
function moveSnake() {
    let head = { ...snake[0] };
    if (direction === 'UP') head.y -= 32;
    else if (direction === 'DOWN') head.y += 32;
    else if (direction === 'LEFT') head.x -= 32;
    else if (direction === 'RIGHT') head.x += 32;

    // Check if snake has eaten the food
    if (head.x === food.x && head.y === food.y) {
        score += 1; // Increase score by 1
        food = generateFood(); // Generate new food

        // Increase speed after every 5 points
        if (score % 5 === 0) {
            speed = Math.max(100, speed - 10); // Increase speed but not below 100ms
        }
        snake.unshift(head); // Add new head
    } else {
        snake.pop(); // Remove the last segment
        snake.unshift(head); // Add new head
    }

    updateScore();
}

// Update Score Display
function updateScore() {
    document.getElementById('currentScore').innerText = `Score: ${score} | Lives: ${lives}`;
}

// Check Collision Function
function checkCollision() {
    const [head, ...body] = snake;
    return body.some(segment => segment.x === head.x && segment.y === head.y) ||
           head.x < 0 || head.x >= document.getElementById('gameCanvas').width || head.y < 0 || head.y >= document.getElementById('gameCanvas').height ||
           obstacles.some(obstacle => obstacle.x === head.x && obstacle.y === head.y); // Check collision with obstacles
}

// Game Over Function
function gameOver() {
    lives--; // Reduce lives
    if (lives > 0) {
        alert(`You lost a life! Lives left: ${lives}`);
        resetGame(); // Reset game
    } else {
        alert(`Game Over! Your score: ${score}`);
        gameStarted = false;
        document.getElementById('startGameButton').style.display = 'block';
        saveScore();
    }
}

// Reset Game Function
function resetGame() {
    direction = 'RIGHT';
    snake = [{ x: 9 * 32, y: 10 * 32 }]; // Reset snake position
    food = generateFood(); // Regenerate food
    eagle = generateEagle(); // Regenerate eagle
    obstacles = generateObstacles(5); // Regenerate obstacles
}

// Save Score Function
function saveScore() {
    const user = firebase.auth().currentUser;
    if (user) {
        // Check if this score is higher than the previously stored score
        db.ref('scores/' + user.uid).once('value').then(snapshot => {
            const previousScore = snapshot.val() ? snapshot.val().score : 0;
            if (score > previousScore) {
                db.ref('scores/' + user.uid).set({
                    name: user.displayName || user.email,
                    score: score,
                    profilePicture: user.photoURL || 'default_profile_pic.png',
                    uid: user.uid // Store UID
                });
                loadScores(); // Load scores after saving
            }
        });
    }
}

// Fetch and display scores
function loadScores() {
    db.ref('scores').orderByChild('score').limitToLast(10).once('value').then(snapshot => {
        const scores = [];
        snapshot.forEach(childSnapshot => {
            scores.push(childSnapshot.val());
        });
        displayScores(scores.reverse()); // Display from highest to lowest
    });
}

// Display scores in the scoreboard
function displayScores(scores) {
    const tbody = document.querySelector('#scoreTable tbody');
    tbody.innerHTML = '';

    // Fetch user data for each score
    const userPromises = scores.map(score => {
        return db.ref('users/' + score.uid).once('value').then(userSnapshot => {
            const userData = userSnapshot.val();
            if (userData) {
                return {
                    ...score,
                    name: userData.name, // Access name from user data
                    profilePicture: userData.profilePicture // Access profile picture from user data
                };
            } else {
                console.error(`No user data found for UID: ${score.uid}`);
                return {
                    ...score,
                    name: 'Anonymous', // Fallback name if no data found
                    profilePicture: 'default_profile_pic.png' // Fallback picture if no data found
                };
            }
        });
    });

    // Wait for all user data to be retrieved
    Promise.all(userPromises).then(fullScores => {
        fullScores.forEach((score, index) => {
            const badge = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
            const row = `<tr>
                <td>${index + 1}</td>
                <td>${badge} ${score.name}</td>
                <td>${score.score}</td>
                <td><img src="${score.profilePicture}" alt="Profile" width="30" height="30"></td>
            </tr>`;
            tbody.innerHTML += row;
        });
    }).catch(error => {
        console.error("Error loading user data: ", error);
    });
}

// Call loadScores() after the user signs in to update the scoreboard
firebase.auth().onAuthStateChanged(user => {
    if (user) {
        loadScores();
    }
});

// Control the snake with arrow keys
document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowUp' && direction !== 'DOWN') direction = 'UP';
    else if (event.key === 'ArrowDown' && direction !== 'UP') direction = 'DOWN';
    else if (event.key === 'ArrowLeft' && direction !== 'RIGHT') direction = 'LEFT';
    else if (event.key === 'ArrowRight' && direction !== 'LEFT') direction = 'RIGHT';
});
