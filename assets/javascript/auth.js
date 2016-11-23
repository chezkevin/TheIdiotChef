// global configuration details are outside the document.ready function for now

var config = {
    apiKey: "AIzaSyCfGxrkb9P3oYRWrQ5XL4wxNmpyv_x9VL0",
    authDomain: "theidiotchef-149717.firebaseapp.com",
    databaseURL: "https://theidiotchef-149717.firebaseio.com",
    storageBucket: "theidiotchef-149717.appspot.com",
    messagingSenderId: "963963795794"
};

firebase.initializeApp(config);

var database = firebase.database();
// decided to use one main db folder for all members
var memberFolder = database.ref('/members/');

$(document).ready(function() {

let uid = ''; //user id for tracking purposes
var currentUser;
var regFlag = true;
var userProfile = {
    userID: uid,
    email: '',
    loginStatus: null,
    previousSearch: {},
    lastLogIn: firebase.database.ServerValue.TIMESTAMP
};


function initialState() {

    $('#registration-panel').hide();
    $('#navbar-logout-button').hide();
    $('#registration-modal').hide();
    $('#upgrade-from-guest').hide();

}

function captureUserData(user){
    //create user ID, capture it, and make a baseline profile    
    uid = user.uid;
    //capture that actual user id, set as var accessible to other functions in the page 
    userProfile.userID = uid;
    userProfile.loginStatus = true;
    userProfile.email = user.email;
    console.log(user.email);
    if (userProfile.email === null){
        userProfile.email = "guest";
    }
    let userFolder = database.ref('/members/' + uid);
    // add to database
    userFolder.set(userProfile);
    // what to do when user closes window / disconnects
    // Logout handled later on
    console.log(userProfile.userID);
    if (userProfile.email === 'guest'){
        // let userFolder = database.ref('/members/' + uid);
        userFolder.onDisconnect().remove();
    } 
    // else {
    //     let loginStatusFolder = database.ref('/members/' + userProfile.userID + '/loginStatus');
    //     loginStatusFolder.onDisconnect().set("false");
    // }    

        
}



//anonymously login the user - for Guest User option
function anonymousLogIn() {
    firebase.auth().signInAnonymously()
        .then(user => {
            // capture the user data as guest
            captureUserData(user);
            // if successful login then show upgrade button
            $('#upgrade-from-guest').addClass('show');
            
        }).catch(e => {
            let errorCode = e.code;
            let errorMessage = e.message;
            // try to make errors plain English
            if (errorCode = "auth/network-request-failed") {
                let displayMessage = 'Network error - unable to login as guest. Please try again.';
            }
            else {
                let displayMessage = '<p> Guest Login Error: ' + errorCode + ' Please try again.</p>';
            }

            let displayMessage = '<p>Login Error: ' + errorMessage + ' Please try again.</p>';
            displayErrorMessage(displayMessage); //modal not popping *****

        });
}

//login in an existing user
function memberLogIn() {

    let email = $('#email-input').val().trim();
    let pass = $('#password-input').val().trim();

    //clear out the inputs
    $('#email-input').val('');
    $('#password-input').val('');

    firebase.auth().signInWithEmailAndPassword(email, pass)
        .then(user => {
            // console.log(user);
            //create user ID, capture it, and make a baseline profile
            uid = user.uid;
            let userFolder = database.ref('/members/' + uid);

            //capture that actual user id, set as var accessible to other functions in the page 
            uid = user.uid;
           

            userProfile.loginStatus = true;
            // add to database
            userFolder.update({loginStatus: userProfile.loginStatus, 
                    lastLogIn: userProfile.lastLogIn}
                );
            
            loginDisplayElements(user.email, '#guest');
        
        }).catch(e => {
            
            let errorCode = e.code;
            let errorMessage = e.message;
            console.log("in here with error");
            let displayMessage = '<p>Login Error: ' + errorMessage + ' Please try again.</p>';
            displayErrorMessage(displayMessage);  //modal not popping *****


        });

}

function loginDisplayElements(email, hideId){
            //tell user that they are logged in w email address
            $('#userName').show();
            $('#userName').html('Logged in as: ' + email);

            //hide login form upon success and display logout button
            $('#navbar-login-form').hide();
            $('#register').hide();
            $(hideId).hide();
}

function displayErrorMessage(message){
    // modal for login messages
    $('.error-modal').addClass('show');
    $('.error-modal').removeClass('hide');
    $('#error-modal-message').html(message);

}

function registerUser() {

    //update dom - hide various items upon register button click
    $('#registration-modal').hide();
    $('#navbar-login-form').hide();

    let email = $('#registration-email-input').val().trim();
    let pass = $('#registration-password-input').val().trim();
    //empty out text that was input
    $('#registration-email-input').val('');
    $('#registration-password-input').val('');

   
    firebase.auth().createUserWithEmailAndPassword(email, pass)
        .then(user => {
            captureUserData(user);
             //tell user that they are logged in w email address
            $('#userName').show();
            $('#userName').html('Logged in as: ' + user.email);

        })
        .then(() => {

            //listener in event of log-out DRY OPPORTUNITY -IN ALL 3 login flows
            let loginStatusFolder = database.ref('/members/' + uid + '/loginStatus');

            loginStatusFolder.on('value', function(snapshot) {
                if (snapshot.val()) {
                    loginStatusFolder.onDisconnect().set(false);
                }
            })

            //on success, render next page
            //TODO
            // renderLogOut();


        })
        .catch(e => {

            let errorCode = e.code;
            let errorMessage = e.message;
            console.log('login error: ' + errorMessage);
            $('.error-modal').addClass('show');
            $('.error-modal').removeClass('hide');
            $('#error-modal-message').html('<p>Login Error: ' + errorMessage + ' Please try again.</p>');

            // reset page
            $('#navbar-login-form').show();
            $('#register').show();

        })
       

}

// function renderLogOut() {

//     $('#navbar-logout-button').show();

// }

function logOut() {

    firebase.auth().signOut()
        .then(() => {
            console.log('Signed Out');
        })
        .catch(error => {
            console.log(error);
            console.error('Sign Out Error: ', errorMessage);
            $('.error-modal').addClass('show');
            $('.error-modal').removeClass('hide');
            $('#error-modal-message').html('<p>Sign Out Error: ' + errorMessage + '</p>');


        });

    //remove logged in user name in header
    $('#userName').html('');

    //add login option up top on navbar
    renderNavBarLogIn();

}

function renderNavBarLogIn() {

    //hide logout button and display login form
    $('#navbar-logout-button').hide();
    $('#navbar-login-form').show();

}




// capture email and password
function upgradeLogin(){
    $('#registration-modal').hide();
    // $('#navbar-login-form').hide();
    let email = $('#registration-email-input').val().trim();
    let password = $('#registration-password-input').val().trim();
    const credential = firebase.auth.EmailAuthProvider.credential(
        email, 
        password
    );

    firebase.auth().currentUser.link(credential).then(function(user) {
        console.log("Anonymous account successfully upgraded", user);
        $('upgrade-from-guest').hide();
    }, function(error) {
        console.log("Error upgrading anonymous account", error);
    });
}

$('#register').on('click', function() {
    regFlag = true;
    //remove this button by hiding
    $(this).hide();

    //show modal to register
    $('#registration-modal').show();

    //prevent page refresh
    return false

});

//button even listners
$('#guest').on('click', function() {
    //login anonymously
    anonymousLogIn();

});

// navbar on click function 
$('#navbar-login-button').on('click', function() {

    //login anonymously
    memberLogIn();
    console.log(firebase.auth().currentUser);


    //call function to render next page
    //TODO

    //prevent page refresh
    return false



});

$('#navbar-logout-button').on('click', function(e) {

    e.preventDefault();

    logOut();

    //prevent page refresh
    return false

});

$('#registration-button').on('click', function() {
    if (regFlag === true){
         registerUser();
    }
    else if (regFlag === false){
        upgradeLogin();
    }
   
 

    //prevent page refresh
    return false

});

$('#close-modal-button').on('click', function() {

    $('#registration-modal').hide();
    $('#register').show();

    //prevent page refresh
    return false

});


// add a real time listener 
// firebaseUser null if not logged in
// this also allows user to be logged in after registering

firebase.auth().onAuthStateChanged(firebaseUser => {
    currentUser = firebaseUser;
    if (firebaseUser){
        $('#navbar-logout-button').show();
        $('#register').hide();
        $('#navbar-login-form').hide();
        $('#guest').hide();
    }
    else {
        $('#navbar-logout-button').hide();
        $('#register').show();
        $('#guest').show();
    }
} )

// close error msg
$('#close-modal').on('click', function(){
    // $('.error-modal').hide();
    console.log("clicking me!");
    $('.error-modal').removeClass('show');
    $('.error-modal').addClass('hide');

    //prevent page refresh
    return false;

})

$('#upgrade-from-guest').on('click', function(){
    //clear out the inputs
    regFlag = false;
    $('#registration-modal').show(); 

    //prevent page refresh
    return false;


})

// Show and hide initial elements
initialState();

}); // end of document on ready
/*
Parking Lot
	Merge anonymous acount data accumulated upon login w/ user's profile	
*/