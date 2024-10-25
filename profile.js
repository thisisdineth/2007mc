// Firebase configuration
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
const db = firebase.database();

// Get UID from URL
const urlParams = new URLSearchParams(window.location.search);
const uid = urlParams.get('uid');

// Fetch user data from Firebase Realtime Database
if (uid) {
    db.ref('users/' + uid).once('value').then(snapshot => {
        const userData = snapshot.val();
        
        // Display user data
        document.getElementById('profileName').innerText = userData.name;
        document.getElementById('profileSectionValue').innerText = userData.section;
        document.getElementById('profileBirthdayValue').innerText = userData.birthday;
        document.getElementById('profilePic').src = userData.profilePicture || './img/def.png';

        // Set Instagram and Facebook links, if provided
        if (userData.instagram) {
            document.getElementById('profileInstagram').href = `https://instagram.com/${userData.instagram}`;
        } else {
            document.getElementById('profileInstagram').style.display = 'none';
        }
        
        if (userData.facebook) {
            document.getElementById('profileFacebook').href = `https://facebook.com/${userData.facebook}`;
        } else {
            document.getElementById('profileFacebook').style.display = 'none';
        }
    }).catch(error => {
        console.error('Error loading user profile:', error);
    });
} else {
    console.error('UID not provided in URL');
}
