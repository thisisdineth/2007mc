// Firebase configuration and initialization
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
const auth = firebase.auth();
const db = firebase.database();
const storage = firebase.storage();
let currentUser;

// Monitor authentication state and initialize listeners
auth.onAuthStateChanged(user => {
    if (user) {
        currentUser = user;
        initializeListeners(); // Initialize listeners only once when the user logs in
    } else {
        window.location.href = 'sign.html';
    }
});

// Show/hide loading spinner
function showLoadingSpinner(show) {
    document.getElementById('loadingSpinner').classList.toggle('hidden', !show);
}

// Submit a new post with optional image upload
function submitPost() {
    showLoadingSpinner(true);
    const postText = document.getElementById('postText').value;
    const postImage = document.getElementById('postImage').files[0];
    const postRef = db.ref('posts').push();
    const postId = postRef.key;

    const postData = {
        authorUID: currentUser.uid,
        text: postText,
        timestamp: Date.now(),
    };

    if (postImage) {
        const storageRef = storage.ref(`posts/${postId}/${postImage.name}`);
        storageRef.put(postImage).then(() => {
            storageRef.getDownloadURL().then(url => {
                postData.imageURL = url;
                savePost(postId, postData);
            }).catch(error => {
                console.error("Error getting image URL:", error);
                showLoadingSpinner(false);
            });
        }).catch(error => {
            console.error("Error uploading image:", error);
            showLoadingSpinner(false);
        });
    } else {
        savePost(postId, postData);
    }
}

// Save post data to the database
function savePost(postId, postData) {
    db.ref(`posts/${postId}`).set(postData).then(() => {
        document.getElementById('postText').value = '';
        document.getElementById('postImage').value = '';
        showLoadingSpinner(false);
    }).catch(error => {
        console.error("Error saving post:", error);
        showLoadingSpinner(false);
    });
}

// Initialize listeners for loading posts and replies
function initializeListeners() {
    // Remove any existing listeners to prevent duplicates
    db.ref('posts').off();

    // Attach fresh listeners for posts
    db.ref('posts').orderByChild('timestamp').on('child_added', snapshot => {
        addPostToDOM(snapshot);
    });

    // Listen for post removals
    db.ref('posts').on('child_removed', snapshot => {
        const postDiv = document.querySelector(`.post[data-post-id="${snapshot.key}"]`);
        if (postDiv) postDiv.remove();
    });
}

// Load and display a single post, including replies
function addPostToDOM(snapshot) {
    const postData = snapshot.val();
    const postList = document.getElementById('postList');
    const postDiv = document.createElement('div');
    postDiv.className = "post";
    postDiv.setAttribute('data-post-id', snapshot.key); // Set data attribute for reference

    // Fetch and display the author's user data
    db.ref(`users/${postData.authorUID}`).once('value').then(userSnapshot => {
        const userData = userSnapshot.val();
        postDiv.innerHTML = `
            <div class="flex items-center mb-2">
                <img src="${userData.profilePicture}" alt="${userData.name}" class="w-10 h-10 rounded-full mr-2">
                <strong>${userData.name}</strong>
                <span class="ml-2 text-sm text-gray-500">${new Date(postData.timestamp).toLocaleString()}</span>
            </div>
            <p>${postData.text || ''}</p>
            ${postData.imageURL ? `<img src="${postData.imageURL}" alt="Post Image" class="post-image"/>` : ''}
            <div class="post-actions">
                <button onclick="deletePost('${snapshot.key}')" class="text-red-500">Delete</button>
                <button onclick="replyToPost('${snapshot.key}')" class="text-blue-500">Reply</button>
                <button onclick="likePost('${snapshot.key}')" class="text-green-500">Like</button>
            </div>
            <div class="replies mt-4"></div> <!-- Container for replies -->
        `;

        postList.appendChild(postDiv);
        loadReplies(snapshot.key, postDiv.querySelector('.replies'));
    }).catch(error => console.error("Error fetching user info:", error));
}

// Load replies for a given post and display them
function loadReplies(postId, repliesDiv) {
    // Clear any existing listeners for replies to prevent duplication
    db.ref(`posts/${postId}/replies`).off();

    // Attach a listener for replies to the specific post
    db.ref(`posts/${postId}/replies`).on('child_added', replySnapshot => {
        const replyData = replySnapshot.val();
        const replyDiv = document.createElement('div');
        replyDiv.className = "reply mb-2 p-2 border-t border-gray-300";

        // Fetch and display reply author's user data
        db.ref(`users/${replyData.authorUID}`).once('value').then(replyUserSnapshot => {
            const replyUserData = replyUserSnapshot.val();
            replyDiv.innerHTML = `
                <div class="flex items-center mb-1">
                    <img src="${replyUserData.profilePicture}" alt="${replyUserData.name}" class="w-8 h-8 rounded-full mr-2">
                    <strong>${replyUserData.name}</strong>
                    <span class="ml-2 text-xs text-gray-500">${new Date(replyData.timestamp).toLocaleString()}</span>
                </div>
                <p class="ml-10">${replyData.text}</p>
            `;
            repliesDiv.appendChild(replyDiv);
        }).catch(error => console.error("Error fetching reply user info:", error));
    });
}

// Delete a post by its ID
function deletePost(postId) {
    db.ref(`posts/${postId}`).remove().catch(error => console.error("Error deleting post:", error));
}

// Add a reply to a post
function replyToPost(postId) {
    const replyText = prompt("Enter your reply:");
    if (replyText) {
        const replyData = {
            text: replyText,
            authorUID: currentUser.uid,
            timestamp: Date.now()
        };
        db.ref(`posts/${postId}/replies`).push(replyData).catch(error => console.error("Error replying to post:", error));
    }
}

// Like a post by adding a like entry
function likePost(postId) {
    db.ref(`posts/${postId}/likes/${currentUser.uid}`).set(true).catch(error => console.error("Error liking post:", error));
}
