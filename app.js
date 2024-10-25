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

// Check Authentication Status
auth.onAuthStateChanged(user => {
    if (user) {
        document.getElementById('profilePicture').src = user.photoURL || 'default-profile.png'; // Set default image if none exists
        document.getElementById('userName').innerText = user.displayName || user.email;
        loadUsers();
    } else {
        window.location.href = "sign.html"; // Redirect to sign in page if not authenticated
    }
});

// Load Users Function
function loadUsers() {
    db.ref('users').once('value').then(snapshot => {
        const users = snapshot.val();
        const container = document.getElementById('userCardsContainer');
        container.innerHTML = ''; // Clear previous users
        for (const uid in users) {
            const userData = users[uid];
            const card = document.createElement('div');
            card.classList.add('user-card');
            card.innerHTML = `
                <img src="${userData.profilePicture || 'default-profile.png'}" alt="${userData.name}" />
                <h3>${userData.name}</h3>
                <p>Section: ${userData.section}</p>
                <p>Birthday: ${userData.birthday}</p>
            `;
            container.appendChild(card);
        }
    });
}

// Sign Out Function
function signOut() {
    auth.signOut().then(() => {
        window.location.href = "sign.html"; // Redirect to sign in page after sign out
    });
}

// Search Function
function searchUsers() {
    const query = document.getElementById('searchBar').value.toLowerCase();
    const userCards = document.getElementsByClassName('user-card');

    Array.from(userCards).forEach(card => {
        const name = card.querySelector('h3').innerText.toLowerCase();
        if (name.includes(query)) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
}

// Hamburger Menu Toggle
function toggleMenu() {
    const sidebar = document.getElementById('sidebar');
    sidebar.style.left = sidebar.style.left === '0px' ? '-250px' : '0px';
}

// Placeholder functions for navigation
function loadHome() { /* Logic to load home content */ }
function loadPortal() { /* Logic to load portal content */ }
function loadApps() { /* Logic to load apps content */ }
