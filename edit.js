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

// Show loader function
function showLoader(show) {
    document.getElementById('loader').style.display = show ? 'block' : 'none';
}

// Show error message function
function showError(message) {
    const errorDiv = document.getElementById('error-message');
    errorDiv.innerText = message;
    errorDiv.classList.remove('hidden');
    setTimeout(() => errorDiv.classList.add('hidden'), 5000);
}

// Load current user data
auth.onAuthStateChanged(user => {
    if (user) {
        db.ref('users/' + user.uid).once('value').then(snapshot => {
            const userData = snapshot.val();
            if (userData) {
                document.getElementById('name').value = userData.name;
                document.getElementById('birthday').value = userData.birthday;
                document.getElementById('section').value = userData.section || '';
                document.getElementById('instagram').value = userData.instagram || '';
                document.getElementById('facebook').value = userData.facebook || '';

                // Load profile picture
                if (userData.profilePicture) {
                    document.getElementById('profilePicturePreview').src = userData.profilePicture;
                }
            }
        });
    } else {
        window.location.href = './sign.html';
    }
});

// Profile update form submission
document.getElementById('editForm').addEventListener('submit', event => {
    event.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    showLoader(true);
    const section = document.getElementById('section').value;
    const instagram = document.getElementById('instagram').value;
    const facebook = document.getElementById('facebook').value;
    const fileInput = document.getElementById('profilePicture');
    const file = fileInput.files[0];

    // Check section edit permission
    db.ref('users/' + user.uid).once('value').then(snapshot => {
        const userData = snapshot.val();
        if (userData.section && userData.section !== section) {
            showError("You can change the section only once.");
            document.getElementById('section').value = userData.section;
            showLoader(false);
            return;
        }

        // Update user data
        const updates = { section, instagram, facebook };
        const updateUserData = () => db.ref('users/' + user.uid).update(updates);

        if (file) {
            // Check file size limit (2MB)
            if (file.size > 2 * 1024 * 1024) {
                showError("Profile picture size exceeds 2MB limit.");
                showLoader(false);
                return;
            }

            // Upload profile picture
            const profilePicRef = storage.ref('profilePictures/' + user.uid + '/' + file.name);
            profilePicRef.put(file).then(snapshot => {
                return snapshot.ref.getDownloadURL();
            }).then(downloadURL => {
                updates.profilePicture = downloadURL;
                return updateUserData();
            }).then(() => {
                showLoader(false);
                alert("Profile updated successfully!");
            }).catch(error => {
                showLoader(false);
                showError(error.message);
            });
        } else {
            updateUserData().then(() => {
                showLoader(false);
                alert("Profile updated successfully!");
            }).catch(error => {
                showLoader(false);
                showError(error.message);
            });
        }
    });
});

// Delete profile function
document.getElementById('deleteProfileBtn').addEventListener('click', () => {
    if (!confirm("Are you sure you want to delete your profile? This action cannot be undone.")) {
        return;
    }

    const user = auth.currentUser;
    if (!user) return;

    showLoader(true);
    db.ref('users/' + user.uid).remove().then(() => {
        return user.delete();
    }).then(() => {
        alert("Profile deleted successfully.");
        window.location.href = './sign.html';
    }).catch(error => {
        showLoader(false);
        showError(error.message);
    });
});
