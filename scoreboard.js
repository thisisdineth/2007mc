// Fetch and display scores
function loadScores() {
    db.ref('scores').orderByChild('score').limitToLast(10).once('value', snapshot => {
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
