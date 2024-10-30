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

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const storage = firebase.storage();
const auth = firebase.auth();

// Sign Out function
function signOut() {
    auth.signOut().then(() => window.location.href = 'index.html');
}

// Load Messages with Profile and Name
function loadMessages() {
    db.ref('messages').on('value', snapshot => {
        const chatBox = document.getElementById('chat-box');
        chatBox.innerHTML = '';
        snapshot.forEach(childSnapshot => {
            const message = childSnapshot.val();
            const messageDiv = document.createElement('div');
            messageDiv.classList.add('message-container');

            // Check if the message belongs to the current user
            if (message.userId === auth.currentUser.uid) {
                messageDiv.classList.add('right');
            } else {
                messageDiv.classList.add('left');
            }

            // Fetch user info (name and profile picture) from Firebase
            db.ref('users/' + message.userId).once('value').then(userSnapshot => {
                const userInfo = userSnapshot.val();
                const profilePicUrl = userInfo.profilePicture || 'default-profile.png'; // Placeholder if no profile pic
                const userName = userInfo.name || 'Anonymous';

                // Create elements for profile picture, name, and message text
                const profilePic = document.createElement('img');
                profilePic.src = profilePicUrl;
                profilePic.classList.add('profile-pic');

                const nameEl = document.createElement('span');
                nameEl.innerText = userName;
                nameEl.classList.add('user-name');

                const messageBubble = document.createElement('div');
                messageBubble.classList.add('message');
                if (message.userId === auth.currentUser.uid) {
                    messageBubble.classList.add('right');
                } else {
                    messageBubble.classList.add('left');
                }

                const messageText = document.createElement('p');
                messageText.innerText = message.text;
                messageBubble.appendChild(messageText);

                if (message.imageUrl) {
                    const img = document.createElement('img');
                    img.src = message.imageUrl;
                    img.style.maxWidth = '100%';
                    img.style.borderRadius = '5px';
                    messageBubble.appendChild(img);
                }

                // Append all elements to message container
                messageDiv.appendChild(profilePic);
                messageDiv.appendChild(nameEl);
                messageDiv.appendChild(messageBubble);
                chatBox.appendChild(messageDiv);

                // Auto-scroll to latest message
                chatBox.scrollTop = chatBox.scrollHeight;
            });
        });
    });
}

// Send Message with Image
document.getElementById('message-form').addEventListener('submit', event => {
    event.preventDefault();
    const userId = auth.currentUser.uid;
    const messageText = document.getElementById('message-input').value;
    const imageFile = document.getElementById('image-upload').files[0];

    let messageData = {
        userId: userId,
        text: messageText,
        timestamp: Date.now()
    };

    if (imageFile) {
        const storageRef = storage.ref('images/' + userId + '/' + Date.now() + '-' + imageFile.name);
        storageRef.put(imageFile).then(snapshot => {
            return snapshot.ref.getDownloadURL();
        }).then(downloadURL => {
            messageData.imageUrl = downloadURL;
            db.ref('messages').push(messageData);
        });
    } else {
        db.ref('messages').push(messageData);
    }
    document.getElementById('message-input').value = '';
    document.getElementById('image-upload').value = '';
});

// Monitor Auth State
auth.onAuthStateChanged(user => {
    if (user) {
        loadMessages();
    } else {
        window.location.href = 'sign.html';
    }
});
