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
const storage = firebase.storage();

function showLoader(show) {
    document.getElementById('loader').style.display = show ? 'block' : 'none';
}

function showError(message) {
    const errorDiv = document.getElementById('error-message');
    errorDiv.innerText = message;
    errorDiv.style.display = 'block';
    setTimeout(() => errorDiv.style.display = 'none', 5000);
}

function loadProfileData() {
    showLoader(true);
    const user = auth.currentUser;
    if (user) {
        db.ref('users/' + user.uid).get().then(snapshot => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                document.getElementById('email').value = data.email || '';
                document.getElementById('name').value = data.name || '';
                document.getElementById('schoolID').value = data.schoolID || '';
                document.getElementById('birthday').value = data.birthday || '';
                document.getElementById('section').value = data.section || '';
                document.getElementById('instagram').value = data.instagram || '';
                document.getElementById('facebook').value = data.facebook || '';
                if (data.profilePicture) {
                    document.getElementById('profileImage').src = data.profilePicture;
                }
            }
        }).catch(error => showError(error.message)).finally(() => showLoader(false));
    }
}

function updateProfile() {
    showLoader(true);
    const user = auth.currentUser;
    const instagram = document.getElementById('instagram').value;
    const facebook = document.getElementById('facebook').value;
    const newProfilePic = document.getElementById('newProfilePicture').files[0];

    const updates = {
        instagram: instagram || null,
        facebook: facebook || null
    };

    if (newProfilePic) {
        const storageRef = storage.ref().child('profilePictures/' + user.uid + '/' + newProfilePic.name);
        storageRef.put(newProfilePic).then(snapshot => {
            return snapshot.ref.getDownloadURL();
        }).then(downloadURL => {
            updates.profilePicture = downloadURL;
            return db.ref('users/' + user.uid).update(updates);
        }).then(() => alert("Profile updated successfully!"))
          .catch(error => showError(error.message))
          .finally(() => showLoader(false));
    } else {
        db.ref('users/' + user.uid).update(updates).then(() => {
            alert("Profile updated successfully!");
        }).catch(error => showError(error.message)).finally(() => showLoader(false));
    }
}

function deleteProfile() {
    const user = auth.currentUser;
    if (confirm("Are you sure you want to delete your profile? This action cannot be undone.")) {
        db.ref('users/' + user.uid).remove().then(() => {
            return user.delete();
        }).then(() => {
            alert("Profile deleted successfully.");
            window.location.href = "./sign-in.html"; // Redirect after deletion
        }).catch(error => showError(error.message));
    }
}

// Load profile data on page load
auth.onAuthStateChanged((user) => {
    if (user) {
        loadProfileData();
    } else {
        window.location.href = "./sign-in.html"; // Redirect to sign-in if not authenticated
    }
});
