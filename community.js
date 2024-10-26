import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getDatabase, ref, set, push, onValue, get, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";

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
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

let currentUser = null;
let typingRef = null;


// Sign in function (use email and password)
function signIn(email, password) {
    signInWithEmailAndPassword(auth, email, password).catch((error) => {
        console.error("Authentication error:", error);
    });
}

// Retrieve user profile data from Realtime Database
function fetchUserProfile(uid) {
    return get(ref(db, 'users/' + uid)).then((snapshot) => {
        if (snapshot.exists()) {
            return snapshot.val();
        } else {
            console.error("User profile not found");
            return { name: "Anonymous", profilePicture: "default-avatar.png" };
        }
    }).catch((error) => {
        console.error("Error fetching user profile:", error);
        return { name: "Anonymous", profilePicture: "default-avatar.png" };
    });
}

// On Auth state change, retrieve user info and setup chat
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        const userProfile = await fetchUserProfile(user.uid);

        currentUser.displayName = userProfile.name;
        currentUser.photoURL = userProfile.profilePicture || "default-avatar.png";

        setupCommunityChat();
    }
});

function setupCommunityChat() {
    setUserOnline();
    updateActiveUserCount();
    listenForMessages();
    setupTypingListener();
}

// Mark user as active in the database
function setUserOnline() {
    const userRef = ref(db, `activeUsers/${currentUser.uid}`);
    set(userRef, { 
        uid: currentUser.uid, 
        name: currentUser.displayName, 
        photoURL: currentUser.photoURL,
        timestamp: serverTimestamp() 
    });
}

// Update active user count
function updateActiveUserCount() {
    const activeUsersRef = ref(db, 'activeUsers');
    onValue(activeUsersRef, (snapshot) => {
        const activeCount = snapshot.exists() ? Object.keys(snapshot.val()).length : 0;
        document.getElementById('active-user-count').textContent = activeCount;
    });
}

// Listen for incoming messages
function listenForMessages() {
    const chatMessagesRef = ref(db, 'communityChat/messages');
    onValue(chatMessagesRef, (snapshot) => {
        const chatBox = document.getElementById('chat-box');
        chatBox.innerHTML = '';

        snapshot.forEach((childSnapshot) => {
            const messageData = childSnapshot.val();
            messageData.id = childSnapshot.key; // Attach message ID
            const messageDiv = createMessageElement(messageData);
            chatBox.appendChild(messageDiv);
        });

    });
}


// Create message elements with actions
function createMessageElement(messageData) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', messageData.uid === currentUser.uid ? 'you' : 'stranger');

    const profileImg = document.createElement('img');
    profileImg.classList.add('profile-picture');
    profileImg.src = messageData.photoURL || 'default-avatar.png';

    const textDiv = document.createElement('span');
    textDiv.textContent = `${messageData.name || "Anonymous"}: ${messageData.message}`;

    // Actions (Delete, React, Reply)
    const actionsDiv = document.createElement('div');
    actionsDiv.classList.add('message-actions');

    if (messageData.uid === currentUser.uid) {
        const deleteBtn = document.createElement('button');
        deleteBtn.classList.add('message-action-btn');
        deleteBtn.textContent = 'Delete';
        deleteBtn.onclick = () => deleteMessage(messageData.id);
        actionsDiv.appendChild(deleteBtn);
    }



    messageDiv.appendChild(profileImg);
    messageDiv.appendChild(textDiv);
    messageDiv.appendChild(actionsDiv);

    // Swipe-to-reply
    messageDiv.addEventListener('touchstart', handleSwipeToReply);

    return messageDiv;
}

// Delete a message
function deleteMessage(messageId) {
    const messageRef = ref(db, `communityChat/messages/${messageId}`);
    set(messageRef, null);
}

// React to a message
function reactToMessage(messageId) {
    const messageRef = ref(db, `communityChat/messages/${messageId}`);
    set(ref(messageRef, 'reaction'), '👍');
}

// Start reply
function startReply(messageData) {
    const chatInput = document.getElementById('chat-input');
    chatInput.value = `Replying to ${messageData.name}: "${messageData.message}" - `;
    chatInput.focus();
}

// Swipe-to-reply functionality
let touchStartX = 0;
function handleSwipeToReply(event) {
    if (event.type === 'touchstart') {
        touchStartX = event.touches[0].clientX;
    } else if (event.type === 'touchend') {
        const touchEndX = event.changedTouches[0].clientX;
        if (touchStartX - touchEndX > 50) {
            startReply(event.currentTarget.messageData);
        }
    }
}

// Typing indicator
function setupTypingListener() {
    const typingIndicatorRef = ref(db, 'communityChat/typing');
    console.log("Listening for typing data...");
    
    onValue(typingIndicatorRef, (snapshot) => {
        const typingData = snapshot.val();
        console.log("Typing data received:", typingData);
        
        const typingIndicator = document.getElementById('typing-indicator');
        if (!typingIndicator) {
            console.error("Typing indicator element not found!");
            return; // Exit if the element does not exist
        }

        if (typingData && typingData.uid && typingData.uid !== currentUser .uid) {
            typingIndicator.textContent = `${typingData.name || "Someone"} is typing...`;
        } else {
            typingIndicator.textContent = "";
        }
    });
}

// Send a message
function sendMessage() {
    const messageInput = document.getElementById('chat-input');
    const message = messageInput.value;
    if (!message.trim()) return;

    const messagesRef = ref(db, 'communityChat/messages');
    push(messagesRef, {
        uid: currentUser.uid,
        name: currentUser.displayName,
        message,
        photoURL: currentUser.photoURL,
        timestamp: serverTimestamp()
    });

    messageInput.value = '';
    clearTypingStatus();
}

// Handle typing indicator updates
function handleTyping() {
    typingRef = ref(db, 'communityChat/typing');
    set(typingRef, { uid: currentUser.uid, name: currentUser.displayName, timestamp: serverTimestamp() });
}

function clearTypingStatus() {
    if (typingRef) set(typingRef, null);
}

// Event Listeners
document.getElementById('send-btn').addEventListener('click', sendMessage);
document.getElementById('chat-input').addEventListener('input', handleTyping);
document.getElementById('chat-input').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        sendMessage();
    }
});
setInterval(() => {
    document.getElementById('local-time').textContent = new Date().toLocaleTimeString();
}, 1000);
