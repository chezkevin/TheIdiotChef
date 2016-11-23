$(document).ready(function() {

    //PLACHOLDER FOR CSS - WE NEED THE REGISTRATION FORM TO BE HIDDEN ON LOG
    $('#registration-panel').hide();
    $('#navbar-logout-button').hide();
    $('#registration-modal').hide();

    if (!uid) {

        //anonymously login the user upon page loading; don't call if already logged in 
        // anonymousLogIn();
    }

});

// console.log("current USer" + firebase.auth().currentUser);


var config = {
//bran's firebase
    // apiKey: "AIzaSyAVahZhtTXMuf3JFNjcDSSbSFb2EW6MCNI",
    // authDomain: "auth-test-a6dcc.firebaseapp.com",
    // databaseURL: "https://auth-test-a6dcc.firebaseio.com",
    // storageBucket: "auth-test-a6dcc.appspot.com",
    // messagingSenderId: "208122145495"
    apiKey: "AIzaSyCfGxrkb9P3oYRWrQ5XL4wxNmpyv_x9VL0",
    authDomain: "theidiotchef-149717.firebaseapp.com",
    databaseURL: "https://theidiotchef-149717.firebaseio.com",
    storageBucket: "theidiotchef-149717.appspot.com",
    messagingSenderId: "963963795794"
};
firebase.initializeApp(config);

//other variables
let database = firebase.database();
let guestFolder = database.ref('/guestUsers/');
let memberFolder = database.ref('/members/');
let onlineUsers = database.ref('/onlineUsers/'); //possible enhancement
let uid = ''; //user id for tracking purposes


//button even listners
// $('#btn-guest').on('click', function() {

//     //login anonymously
//     anonymousLogIn();
//     console.log("current USer" + firebase.auth().currentUser);

//     //TODO - IF LOGIN ERROR, SHOULD WE NOT MOVE TO NEXT PAGE?

//     //call function to render next page 
//     //TODO

// });

$('#register').on('click', function() {

    //remove this button by hiding
    $(this).hide();

    //show modal to register
    $('#registration-modal').show();

    //prevent page refresh
    return false

});


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

    registerUser();
  console.log(firebase.auth().currentUser);

    //prevent page refresh
    return false

});

$('#close-modal-button').on('click', function() {

    $('#registration-modal').hide();
    $('#register').show();

    //prevent page refresh
    return false

});

//anonymously login the user
function anonymousLogIn() {

    //prevent duplicate login
    if (uid) return;

    //login 
    firebase.auth().signInAnonymously()
        .then(user => {

            //create user ID, capture it, and make a baseline profile
            let userFolderName = guestFolder.push().key;
            let userFolder = database.ref('/guestUsers/' + userFolderName);

            //capture that actual user id, set as var accessible to other functions in the page 
            uid = user.uid;

            //let program know if user is anonymously logged in
            logInType = 'anonymous';

            //set profile
            userFolder.set({

                userID: uid,
                email: '',
                loginStatus: true,
                previousSearch: {},
                lastLogIn: firebase.database.ServerValue.TIMESTAMP

            })

            //clear the user folder upon disconnect DRY OPPORTUNITY -IN ALL 3 login flows
            userFolder.on('value', function(snapshot) {
                if (snapshot.val()) {
                    userFolder.onDisconnect().remove();
                    console.log('success');
                }
            })

            //intentionally don't display logout as they are anonymously logged in

            //handle login error
        }).catch(e => {
            console.log(e);
            let errorCode = e.code;
            let errorMessage = e.message;
            console.log('anonymous login error: ' + errorMessage);

        });
}

//login in the existing user
function memberLogIn() {

    //if already logged in anoynmously, do something
    //TODO?

    let email = $('#email-input').val().trim();
    let pass = $('#password-input').val().trim();

    //clear out the inputs
    $('#email-input').val('');
    $('#password-input').val('');

    firebase.auth().signInWithEmailAndPassword(email, pass)
        .then(user => {
            console.log(user);
            //create user ID, capture it, and make a baseline profile
            uid = user.uid;
            let userFolder = database.ref('/members/' + uid);

            //capture that actual user id, set as var accessible to other functions in the page 
            uid = user.uid;
            logInType = 'member';

            //update last login time
            userFolder.update({

                loginStatus: true,
                lastLogIn: firebase.database.ServerValue.TIMESTAMP

            })

            //tell user that they are logged in w email address
            $('#userName').show();
            $('#userName').html('Logged in as: ' + user.email);


            //hide login form upon success and display logout button
            $('#navbar-login-form').hide();
             $('#register').hide();
            // renderLogOut();

        })
        .then(() => {

            //disconnect evente listener DRY OPPORTUNITY -IN ALL 3 login flows
            let loginStatusFolder = database.ref('/members/' + uid + '/loginStatus');

            loginStatusFolder.on('value', function(snapshot) {
                if (snapshot.val()) {
                    loginStatusFolder.onDisconnect().set(false);
                }
            })


        }).catch(e => {

            let errorCode = e.code;
            let errorMessage = e.message;
              console.log(e);
            // modal for login messages
            $('.error-modal').addClass('show');
            $('.error-modal').removeClass('hide');
            $('#error-modal-message').html('<p>Login Error: ' + errorMessage + ' Please try again.</p>');

            console.log('Login Error: ' + errorMessage);

        });

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
            //note - upon success, user is logged in automatically per firebase

            //create user ID, capture it, and make a baseline profile
            uid = user.uid;
            let userFolder = database.ref('/members/' + uid);

            //capture that actual user id, set as var accessible to other functions in the page 
            uid = user.uid;
            logInType = 'member';

            //set default profile
            userFolder.set({

                userID: uid,
                email: email,
                loginStatus: true,
                previousSearch: {},
                lastLogIn: firebase.database.ServerValue.TIMESTAMP,
                ingredients: "blah"

            })
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

function renderLogOut() {

    $('#navbar-logout-button').show();

}

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

var currentUser;
// add a real time listener // firebaseUser null if not logged in
// this allows user to be logged in after registering
firebase.auth().onAuthStateChanged(firebaseUser => {
    console.log(firebaseUser);
    currentUser = firebaseUser;
    if (firebaseUser){
        console.log("user: "+ firebaseUser.email);
        // btnLogout.show();
        $('#navbar-logout-button').show();
        $('#register').hide();
        $('#navbar-login-form').hide();
    }
    else {
        console.log ('not logged in');
        // btnLogout.hide();
        $('#navbar-logout-button').hide();
        $('#register').show();
    }
} )

// close error msg
$('#close-modal').on('click', function(){
    // $('.error-modal').hide();
    console.log("clicking me!");
    $('.error-modal').removeClass('show');
    $('.error-modal').addClass('hide');
})
/*
Parking Lot
	Merge anonymous acount data accumulated upon login w/ user's profile
	
*/