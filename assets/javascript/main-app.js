// global configuration details are outside the document.ready function for now
// notes on disconnect not working for set Login Status = false need to take another look at

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
        $('#upgrade-from-guest').removeClass('show');
        $('#upgrade-from-guest').addClass('hide');
        $('#password-reset').removeClass('show');
        $('#password-reset').addClass('hide');
        $('#email-reset').removeClass('show');
        $('#email-reset').addClass('hide');
        $('.email-update').removeClass('show');
        $('.email-update').addClass('hide');


    }


    function captureUserData(user){
        //create user ID, capture it, and make a baseline profile    
        uid = user.uid;
        //capture that actual user id, set as var accessible to other functions in the page 
        userProfile.userID = uid;
        userProfile.loginStatus = true;
        userProfile.email = user.email;
      
        if (userProfile.email === null){
            userProfile.email = "guest";
        }

        let userFolder = database.ref('/members/' + uid);
        // add to database
        userFolder.set(userProfile);
        // next says what to do when user closes window / disconnects
        // Logout handled later on
        if (userProfile.email === 'guest'){
            // let userFolder = database.ref('/members/' + uid);
            userFolder.onDisconnect().remove();
        } 
       
            
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
                displayErrorMessage(displayMessage);  

            });

    }

    function loginDisplayElements(email, hideId){
        //tell user that they are logged in w email address
        $('#userName').show();
        $('#userName').html('Logged in as: ' + email);
        $('#upgrade-from-guest').removeClass('show');           
        $('#upgrade-from-guest').addClass('hide');  // does not seem to hide!
        $('#password-reset').addClass('show');
        $('#email-reset').addClass('show');

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
                // $('.error-modal').addClass('show');
                // $('.error-modal').removeClass('hide');
                // $('#error-modal-message').html('<p>Login Error: ' + errorMessage + ' Please try again.</p>');
                let displayMessage = '<p>Login Error: ' + errorMessage + ' Please try again.</p>';
                displayErrorMessage(displayMessage);  
                // reset page
                $('#navbar-login-form').show();
                $('#register').show();
                // initialState();

            })
           

    }

    function logOut() {

        firebase.auth().signOut()
            .then(() => {
                console.log('Signed Out');
                initialState();

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
       
        // $('#navbar-login-form').hide();
        let email = $('#registration-email-input').val().trim();
        let password = $('#registration-password-input').val().trim();
        const credential = firebase.auth.EmailAuthProvider.credential(
            email, 
            password
        );

        firebase.auth().currentUser.link(credential).then(function(user) {

            let userFolder = database.ref('/members/' + uid);
            userFolder.update({email: user.email, 
                        lastLogIn: userProfile.lastLogIn}
                    );
            
            loginDisplayElements(user.email, '#upgrade-from-guest');
            $('#registration-modal').hide();
            $('#upgrade-from-guest').addClass('hide');

        }, function(error) {
            // console.log("Error upgrading anonymous account", error);
            let displayMessage = '<p>Error creating user account. Please try again later.</p>';
            displayErrorMessage(displayMessage); //modal not popping *****


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

    //button event listners
    $('#guest').on('click', function() {
        //login anonymously
        anonymousLogIn();

        //prevent page refresh
        return false

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
        resetHomepage(); //make homepage visible

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



    firebase.auth().onAuthStateChanged(firebaseUser => {
        currentUser = firebaseUser;
        if (firebaseUser){
            $('#navbar-logout-button').show();
            $('#register').hide();
            $('#navbar-login-form').hide();
            $('#guest').hide();
            //listener in event of log-out DRY OPPORTUNITY -IN ALL 3 login flows
            
                //     }
                    // })
            // add a real time listener 
            // firebaseUser null if not logged in
            // this also allows user to be logged in after registering

            }
            else {
                $('#navbar-logout-button').hide();
                $('#register').show();
                $('#guest').show();
            }
    })

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


    $('#password-reset').on('click', function(){
        resetPassword();
        return false;
    })
    $('#email-reset').on('click', function(){
        $('.email-update').removeClass('hide');
        $('.email-update').addClass('show');
        // resetEmail();
        return false;
    })


    $('#send-email-reset').on('click', function(){
        // $('show-email-input').show();
        resetEmail();
        $('.email-update').removeClass('show');
        $('#email-update').addClass('hide');
        return false;
    })

    // reset password
    function resetPassword(){
        let auth = firebase.auth();
        let user = firebase.auth().currentUser;
        let emailAddress = user.email;
        console.log(emailAddress);

        auth.sendPasswordResetEmail(emailAddress).then(function() {
          // Email sent.
          // console.log("email");

        }, function(error) {
          // An error happened.
          console.log(error);
        });
    }

    function resetEmail(){
        var user = firebase.auth().currentUser;
        var email =  $('#update-email-input').val();
        $('#update-email-input').val('');
        // get updated email from an input box
        user.updateEmail(email).then(function() {
          // Update successful.
        }, function(error) {
          // An error happened.
        });
    }

    function resetHomepage(){
        $('.homepage').removeClass('hide');
        // put these here just in case
        $('.recipe-shortlist-page').addClass('hide');
        $('.detailed-view-page').addClass('hide');
    }
    /*
    Parking Lot
    	Merge anonymous acount data accumulated upon login w/ user's profile	
    */
    //  click events for whole site
    $('#show-homepage').on('click', function(){
        resetHompage();
    })

    // $('.recipe-shortlist').on('click', function(){
    //     $('.detailed-view-page').removeClass('hide');
    //     $('.recipe-shortlist-page').addClass('hide');
    //     //  // call the youtube function
    //     // youtube();
    //     // recipe functions?

    // })

    $('#back-recipe-shortlist').on('click', function(){
        $('.recipe-shortlist-page').removeClass('hide');
        $('.detailed-view-page').addClass('hide');
    })

    
    //various database references for food updates
    let ref = database.ref();
    let ingredientZone = ref.child("ingredientZone");
    let userZone = ref.child('members');
    let usedIngredientsArray = [];
    // var userIng = firebase.auth().currentUser.uid;
    var userPlace = "";

    // userZone.on('child_added', function(childSnapshot) {
        
    //     console.log(userIng);
    //     userPlace = childSnapshot.val().userID;
    // })

    ingredientZone.on('child_added', function(childSnapshot) {
     
        if (usedIngredientsArray.indexOf(childSnapshot.val().name) > -1) {
            return;
        } else {

            let newChild = updateIngredientList(childSnapshot);

            addCheckBoxListener(newChild);
        }

    })

    function updateIngredientList(childSnapshot) {

        let target = $("#ingredients-list");
        let id = childSnapshot.val().name;
        let checked = childSnapshot.val().checked;
        let checkStatus = (checked == true ? 'checkbox' : 'nocheckbox');
        let icon = (checked == true ? 'fa-check-circle-o' : 'fa-circle-o');

        //render new DOM element and add to DOM target node
        let newItem = $('<div>').attr('id', id).addClass('ingredient');
        newItem.html("<button id='" + id + "'><i class='fa " + icon + " ' aria-hidden='true'></i></button><span id='name'> " + id + " </span><button class='deletebox' id='" + id + "'><i class='fa fa-trash' aria-hidden='true'></i></button></div>");
        target.append(newItem);
        target.find('button#' + id).addClass(checkStatus);

        //update ingredient array variable accordingly
        usedIngredientsArray.push(childSnapshot.val().name);

        return id


    }

    function addCheckBoxListener(id) {
        
        let clickTarget = $('#' + id + ' > .fa');    

        clickTarget.on('click', function() {

            let checkIcon = $(this).hasClass('fa-check-circle-o');

            if (checkIcon) {
                $(this).removeClass('fa-check-circle-o');
                $(this).addClass('fa-circle-o');
            } else {
                $(this).addClass('fa-check-circle-o');
                $(this).removeClass('fa-circle-o');
            }

            let checkLocation = ingredientZone.child(id);

            var checkStatus = checkLocation.child('checked');

            checkLocation.update({ checked: !checkIcon });

        });
    }


    $('#addIngredientButton').on('click', function() {

        usedIngredientsArray = [];

        var newIngredientName = $('#ingredients-search').val().trim();

        var newIngredient = {
            name: newIngredientName,
            checked: 'true'
        }

        var currentUID = firebase.auth().currentUser.uid;
        memberFolder.child(currentUID).child('ingredients').child(newIngredientName).set(newIngredient);

        $("#ingredients-search").val("");

        return false;

    })

    $(document.body).on('click', '.deletebox', function() {

        var ingredientToDelete = $(this).attr("id");

        $("#" + ingredientToDelete).remove();

        var deleteLocation = ingredientZone.child(ingredientToDelete);

        deleteLocation.remove();
    });

    $('#submitIngredientsButton').on('click', function() {
        $('.recipe-list').empty();
        $('.homepage').addClass('hide'); // added by Fiona
        $('.recipe-shortlist-page').removeClass('hide'); // added by Fiona
        // $('.recipe-shortlist').removeClass('hide'); // added by Fiona
      
        var ingredientsURL = usedIngredientsArray.join("&2C");

        console.log(ingredientsURL);

        var apiKey = "ifDlpOiJZwmshbi3KF67KyFbySC4p1OjmEEjsnd0c6P7clfaPK";
        var foodQueryURL = "https://spoonacular-recipe-food-nutrition-v1.p.mashape.com/recipes/findByIngredients?fillIngredients=true&ingredients=" + ingredientsURL + "&limitLicense=true&number=5&ranking=1";

        $.ajax({
            url: foodQueryURL,
            type: 'GET',
            data: {},
            dataType: 'json',
            success: function(data) {

                for (var i = 0; i < data.length; i++) {
                    var recipeDiv = $('<div class="recipe">');

                    var recipeName = data[i].title;

                    var recipeTitle = $('<a class="recipe-title">').text(recipeName);

                    var recipeUsedIngredients = data[i].usedIngredientCount;

                    var recipeUsedIngredientsList = $('<p>').text("Number of used ingredients: " + recipeUsedIngredients);

                    var recipeMissingIngredients = data[i].missedIngredientCount;

                    var recipeMissingIngredientsList = $('<p>').text("Number of missing ingredients: " + recipeMissingIngredients);

                    var recipeImage = $("<img class='recipeImage'>");
                    recipeImage.attr('src', data[i].image);

                    recipeDiv.append(recipeImage);
                    recipeDiv.append(recipeTitle);
                    recipeDiv.append(recipeUsedIngredientsList);
                    recipeDiv.append(recipeMissingIngredientsList);
                    console.log(recipeDiv);
                    $('.recipe-list').append(recipeDiv);
                }
            },
            error: function(err) { alert(err); },
            beforeSend: function(xhr) {
                xhr.setRequestHeader("X-Mashape-Authorization", apiKey);
            }

        });
    });


    $(document).on("click", ".recipe-shortlist", function() {
        $('.detailed-view-page').removeClass('hide');
        $('.recipe-shortlist-page').addClass('hide');
        // var youTubeQ = $(this).text();  commmented out for testing
        // youTubeQ = youTubeQ.trim().replace(/\s/g, '+');

        var youTubeQ = "chicken";
        var APIKey = "AIzaSyAldakVxQrbZabH9SdIO3iocly3sOA727U"
        var queryURL = 'https://www.googleapis.com/youtube/v3/search?q='+ youTubeQ +'&key='+ APIKey + '&maxfields=25&fields=items(id(kind,videoId),snippet)&part=snippet&order=rating&relevanceLanguage=en&type=video&videoDefinition=standard&videoEmbeddable=true&safeSearch=strict&regionCode=us&topicId=/m/02wbm';

        displayVideos(queryURL, '100%', '100%', 'https://www.youtube.com/embed/');
    });
    

    function displayVideos(queryURL, videoWidth, videoHeight, videoSrc) {
        $('.video-list').empty();
        $.ajax({
                url: queryURL,
                method: 'GET'
            })
            .done(function(response) {
                console.log(response.items.length);
               for (var i = 0; i < response.items.length; i++ ){
                    var b = $('<iframe>', {
                        width : videoWidth,
                        height : videoHeight,
                        src : videoSrc + response.items[i].id.videoId,
                    });
                    // var b = $('<iframe>'+ videoSrc + response.items[i].id.videoId + '</iframe>');
                    // console.log("b" + b);
                    $('.video-list').append(b);
                    // var c = $('<div>'+ response.items[i].snippet.title +'</div>');
                    // var d = $('<div>'+ response.items[i].snippet.description +'</div>');
                    // console.log(response.items[i].snippet.title);
                    // $('#video-list').append(c);
                    // $('#video-list').append(d);

                    // firebase.initializeApp(config);

                    var newVideo = {
                        id: response.items[i].id.videoId,
                        title: response.items[i].snippet.title,
                        description: response.items[i].snippet.description
                    }
                    var currentUID = firebase.auth().currentUser.uid;
                    memberFolder.child(currentUID).child('videos').push(newVideo);

                }

                // console.log(response);

            });
    }

// Google s part

// in separate file for now!


}) // end of document on ready