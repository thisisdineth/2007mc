// Firebase configuration
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
const db = firebase.database();

// Get UID from URL
const urlParams = new URLSearchParams(window.location.search);
const uid = urlParams.get('uid');

// Elements for comment section
const commentForm = document.getElementById('commentForm');
const commentText = document.getElementById('commentText');
const commentsList = document.getElementById('commentsList');

// Fetch and display user data from Firebase Realtime Database
if (uid) {
    db.ref('users/' + uid).once('value').then(snapshot => {
        const userData = snapshot.val();
        
        // Display user data
        document.getElementById('profileName').innerText = userData.name;
        document.getElementById('profileSectionValue').innerText = userData.section;
        document.getElementById('profileBirthdayValue').innerText = userData.birthday;
        document.getElementById('profilePic').src = userData.profilePicture || './img/def.png';

        // Set Instagram and Facebook links, if provided
        if (userData.instagram) {
            document.getElementById('profileInstagram').href = `https://instagram.com/${userData.instagram}`;
        } else {
            document.getElementById('profileInstagram').style.display = 'none';
        }
        
        if (userData.facebook) {
            document.getElementById('profileFacebook').href = `https://facebook.com/${userData.facebook}`;
        } else {
            document.getElementById('profileFacebook').style.display = 'none';
        }
    }).catch(error => {
        console.error('Error loading user profile:', error);
    });
} else {
    console.error('UID not provided in URL');
}

// Updated to include HTML structure for better UX in comment display
function loadComments() {
    db.ref(`users/${uid}/comments`).on('value', (snapshot) => {
        commentsList.innerHTML = ''; // Clear existing comments
        snapshot.forEach((childSnapshot) => {
            const commentData = childSnapshot.val();
            const commentKey = childSnapshot.key;

            const commentItem = document.createElement('li');
            commentItem.classList.add('comment-item');

            // Display author and text
            const authorElement = document.createElement('span');
            authorElement.classList.add('comment-author');
            authorElement.textContent = commentData.author;
            
            const textElement = document.createElement('p');
            textElement.classList.add('comment-text');
            textElement.textContent = commentData.text;

            commentItem.appendChild(authorElement);
            commentItem.appendChild(textElement);

            // Check if current user is the author or profile owner to show delete button
            firebase.auth().onAuthStateChanged((currentUser) => {
                if (currentUser && (currentUser.uid === commentData.authorId || currentUser.uid === uid)) {
                    const deleteButton = document.createElement('button');
                    deleteButton.textContent = 'Delete';
                    deleteButton.onclick = () => deleteComment(commentKey);
                    commentItem.appendChild(deleteButton);
                }
            });

            commentsList.appendChild(commentItem);
        });
    });
}


// Function to delete a comment
function deleteComment(commentKey) {
    db.ref(`users/${uid}/comments/${commentKey}`).remove()
        .then(() => {
            console.log('Comment deleted successfully');
        })
        .catch((error) => {
            console.error('Error deleting comment:', error);
        });
}

// Handle new comment submission
commentForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const currentUser = firebase.auth().currentUser;
    if (currentUser) {
        // Fetch the current user's display name from Firebase
        db.ref('users/' + currentUser.uid).once('value').then(snapshot => {
            const userData = snapshot.val();
            const newComment = {
                text: commentText.value,
                author: userData.name || 'Anonymous', // Use Firebase name if available
                authorId: currentUser.uid, // Save author ID for delete verification
                timestamp: firebase.database.ServerValue.TIMESTAMP
            };
            db.ref(`users/${uid}/comments`).push(newComment)
                .then(() => {
                    commentText.value = ''; // Clear input after posting
                })
                .catch((error) => {
                    console.error('Error posting comment:', error);
                });
        });
    } else {
        alert('You must be signed in to post a comment.');
    }
});

// Check authentication state and load comments
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        loadComments();
    } else {
        alert('You must be signed in to view or post comments.');
    }
});
