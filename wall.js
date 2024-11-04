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

// Create Post
async function createPost() {
    const postText = document.getElementById('postText').value;
    const postImage = document.getElementById('postImage').files[0];

    if (!postText && !postImage) return alert('Please enter text or choose an image.');

    const postData = {
        text: postText,
        timestamp: Date.now(),
        uid: auth.currentUser.uid,
        authorName: auth.currentUser.displayName,
        authorPhoto: auth.currentUser.photoURL,
        likes: 0,
        replies: {}
    };

    if (postImage && postImage.size <= 16000000) {
        const imageRef = storage.ref().child(`posts/${auth.currentUser.uid}/${Date.now()}_${postImage.name}`);
        await imageRef.put(postImage);
        postData.imageUrl = await imageRef.getDownloadURL();
    }

    const postRef = db.ref('posts').push();
    await postRef.set(postData);
    document.getElementById('postText').value = '';
    document.getElementById('postImage').value = '';
    displayPosts();
}

// Display Posts with Shuffle
async function displayPosts() {
    const postsContainer = document.getElementById('postsContainer');
    postsContainer.innerHTML = '';

    const snapshot = await db.ref('posts').once('value');
    let postsArray = [];

    snapshot.forEach(childSnapshot => {
        let postData = childSnapshot.val();
        postData.key = childSnapshot.key;
        postsArray.push(postData);
    });

    postsArray.sort(() => Math.random() - 0.5); // Shuffle posts array

    postsArray.forEach(post => {
        const postCard = document.createElement('div');
        postCard.className = 'post-card bg-white p-4 rounded-lg shadow-md';

        postCard.innerHTML = `
            <div class="flex items-center mb-4">
                <img src="${post.authorPhoto || './img/def.png'}" alt="Author" class="w-10 h-10 rounded-full">
                <span class="ml-2 font-bold">${post.authorName}</span>
            </div>
            <p>${post.text}</p>
            ${post.imageUrl ? `<img src="${post.imageUrl}" class="mt-4 rounded-md">` : ''}
            <div class="flex items-center justify-between mt-4">
                <button onclick="toggleLike('${post.key}')" class="like-btn text-blue-500">
                    <i class="fas fa-thumbs-up"></i> <span>${post.likes}</span>
                </button>
                <button onclick="promptReply('${post.key}')" class="reply-btn text-gray-500">
                    <i class="fas fa-reply"></i> Reply
                </button>
                ${post.uid === auth.currentUser.uid ? `<button onclick="deletePost('${post.key}')" class="delete-btn text-red-500">Delete</button>` : ''}
            </div>
            <div id="replies_${post.key}" class="replies mt-4"></div>
        `;

        postsContainer.appendChild(postCard);
        loadReplies(post.key);
    });
}

// Toggle Like
async function toggleLike(postId) {
    const postRef = db.ref(`posts/${postId}`);
    const snapshot = await postRef.once('value');
    const post = snapshot.val();

    const hasLiked = await db.ref(`posts/${postId}/likes/${auth.currentUser.uid}`).once('value');
    const likeCount = post.likes || 0;

    if (hasLiked.exists()) {
        await db.ref(`posts/${postId}/likes/${auth.currentUser.uid}`).remove();
        postRef.update({ likes: likeCount - 1 });
    } else {
        await db.ref(`posts/${postId}/likes/${auth.currentUser.uid}`).set(true);
        postRef.update({ likes: likeCount + 1 });
    }

    displayPosts();
}

// Prompt for Reply
function promptReply(postId) {
    const replyText = prompt('Enter your reply:');
    if (replyText) addReply(postId, replyText);
}

// Add Reply
async function addReply(postId, replyText) {
    const replyData = {
        text: replyText,
        uid: auth.currentUser.uid,
        authorName: auth.currentUser.displayName,
        authorPhoto: auth.currentUser.photoURL,
        timestamp: Date.now()
    };

    await db.ref(`posts/${postId}/replies`).push(replyData);
    displayPosts();
}

// Load Replies
async function loadReplies(postId) {
    const repliesContainer = document.getElementById(`replies_${postId}`);
    const snapshot = await db.ref(`posts/${postId}/replies`).once('value');

    repliesContainer.innerHTML = '';
    snapshot.forEach(childSnapshot => {
        const reply = childSnapshot.val();
        const replyDiv = document.createElement('div');
        replyDiv.className = 'reply bg-gray-100 p-2 rounded-lg mt-2';

        replyDiv.innerHTML = `
            <div class="flex items-center mb-2">
                <img src="${reply.authorPhoto || 'img./def.png'}" alt="Author" class="w-6 h-6 rounded-full">
                <span class="ml-2 text-sm font-semibold">${reply.authorName}</span>
            </div>
            <p class="text-sm">${reply.text}</p>
        `;

        repliesContainer.appendChild(replyDiv);
    });
}

// Delete Post
async function deletePost(postId) {
    await db.ref(`posts/${postId}`).remove();
    displayPosts();
}

// Authentication Listener
auth.onAuthStateChanged(user => {
    if (user) {
        displayPosts();
    } else {
        alert('Please sign in to access the wall.');
    }
});
