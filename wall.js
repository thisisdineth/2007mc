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
const auth = firebase.auth();
const db = firebase.database();
const storage = firebase.storage();
let currentUser;

auth.onAuthStateChanged(user => {
    if (user) {
        currentUser = user;
        loadPosts();
    } else {
        window.location.href = 'sign.html';
    }
});

function submitPost() {
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
            });
        }).catch(error => console.error("Image upload error:", error));
    } else {
        savePost(postId, postData);
    }
}

function savePost(postId, postData) {
    db.ref(`posts/${postId}`).set(postData).then(() => {
        document.getElementById('postText').value = '';
        document.getElementById('postImage').value = '';
        loadPosts();
    }).catch(error => console.error("Error saving post:", error));
}

function loadPosts() {
    const postList = document.getElementById('postList');
    postList.innerHTML = '';

    db.ref('posts').orderByChild('timestamp').once('value').then(snapshot => {
        snapshot.forEach(childSnapshot => {
            const postData = childSnapshot.val();
            const postDiv = document.createElement('div');
            postDiv.className = "post";

            // Fetch and display author info (name and profile photo)
            db.ref(`users/${postData.authorUID}`).once('value').then(userSnapshot => {
                const userData = userSnapshot.val();
                postDiv.innerHTML = `
                    <div class="flex items-center mb-2">
                        <img src="${userData.profilePicture}" alt="${userData.name}" class="w-10 h-10 rounded-full mr-2">
                        <strong>${userData.name}</strong>
                        <span class="ml-2 text-sm text-gray-500">${new Date(postData.timestamp).toLocaleString()}</span>
                    </div>
                    <p>${postData.text || ''}</p>
                    ${postData.imageURL ? `<img src="${postData.imageURL}" alt="Post Image"/>` : ''}
                    <div class="post-actions">
                        <button onclick="deletePost('${childSnapshot.key}')" class="text-red-500">Delete</button>
                        <button onclick="replyToPost('${childSnapshot.key}')" class="text-blue-500">Reply</button>
                        <button onclick="likePost('${childSnapshot.key}')" class="text-green-500">Like</button>
                    </div>
                `;
                postList.appendChild(postDiv);
            }).catch(error => console.error("Error fetching user info:", error));
        });
    }).catch(error => console.error("Error loading posts:", error));
}

function deletePost(postId) {
    db.ref(`posts/${postId}`).remove().then(() => {
        loadPosts();
    }).catch(error => console.error("Error deleting post:", error));
}

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

function likePost(postId) {
    db.ref(`posts/${postId}/likes/${currentUser.uid}`).set(true).catch(error => console.error("Error liking post:", error));
}
