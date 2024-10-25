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
const menuBtn = document.getElementById('menuBtn');
const menu = document.getElementById('menu');
menuBtn.addEventListener('click', () => {
    menu.classList.toggle('hidden');
});

// Profile Picture Hover Toggle
const profilePic = document.getElementById('profilePic');
const profileHover = document.getElementById('profileHover');
const profileContainer = document.getElementById('profileContainer');

// Show the profile hover box on mouseenter and keep it visible
profileContainer.addEventListener('mouseenter', () => {
    profileHover.classList.remove('hidden');
});

// Hide the profile hover box on mouseleave
profileContainer.addEventListener('mouseleave', () => {
    profileHover.classList.add('hidden');
});

// Fetch and Display User Cards with Loading Spinner
function displayUserCards() {
    const loadingSpinner = document.getElementById('loadingSpinner');
    loadingSpinner.classList.remove('hidden');

    db.ref('users').once('value').then(snapshot => {
        const users = snapshot.val();
        const userCards = document.getElementById('userCards');
        userCards.innerHTML = ''; // Clear existing cards

        Object.keys(users).forEach(uid => {
            const user = users[uid];
            const profilePicUrl = user.profilePicture || 'def.png'; // Default profile picture

            const card = document.createElement('div');
            card.className = 'card p-4 bg-white shadow-lg rounded-lg';

            // User card content
            card.innerHTML = `
                <img src="${profilePicUrl}" class="w-16 h-16 rounded-full mx-auto" alt="Profile Picture">
                <h3 class="text-center font-semibold mt-2">${user.name}</h3>
                <p class="text-center text-gray-500">${user.section}</p>
                <p class="text-center text-sm text-gray-400">Birthday: ${user.birthday}</p>
            `;

            userCards.appendChild(card);
        });

        loadingSpinner.classList.add('hidden'); // Hide loading spinner
    });
}

// Sign Out
function signOut() {
    auth.signOut().then(() => {
        window.location.href = 'index.html'; // Redirect to sign-in page
    }).catch(error => {
        console.error("Sign-out error:", error);
    });
}

// Load Profile Picture for Current User
auth.onAuthStateChanged(user => {
    if (user) {
        db.ref('users/' + user.uid).once('value').then(snapshot => {
            const userData = snapshot.val();
            document.getElementById('userProfilePic').src = userData.profilePicture || 'def.png';
        });
    } else {
        window.location.href = 'index.html'; // Redirect if not logged in
    }
});

// Search Functionality
document.getElementById('searchInput').addEventListener('input', (event) => {
    const searchValue = event.target.value.toLowerCase();

    const allCards = document.querySelectorAll('#userCards .card');
    allCards.forEach(card => {
        const name = card.querySelector('h3').innerText.toLowerCase();
        const section = card.querySelector('p').innerText.toLowerCase();
        
        if (name.includes(searchValue) || section.includes(searchValue)) {
            card.classList.remove('hidden');
        } else {
            card.classList.add('hidden');
        }
    });
});

// Display user cards when page loads
window.onload = displayUserCards;
