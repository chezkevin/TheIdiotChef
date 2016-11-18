$(document).ready(function() {

    //PLACHOLDER FOR CSS - WE NEED THE REGISTRATION FORM TO BE HIDDEN ON LOG
    $('#registration-panel').hide();

});


var config = {
    apiKey: "AIzaSyAVahZhtTXMuf3JFNjcDSSbSFb2EW6MCNI",
    authDomain: "auth-test-a6dcc.firebaseapp.com",
    databaseURL: "https://auth-test-a6dcc.firebaseio.com",
    storageBucket: "auth-test-a6dcc.appspot.com",
    messagingSenderId: "208122145495"
};
firebase.initializeApp(config);

//other variables
let database = firebase.database();
let guestFolder = database.ref('/guestUsers/');
let memberFolder = database.ref('/members/');
let onlineUsers = database.ref('/onlineUsers/'); //possible enhancement
let logInType = '';
let uid = ''; //user id for tracking purposes


//button even listners
$('#btn-guest').on('click', function() {

    //login anonymously
    anonymousLogIn();

    //TODO - IF LOGIN ERROR, SHOULD WE NOT MOVE TO NEXT PAGE?

    //call function to render next page 
    //TODO

});

//button even listners
$('#btn-member').on('click', function() {

    //login anonymously
    memberLogIn();

    //call function to render next page
    //TODO

    //prevent page refresh
    return false

});

$('#btn-register').on('click', function() {

    //remove this button by hiding
    $(this).hide();

    //hide member login panel
    $('#member-login-panel').hide();

    //render the registration form
    $('#registration-panel').show();

    //prevent page refresh
    return false

});

$('#btn-submit-registration').on('click', function() {

    registerUser();

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

            //handle login error
        }).catch(e => {

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
            console.log('meber login error: ' + errorMessage);

        });
}

function registerUser() {


    let email = $('#registration-email-input').val().trim();
    let pass = $('#registration-password-input').val().trim();

    console.log('email ' + email + ' pword ' + pass);


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
                lastLogIn: firebase.database.ServerValue.TIMESTAMP

            })

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


        })
        .catch(e => {

            let errorCode = e.code;
            let errorMessage = e.message;
            console.log('login error: ' + errorMessage);

        })


}

// add a real time listener // firebaseUser null if not logged in
/*
firebase.auth().onAuthStateChanged(firebaseUser => {
	console.log(firebaseUser);
	currentUser = firebaseUser;
	if (firebaseUser){
		console.log("user: "+ firebaseUser);
		btnLogout.show();
	}
	else {
		console.log ('not logged in');
		btnLogout.hide();
	}
} )
*/


/*PARKING LOT

	On firebase discconnect, is the user logged out?
	Auth status event listener - TBD what it would do...
	Display a logout button upon login as MEMBER or REGISTERED - as registration = auto login

*/
