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

function showLoadingSpinner(show) {
    document.getElementById('loadingSpinner').classList.toggle('hidden', !show);
}

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
            });
        }).catch(error => {
            console.error("Image upload error:", error);
            showLoadingSpinner(false);
        });
    } else {
        savePost(postId, postData);
    }
}

function savePost(postId, postData) {
    db.ref(`posts/${postId}`).set(postData).then(() => {
        document.getElementById('postText').value = '';
        document.getElementById('postImage').value = '';
        showLoadingSpinner(false);
        loadPosts();
    }).catch(error => {
        console.error("Error saving post:", error);
        showLoadingSpinner(false);
    });
}

function loadPosts() {
    showLoadingSpinner(true);
    const postList = document.getElementById('postList');
    postList.innerHTML = '';

    // Listen for any changes in the posts
    db.ref('posts').orderByChild('timestamp').on('child_added', snapshot => {
        const postData = snapshot.val();
        const postDiv = document.createElement('div');
        postDiv.className = "post";
        
        // Fetch user data for the post's author
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

            // Load and display replies for the post
            const repliesDiv = postDiv.querySelector('.replies');
            db.ref(`posts/${snapshot.key}/replies`).on('child_added', replySnapshot => {
                const replyData = replySnapshot.val();
                const replyDiv = document.createElement('div');
                replyDiv.className = "reply mb-2 p-2 border-t border-gray-300";
                
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
                });
            });
        }).catch(error => console.error("Error fetching user info:", error));
    });

    // Listen for post updates (edits/deletes) and remove/add them accordingly
    db.ref('posts').on('child_removed', snapshot => {
        const postDivs = document.querySelectorAll('.post');
        postDivs.forEach(postDiv => {
            if (postDiv.getAttribute('data-post-id') === snapshot.key) {
                postDiv.remove(); // Remove the post element from the DOM
            }
        });
    });
    showLoadingSpinner(false);
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
        db.ref(`posts/${postId}/replies`).push(replyData).then(() => {
            loadPosts(); // Refresh to show the new reply
        }).catch(error => console.error("Error replying to post:", error));
    }
}


function likePost(postId) {
    db.ref(`posts/${postId}/likes/${currentUser.uid}`).set(true).catch(error => console.error("Error liking post:", error));
}