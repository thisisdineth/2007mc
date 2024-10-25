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

window.onload = function() {
    auth.onAuthStateChanged(user => {
        if (user) {
            fetchUsers();
        } else {
            window.location.href = "sign.html"; // Redirect to sign-in page if not logged in
        }
    });
};

// Fetch Users from Firebase
function fetchUsers() {
    const userCardsContainer = document.getElementById('userCardsContainer');
    userCardsContainer.innerHTML = ''; // Clear the container

    db.ref('users').once('value')
        .then(snapshot => {
            snapshot.forEach(childSnapshot => {
                const userData = childSnapshot.val();
                const userCard = document.createElement('div');
                userCard.classList.add('user-card');
                userCard.innerHTML = `
                    <img src="${userData.profilePic || './img/logo.png'}" alt="${userData.name}">
                    <div>
                        <h4>${userData.name}</h4>
                        <p>Section: ${userData.section || 'Not defined'}</p>
                        <p>Birthday: ${new Date(userData.birthday).toLocaleDateString()}</p>
                        <button onclick="shareProfile('${childSnapshot.key}')">
                            <i class="fas fa-share-square"></i> Share Profile
                        </button>
                        <button onclick="viewProfile('${childSnapshot.key}')">
                            <i class="fas fa-eye"></i> View Profile
                        </button>
                    </div>
                `;
                userCardsContainer.appendChild(userCard);
            });
        })
        .catch(error => {
            console.error("Error fetching users:", error);
        });
}

// Filter Users
function filterUsers() {
    const searchInput = document.getElementById('searchInput').value.toLowerCase();
    const userCards = document.getElementsByClassName('user-card');

    Array.from(userCards).forEach(card => {
        const name = card.querySelector('h4').innerText.toLowerCase();
        card.style.display = name.includes(searchInput) ? 'flex' : 'none';
    });
}

// Share Profile Function
function shareProfile(userId) {
    const profileLink = `${window.location.origin}/profile.html?user=${userId}`;
    navigator.clipboard.writeText(profileLink)
        .then(() => {
            alert("Profile link copied to clipboard!");
        })
        .catch(err => {
            console.error("Failed to copy: ", err);
        });
}

// View Profile Function
function viewProfile(userId) {
    db.ref('users/' + userId).once('value')
        .then(snapshot => {
            const userData = snapshot.val();
            document.getElementById('profilePic').src = userData.profilePic || 'default.jpg';
            document.getElementById('profileName').innerText = userData.name;
            document.getElementById('profileSection').innerText = "Section: " + (userData.section || 'Not defined');
            document.getElementById('profileBirthday').innerText = "Birthday: " + new Date(userData.birthday).toLocaleDateString();
            document.getElementById('profileOverlay').style.display = 'flex';
        })
        .catch(error => {
            console.error("Error fetching profile:", error);
        });
}

// Close Profile View
function closeProfileView() {
    document.getElementById('profileOverlay').style.display = 'none';
}
