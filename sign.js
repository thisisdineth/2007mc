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

// Show Sign Up Form
function showSignUp() {
    document.getElementById('sign-up-form').style.display = 'block';
    document.getElementById('sign-in-form').style.display = 'none';
}

// Show Sign In Form
function showSignIn() {
    document.getElementById('sign-up-form').style.display = 'none';
    document.getElementById('sign-in-form').style.display = 'block';
}

// Display Loader
function showLoader(show) {
    document.getElementById('loader').style.display = show ? 'block' : 'none';
}

// Display Error Message
function showError(message) {
    const errorDiv = document.getElementById('error-message');
    errorDiv.innerText = message;
    errorDiv.style.display = 'block';
    setTimeout(() => errorDiv.style.display = 'none', 5000);
}

// Validate Birthdate for Allowed Sign Up
function isValidBirthdate() {
    const birthday = document.getElementById('birthday').value;
    const birthDate = new Date(birthday);

    // Define allowed date range (January 1, 2007 - January 31, 2008)
    const startDate = new Date('2007-01-01');
    const endDate = new Date('2008-01-31');

    if (birthDate >= startDate && birthDate <= endDate) {
        return true;
    } else {
        showError("Are you sure you are in our batch?");
        return false;
    }
}

// Sign Up Function
function signUp() {
    if (!isValidBirthdate()) {
        return;  // Stop if birthdate is invalid
    }

    showLoader(true);
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const fileInput = document.getElementById('profilePicture'); // Get the file input
    const file = fileInput.files[0]; // Get the selected file

    // Get the selected section studied value
    const section = document.querySelector('input[name="section"]:checked').value;

    // Create user with email and password
    auth.createUserWithEmailAndPassword(email, password)
        .then(userCredential => {
            const user = userCredential.user;

            // Create a user object to store in the database
            const userData = {
                uid: user.uid,
                name: name,
                email: email,
                birthday: document.getElementById('birthday').value,
                section: section // Add the section studied to user data
            };

            // Store the user data in the Realtime Database
            return db.ref('users/' + user.uid).set(userData).then(() => {
                // Now upload the profile picture to Firebase Storage
                if (file) {
                    const storageRef = firebase.storage().ref(); // Create a storage reference
                    const profilePicRef = storageRef.child('profilePictures/' + user.uid + '/' + file.name); // Create a reference to the file location

                    return profilePicRef.put(file).then(snapshot => {
                        // Get the download URL of the uploaded image
                        return snapshot.ref.getDownloadURL().then(downloadURL => {
                            // Update user data with the profile picture URL
                            return db.ref('users/' + user.uid).update({
                                profilePicture: downloadURL
                            });
                        });
                    });
                }
            });
        })
        .then(() => {
            showLoader(false);
            window.location.href = "./app.html"; // Redirect after data is stored
        })
        .catch(error => {
            showLoader(false);
            showError(error.message);
        });
}



// Sign In Function
function signIn() {
    showLoader(true);
    const email = document.getElementById('signInEmail').value;
    const password = document.getElementById('signInPassword').value;

    auth.signInWithEmailAndPassword(email, password)
        .then(userCredential => {
            showLoader(false);
            window.location.href = "./app.html";
        })
        .catch(error => {
            showLoader(false);
            showError(error.message);
        });
}

// Forgot Password Function
function forgotPassword() {
    const email = document.getElementById('signInEmail').value;
    auth.sendPasswordResetEmail(email)
        .then(() => alert('Password reset link sent to your email'))
        .catch(error => showError(error.message));
}
