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
let eagle = generateEagle();

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

// Start Game Function
document.getElementById('startGameButton').addEventListener('click', startGame);

function startGame() {
    if (gameStarted) return;
    gameStarted = true;
    score = 0; // Reset score
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
    snake.forEach((segment, index) => {
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

    // Move snake
    moveSnake();

    if (checkCollision()) {
        gameOver();
    } else {
        setTimeout(drawGame, 100);
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
        snake.unshift(head); // Add new head
    } else {
        // Check if snake has touched the eagle
        if (head.x === eagle.x && head.y === eagle.y) {
            gameOver(); // Game over if touching eagle
        } else {
            snake.pop(); // Remove the last segment
            snake.unshift(head); // Add new head
        }
    }

    updateScore();
}

// Update Score Display
function updateScore() {
    document.getElementById('currentScore').innerText = `Score: ${score}`;
}

// Check Collision Function
function checkCollision() {
    const [head, ...body] = snake;
    return body.some(segment => segment.x === head.x && segment.y === head.y) ||
           head.x < 0 || head.x >= document.getElementById('gameCanvas').width || head.y < 0 || head.y >= document.getElementById('gameCanvas').height;
}

// Game Over Function
function gameOver() {
    alert(`Game Over! Your score: ${score}`);
    gameStarted = false;
    document.getElementById('startGameButton').style.display = 'block';
    saveScore();
}

// Save Score Function
function saveScore() {
    const user = firebase.auth().currentUser;
    if (user) {
        // Use the uid to fetch user details from the users database
        db.ref('users/' + user.uid).once('value').then(userSnapshot => {
            const userData = userSnapshot.val();
            if (userData) {
                const { name, profilePicture } = userData; // Fetching name and profile picture
                db.ref('scores/' + user.uid).set({
                    name: name || 'Anonymous',
                    score: score,
                    profilePicture: profilePicture || 'default_profile_pic.png'
                }).then(() => {
                    loadScores(); // Load scores after saving
                }).catch(error => {
                    console.error("Error saving score: ", error);
                });
            }
        }).catch(error => {
            console.error("Error fetching user data: ", error);
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
    }).catch(error => {
        console.error("Error loading scores: ", error);
    });
}

// Display scores in the scoreboard
function displayScores(scores) {
    const tbody = document.querySelector('#scoreTable tbody');
    tbody.innerHTML = '';

    scores.forEach((score, index) => {
        const badge = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
        const row = `<tr>
            <td>${index + 1}</td>
            <td>${badge} ${score.name}</td>
            <td>${score.score}</td>
            <td><img src="${score.profilePicture}" alt="Profile" width="30" height="30"></td>
        </tr>`;
        tbody.innerHTML += row;
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
