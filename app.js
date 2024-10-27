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

// Profile Picture Hover Toggle
const profilePic = document.getElementById('profilePic');
const profileHover = document.getElementById('profileHover');
const profileContainer = document.getElementById('profileContainer');

profileContainer.addEventListener('mouseenter', () => {
    profileHover.classList.remove('hidden');
});

profileHover.addEventListener('mouseleave', () => {
    profileHover.classList.add('hidden');
});

profileContainer.addEventListener('mouseleave', (e) => {
    if (!profileHover.contains(e.relatedTarget)) {
        profileHover.classList.add('hidden');
    }
});

// Fetch and Display User Cards with Loading Spinner
function displayUserCards() {
    const loadingSpinner = document.getElementById('loadingSpinner');
    loadingSpinner.classList.remove('hidden');

    db.ref('users').once('value').then(snapshot => {
        const users = snapshot.val();
        const userCards = document.getElementById('userCards');
        userCards.innerHTML = ''; // Clear the current cards

        const verifiedUIDs = [
            '1pKKDxXspXaukLY115S53cO8kLV2',
            'anotherUID1',
            'anotherUID2'
        ];

        // Convert users object to array
        const userArray = Object.keys(users).map(uid => ({ uid, ...users[uid] }));

        // Shuffle function for random ordering
        function shuffleArray(array) {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
        }
        shuffleArray(userArray); // Shuffle user array

        userArray.forEach(({ uid, name, profilePicture, section, birthday, instagram, facebook }) => {
            const profilePicUrl = profilePicture || './img/def.png';
            const instagramUsername = instagram ? `https://instagram.com/${instagram}` : '#';
            const facebookUsername = facebook ? `https://facebook.com/${facebook}` : '#';

            const card = document.createElement('div');
            card.className = 'card p-4 bg-white shadow-lg rounded-lg';

            const isVerified = verifiedUIDs.includes(uid);
            const verificationIcon = isVerified ? 
                `<span class="relative inline-block">
                    <i class="fas fa-check-circle text-blue-500 ml-1" id="verificationTick"></i>
                    <span class="tooltip hidden absolute left-1/2 transform -translate-x-1/2 -translate-y-full mt-1 bg-gray-800 text-white text-xs rounded px-2 py-1">Verified</span>
                </span>` 
                : '';

            card.innerHTML = `
                <img src="${profilePicUrl}" class="w-16 h-16 rounded-full mx-auto" alt="Profile Picture">
                <h3 class="text-center font-semibold mt-2">${name} ${verificationIcon}</h3>
                <p class="text-center text-gray-500">${section}</p>
                <p class="text-center text-sm text-gray-400">Birthday: ${birthday}</p>
                <div class="text-center mt-3">
                    ${instagram ? `<a href="${instagramUsername}" target="_blank" class="text-pink-500 hover:text-pink-600 mx-2"><i class="fab fa-instagram"></i></a>` : ''}
                    ${facebook ? `<a href="${facebookUsername}" target="_blank" class="text-blue-700 hover:text-blue-800 mx-2"><i class="fab fa-facebook"></i></a>` : ''}
                </div>
                <a href="profile.html?uid=${uid}" class="text-center text-blue-500 hover:text-blue-700 mt-2 block">View Profile</a>
            `;

            userCards.appendChild(card);
        });

        loadingSpinner.classList.add('hidden');
    });
}



// Sign Out
function signOut() {
    auth.signOut().then(() => {
        window.location.href = './sign.html';
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
        window.location.href = './sign.html';
    }
});

// Debounce function to limit search input frequency
function debounce(func, delay) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

// Search Functionality with Debounce
document.getElementById('searchInput').addEventListener('input', debounce((event) => {
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
}, 300));

// Display user cards when page loads
window.onload = displayUserCards;
