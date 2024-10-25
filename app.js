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

// Toggle Hamburger Menu
document.getElementById('menuBtn').addEventListener('click', () => {
    const menu = document.getElementById('menu');
    menu.classList.toggle('hidden');
});

// Fetch and Display User Cards
function displayUserCards() {
    db.ref('users').once('value').then(snapshot => {
        const users = snapshot.val();
        const userCards = document.getElementById('userCards');
        userCards.innerHTML = ''; // Clear existing cards

        Object.keys(users).forEach(uid => {
            const user = users[uid];
            const card = document.createElement('div');
            card.className = 'card p-4 bg-white shadow-lg rounded-lg';

            // User card content
            card.innerHTML = `
                <img src="${user.profilePicture}" class="w-16 h-16 rounded-full mx-auto" alt="Profile Picture">
                <h3 class="text-center font-semibold mt-2">${user.name}</h3>
                <p class="text-center text-gray-500">${user.section}</p>
                <p class="text-center text-sm text-gray-400">Birthday: ${user.birthday}</p>
            `;

            userCards.appendChild(card);
        });
    });
}

// Sign Out
function signOut() {
    auth.signOut().then(() => {
        window.location.href = './sign.html'; // Redirect to sign-in page
    }).catch(error => {
        console.error("Sign-out error:", error);
    });
}

// Load Profile Picture for Current User
auth.onAuthStateChanged(user => {
    if (user) {
        db.ref('users/' + user.uid).once('value').then(snapshot => {
            const userData = snapshot.val();
            document.getElementById('userProfilePic').src = userData.profilePicture;
        });
    } else {
        window.location.href = './sign.html'; // Redirect if not logged in
    }
});

// Display user cards when page loads
window.onload = displayUserCards;
