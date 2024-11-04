// Firebase Configuration
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID",
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
        window.location.href = 'sign.html'; // Redirect to sign-in page
    }
});

function submitPost() {
    const postText = document.getElementById('postText').value;
    const postImage = document.getElementById('postImage').files[0];

    if (postText.trim() === "" && !postImage) {
        alert("Please enter text or select an image.");
        return;
    }

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
        });
    } else {
        savePost(postId, postData);
    }
}

function savePost(postId, postData) {
    db.ref(`posts/${postId}`).set(postData).then(() => {
        document.getElementById('postText').value = '';
        document.getElementById('postImage').value = '';
        loadPosts();
        showNotification("New Post!", "Your post has been created.");
    });
}

function loadPosts() {
    const postList = document.getElementById('postList');
    postList.innerHTML = ''; // Clear previous posts

    db.ref('posts').once('value').then(snapshot => {
        snapshot.forEach(childSnapshot => {
            const postData = childSnapshot.val();
            const postDiv = document.createElement('div');
            postDiv.className = "post";
            postDiv.innerHTML = `
                <div>
                    <strong>${postData.authorUID}</strong>
                    <p>${new Date(postData.timestamp).toLocaleString()}</p>
                    <p>${postData.text || ''}</p>
                    ${postData.imageURL ? `<img src="${postData.imageURL}" alt="Post Image"/>` : ''}
                </div>
                <div class="post-actions">
                    <button onclick="deletePost('${childSnapshot.key}')" class="text-red-500">Delete</button>
                </div>
            `;
            postList.appendChild(postDiv);
        });
    });
}

function deletePost(postId) {
    if (confirm("Are you sure you want to delete this post?")) {
        db.ref(`posts/${postId}`).remove().then(() => {
            loadPosts();
            showNotification("Post Deleted", "Your post has been deleted.");
        });
    }
}

function showNotification(title, message) {
    const options = {
        body: message,
        icon: '/path/to/icon.png' // Change to your notification icon
    };
    if (Notification.permission === "granted") {
        new Notification(title, options);
    } else if (Notification.permission === "default") {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                new Notification(title, options);
            }
        });
    }
}

// Initialize Firebase Cloud Messaging
const messaging = firebase.messaging();
messaging.usePublicVapidKey("YOUR_PUBLIC_VAPID_KEY"); // Set your public Vapid key here
messaging.requestPermission()
    .then(() => {
        console.log('Notification permission granted.');
        return messaging.getToken();
    })
    .then(token => {
        console.log('FCM Token:', token);
    })
    .catch(err => {
        console.error('Unable to get permission to notify.', err);
    });
