var config = {        
    apiKey: "AIzaSyB86ufSLxlXh_Oj7Se_rmg5FmddSA9qYEU",
    authDomain: "test-a0542.firebaseapp.com",
    databaseURL: "https://test-a0542.firebaseio.com",
    storageBucket: "test-a0542.appspot.com",
    messagingSenderId: "655697953340"
    };
     
firebase.initializeApp(config);

var database = firebase.database();
// decided to use one main db folder for all members
//needed for maps to access so global
var memberFolder = database.ref('/members/');
var player;
var recipeDetailArr = [];
var map;
var latitude = 41.881832;
var longitude =  -87.623177; 
var currentUser;

$(document).ready(function() { 
    
    // var loggedUser = null;
    var uid = ''; //user id for tracking purposes
    var regFlag = true;
    var userProfile = {
        userID: uid,
        email: '',
        previousSearch: {},
        lastLogIn: firebase.database.ServerValue.TIMESTAMP
    };
    var mapWindow = window;

    function openMapWin() {
        mapWindow = window.open("GoogleMapsLib.html");   // Opens a new window
        
    }



    function resetOnRefresh() {
        // if there is a user logged in - log them out - they need to reauthenticate
        if (userProfile.uid !== '')
        {
            logOut();

        } else{
            initialState();
        }
      

    }

    function initialState(){
        //hide the below DOM items
        $('.homepage').addClass('hide');
        $('.email-update').addClass('hide');
        $('#show-homepage').addClass('hide');
        $('#navbar-logout-button').addClass('hide');
        $('#upgrade-from-guest').addClass('hide');
        $('#password-reset').addClass('hide');
        $('#email-reset').addClass('hide');
        $('.map-page').addClass('hide');
        $('.recipe-shortlist-page').addClass('hide');
        $('.detailed-view-page').addClass('hide');
        // hidden by setting the display to none
        $('#registration-modal').hide();
        $('.expand-video-page').addClass('hide');
        // Elements to Hide
        // hidden by removing a class hide
        $('.landing-page').removeClass('hide');
        // displayed by setting display to block
        $('#guest').show();
        $('#register').show();
        $('#topZone').show();
   //// added for Brandon
        usedIngredientsArray = [];
        $('#ingredients-list').empty();
    }


    // Function to capture user data on login as member or guest
    function captureUserData(user, status){
        uid = user.uid;
        //set as var accessible to other functions in the page 
        userProfile.userID = uid;
        userProfile.email = user.email;
        // if logging in as a guest (anonymous)
        if (userProfile.email === null){
            userProfile.email = "guest";
        }
        
        // add to database
        let userFolder = database.ref('/members/' + uid);
        // check what is happening and handle accordingly - new user, existing or upgrade
        if ( status === 'new'){
            userFolder.set(userProfile);
        } 
        else if (status === 'existing'){
            // userProfile.loginStatus = true;
            // add to database
            userFolder.update({lastLogIn: userProfile.lastLogIn}
            );
        } else if (status === 'upgrade'){
            userFolder.update({email: user.email}
            );
        }
            
        // when user closes window / disconnects remove the guest user
        // Logout handled later on
        if (userProfile.email === 'guest'){
            userFolder.onDisconnect().remove();
        } 
            
    }
    //anonymously login the user - for Guest User option
    function anonymousLogIn() {
        firebase.auth().signInAnonymously()
            .then(user => {
                // capture the user data as guest
                let status = "new";
                captureUserData(user, status);
                // if successful login then display relevant guest items
                displayGuestItems();
                // display homepage with message that a guest is logged in
                showHomepage("guest");
                // displays the initial ingredients stored in the database (if any) 
                initialIngredientsList();  

                
            }).catch(e => {
                
                displayErrorMessage(e.message); 

            });
    }

    // capture email and password
    function upgradeLogin(){
       
        let email = $('#registration-email-input').val().trim();
        let password = $('#registration-password-input').val().trim();
        const credential = firebase.auth.EmailAuthProvider.credential(
            email, 
            password
        );

        firebase.auth().currentUser.link(credential).then(function(user) {

            var status = 'upgrade';
            captureUserData(user, status);
            // set DOM items to display on login
            loginDisplayElements(user.email);
            // hide modal on successful registration
            hideRegistrationModal();

        }, function(error) {
            // function to handle error message display
            registrationErrorMsg(error);
        });
    }

    //login in an existing user
    function memberLogIn() {
        // capture email and password input from Dom
        let email = $('#email-input').val().trim();
        let pass = $('#password-input').val().trim();

        //clear out the inputs for next user
        $('#email-input').val('');
        $('#password-input').val('');


        firebase.auth().signInWithEmailAndPassword(email, pass)
            .then(user => {

                let status = "existing";
                captureUserData(user, status);
                 // set DOM items to display on login 
                loginDisplayElements(user.email);
            
            }).catch(e => {
               // displays error messages
                displayErrorMessage(e.message);  

            });

    }

    function registerUser() {

        //update dom - hide various items upon register button click
        showRegistrationItems();

        let email = $('#registration-email-input').val().trim();
        let pass = $('#registration-password-input').val().trim();
        //empty out text that was input
        $('#registration-email-input').val('');
        $('#registration-password-input').val('');
 
        firebase.auth().createUserWithEmailAndPassword(email, pass)
            .then(user => {
               
                let status = "new";
                captureUserData(user, status);
                 // set login items and 
                 // tell user that they are logged in w email address
                loginDisplayElements(user.email);
                //hide modal on sucessful registration
                hideRegistrationModal();
            })
            .catch(e => {

                registrationErrorMsg(e);


            })
    }

    function logOut() {

        firebase.auth().signOut()
            .then(() => {
    
                initialState();

            })
            .catch(e => {
                
                displayErrorMessage(e.message);

            });

        //remove logged in user name in header
        $('#userName').html('');

        //add login option up top on navbar
        renderNavBarLogIn();

    }

    

    // reset password
    function resetPassword(){
        let auth = firebase.auth();
        let user = firebase.auth().currentUser;
        let emailAddress = user.email;
        

        auth.sendPasswordResetEmail(emailAddress).then(function() {
          // Email sent.
        }, function(e) {
          // An error happened.
            displayErrorMessage(e.message);
        });
    }
    // change email
    function resetEmail(){
        var user = firebase.auth().currentUser;
        var email =  $('#update-email-input').val();
        $('#update-email-input').val('');
        // get updated email from an input box
        user.updateEmail(email).then(function() {
          // Update successful.
        }, function(e) {
          // An error happened.
          displayErrorMessage(e.message);
        });
    }

    // resets homepage layout when navigating from other pages
    function resetHomepage(){ 
        // show
        $('.homepage').removeClass('hide');
        $('#topZone').show();
        // hide
        $('.landing-page').addClass('hide');
        $('.map-page').addClass('hide');
        $('.expand-video-page').addClass('hide');
        $('.recipe-shortlist-page').addClass('hide');
        $('.detailed-view-page').addClass('hide');
        // $('.map-page').addClass('hide');
        if (userProfile.email !== 'guest'){
            $('#email-reset').removeClass('hide');
            $('#password-reset').removeClass('hide');
        }
    }

    // sets page layout after login 
    function loginDisplayElements(email){
        // call once user logged in to display items on homepage
        // displays ingredients stored in database for that user
        initialIngredientsList();  // from recipe page
        //tell user that they are logged in with email address
        showHomepage(email);     
        // items to hide    
        $('#upgrade-from-guest').addClass('hide');  
        $('.landing-page').addClass('hide');
        //hide login form upon success and display logout button
        $('#navbar-login-form').hide();
        $('#register').hide();
        $('#email-reset').removeClass('hide');
        $('#password-reset').removeClass('hide');
        $('.recipe-shortlist-page').addClass('hide');
    }
    // displays default homepage and DOM items
    function showHomepage(email){
       
        // show the following
        $('#show-homepage').removeClass('hide');
        $('.homepage').removeClass('hide');
        $('#topZone').show();
        $('#userName').show();
        $('.map-page').addClass('hide');
        // message to display
        $('#userName').html('Logged in as: ' + email); 

    }
    // displays additional items for an anon guest user
    function displayGuestItems(){
        // display guest upgrade button
        // $('.homepage').removeClass('hide');
        $('#upgrade-from-guest').removeClass('hide');
        // make sure the following buttons are hidden
        $('#reset-email').addClass('hide');
        $('#reset-password').addClass('hide');
        $('.landing-page').addClass('hide');
    }
    // displays additional items for a member  user
    function displayMemberItems(){
        $('#password-reset').addClass('hide');
        $('#email-reset').addClass('hide');
    }
    // resets homepage layout when navigating from other pages
    function resetHomepage(){ 
        //show
        $('.homepage').removeClass('hide');
        $('#show-homepage').removeClass('hide'); 
        $('#topZone').show();
        //hide
        $('.landing-page').addClass('hide');
        $('.recipe-shortlist-page').addClass('hide');
        $('.detailed-view-page').addClass('hide');
        $('.map-page').addClass('hide');
        // message
        if (userProfile.email !== 'guest'){
            $('#email-reset').removeClass('hide');
            $('#password-reset').removeClass('hide');
        }

    }
    // modal for login error messages
    function displayErrorMessage(message){  
        // captures errors on login 
        let displayMessage = '<p>Error: ' + message + ' Please try again.</p>';
        // display on DOM 
        $('.error-modal').show();
        $('#error-modal-message').html(displayMessage);
    }
    //hide modal on success
    function hideRegistrationModal(){ 
        $('#registration-modal').hide();
        $('#register').hide();
    }
    // displays registration dom items
    function showRegistrationItems(){
        $('#registration-modal').show();
        $('#navbar-login-form').hide();
    }
    // displays login dom items
    function renderNavBarLogIn() {
        //hide logout button and display login form
        $('#navbar-logout-button').addClass('hide');
        $('#navbar-login-form').show();
    }
    //error handling for registration and upgrade user
    function registrationErrorMsg(error){
        let displayMessage = '<p>Error creating user account. Please try again later.</p>';
        $('#reg-error-msg').html(displayMessage); 
        // reset page
        $('#navbar-login-form').show();
        $('#register').show();
    }
    
    // event listener for authentication state change e.g. logout 
    // this also allows user to be logged in after registering
    firebase.auth().onAuthStateChanged(firebaseUser => {
        currentUser = firebaseUser;
        // loggedUser = firebase.auth().currentUser.uid;
      
        if (firebaseUser){
            $('#navbar-logout-button').removeClass('hide');
            $('#register').hide();
            $('#navbar-login-form').hide();
            $('#guest').hide();
        }
        else {
            $('#navbar-logout-button').addClass('hide');
            $('#register').show();
            $('#guest').show();
        }
    })

    // Button Actions Section
    // expand video
    $(document).on('click', '.expand-video', function(){
        // hide the detailed-recipe-page
        $('.detailed-view-page').addClass('hide');
        // show new page
        $('.expand-video-page').removeClass('hide');
        // add a close video button
        var b = $('<button>', {
            id: "close-expanded-video",
            class: "btn btn-success"
        })
        b.html("Back to Recipe and Videos")
        var c = $('<div class="row btn-append">');
        $('.expand-video-page').prepend(c);
        c.append(b);
        // maximize the video
        var videoId =$(this).data('video');
        $('#expand-video-panel').append($('#' + videoId));
        // empty oringinal video list - this stops any videos taht were playing
        $('.video-list').empty();
    })

    $(document).on('click', '#close-expanded-video', function(){
        // hide the detailed-recipe-page
        $('.detailed-view-page').removeClass('hide');
        // show new page
        $('.expand-video-page').addClass('hide');
        $('#expand-video-panel').empty();
        $('#close-expanded-video').remove();
        $('#btn-append').remove();
        // repopulate oringinal video list from the database
        // $('.video-list').html("You searched for: " + recipe + ". Click on any of the youTube videos below for recipes!");

        var currentUID = firebase.auth().currentUser.uid;
        memberFolder.child(currentUID).child('videos').on("value", function(snapshot) {
            // pass object to function to paint videos on DOM
            var objLength = Object.keys(snapshot.val()).length;
            // repopulate oringinal video list from the database
            $('.video-list').html("Click on any of the youTube videos below for recipes!");

            for (var i = 0; i < objLength; i++){
                // Now simply find the videoid and pass to display function.
                putVideosOnDom(snapshot.val(), '100%', '100%', 'https://www.youtube.com/embed/', snapshot.val()[i].id, i);
            }
           
        })
    })

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
        //login as member
        memberLogIn();
        //prevent page refresh
        return false
    });

    $('#navbar-logout-button').on('click', function(e) {
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
        $('#reg-error-msg').html('');

        //prevent page refresh
        return false

    });

   // close error msg
    $('#close-modal').on('click', function(){
        // hide message
        $('.error-modal').hide();

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

    $('#password-reset').on('click', function(){
        resetPassword();
        return false;
    })

    $('#email-reset').on('click', function(){
        $('.email-update').removeClass('hide');
        return false;
    })
    $('#cancel-email-reset').on('click', function(){
        $('.email-update').addClass('hide');
        return false;
    })


    $('#send-email-reset').on('click', function(){
        resetEmail();
        $('#email-update').addClass('hide');
        return false;
    })



    $('#show-homepage').on('click', function(){
        resetHomepage();
        return false;
    })

    $('#back-to-search').on('click', function(){
        resetHomepage();
        return false;
    })
    
    $('#open-map').on('click', function(){
        $('.map-page').removeClass('hide');
        //hide homepage and topZone
         $('.homepage').addClass('hide');
        $('#topZone').hide();
        return false;
    })

    $('#close-map').on('click', function(){
        $('.map-page').addClass('hide');
        //hide homepage and topZone
        $('.homepage').removeClass('hide');
        $('#topZone').show();
        return false;
    })



    //// This is where Recipe API is called and handled
    
    //various database references for food updates
    let ref = database.ref();
    // let ingredientZone = ref.child("ingredientZone");
    let userZone = ref.child('members');
    let usedIngredientsArray = [];
    var userPlace = "";
    let added = false;
    var userPlace = "";

    function initialIngredientsList() {
        memberFolder.child(uid).child('ingredients').on('child_added', function(childSnapshot) {
            //if there is a prior search result, populate the DOM with it and add event listeners
            let data = childSnapshot.val();
          
            //don't do anything if this item is already in the ingredients array
            if (Array.prototype.indexOf.call(usedIngredientsArray, data.name) === -1 && data) {
                //add this item to the ingredients array
                usedIngredientsArray.push(data.name);
                //add item to dom ingrediens list
                let newChild = updateIngredientList(data.name, data.checked);
                addCheckBoxListener(newChild);
                //tell user that this is their prior search upon default load of data only
                if (added === false && data){
                    $('#your-ingredients').text('Your last search');
                }
            } else {
                    return;
            }
        });
    }

    function updateIngredientList(name, check) {
        let target = $("#ingredients-list");
        let id = name;
        let checkStatus = ((check === 'true') || (check == true) ? "checkbox" : "nocheckbox");
        let icon = ((check === 'true') || (check == true) ? "fa-check-circle-o" : "fa-circle-o");
        //render new DOM element and add to DOM target node
        let newItem = $('<div>').attr('id', id).addClass('ingredient');
        newItem.html("<button id='" + id + "'><i class='fa " + icon + " ' aria-hidden='true'></i></button><span id='name'> " + id + " </span><button class='deletebox' id='" + id + "'><i class='fa fa-trash' aria-hidden='true'></i></button></div>");
        target.append(newItem);
        target.find('button#' + id).addClass(checkStatus);
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
            let checkLocation = memberFolder.child(uid).child('ingredients').child(id);
            var checkStatus = checkLocation.child('checked');
            checkLocation.update({ checked: !checkIcon });
        });
    }

    $('#addIngredientButton').on('click', function() {
        //update text and/or ensure that list no longer says 'prior search' as now its an updated list
        $('#your-ingredients').text('Your Ingredients');
        //trigger added - to prevent display of 'your previous search' in the ingredients zone header
        added = true;
        //capture the new ingredient 
        var newIngredientName = $('#ingredients-search').val().trim();
        //prevent dulicate additions and then update the DB and DOM with the newly added ingredient
        if (Array.prototype.indexOf.call(usedIngredientsArray, newIngredientName) === -1) {
            //newitem will get pushed to the used ingredients array via the 'on child added' feature
            var newIngredient = {
                    name: newIngredientName,
                    checked: 'true'
                }
            memberFolder.child(uid).child('ingredients').child(newIngredientName).set(newIngredient);
        }
        //empty out search bar text
        $("#ingredients-search").val("");
        return false;
    });

    $('#clearIngredientsButton').on('click', function(){
        //delete all child elements from the database
        memberFolder.child(uid).child('ingredients').remove();
        //empty the used ingredients array
        usedIngredientsArray = [];
        $('#ingredients-list').empty();
        //update text and/or ensure that list no longer says 'prior search' as now its an updated list
        $('#your-ingredients').text('Your Ingredients');
    });

    $(document.body).on('click', '.deletebox', function() {
        var ingredientToDelete = $(this).attr("id");
        $("#" + ingredientToDelete).remove();
        //update text and/or ensure that list no longer says 'prior search' as now its an updated list
        $('#your-ingredients').text('Your Ingredients');
        //capture index number of item to remove from used ingredients array - there can only be one due to limitations imposed on adding to array
        let index = Array.prototype.indexOf.call(usedIngredientsArray, ingredientToDelete);
        usedIngredientsArray.splice(index, 1);
        var deleteLocation = memberFolder.child(uid).child('ingredients').child(ingredientToDelete);
        deleteLocation.remove();
    });

    $('#submitIngredientsButton').on('click', function() {

        $('.recipe-list').empty();
        $('.homepage').addClass('hide'); 
        $('.map-page').addClass('hide'); 
        $('#topZone').hide();
        $('.recipe-shortlist-page').removeClass('hide');
  
        var ingredientsRef = memberFolder.child(uid).child('ingredients');
        var ingredientsURL = usedIngredientsArray.join("%2C");
        var apiKey = "Z1zIQCqVVdmsha9CYOvgbDikmxTgp1U9BcGjsnzmx290k1J52q";
        var foodQueryURL = "https://spoonacular-recipe-food-nutrition-v1.p.mashape.com/recipes/findByIngredients?fillIngredients=true&ingredients=" + ingredientsURL + "&limitLicense=true&number=5&ranking=1";

        $.ajax({
            url: foodQueryURL,
            type: 'GET',
            data: {},
            dataType: 'json',
            success: function(data) {
                $('#recipe-list').empty();

                for (var i = 0; i < data.length; i++) {
                    var recipeDiv = $('<div class="recipe">');

                    var innerRecipeDiv = $('<div class="inner-recipe">');

                    var recipeName = data[i].title;

                    var recipeTitle = $('<a class="recipe-title">').text(recipeName);

                    var recipeUsedIngredients = data[i].usedIngredientCount;

                    var recipeUsedIngredientsList = $('<p>').text("Number of used ingredients: " + recipeUsedIngredients);

                    var recipeMissingIngredients = data[i].missedIngredientCount;

                    var recipeMissingIngredientsList = $('<p>').text("Number of missing ingredients: " + recipeMissingIngredients);

                    var recipeImage = $("<img class='recipeImage'>");
                    recipeImage.attr('src', data[i].image);

                    var recipeID = data[i].id;
                    var recipeQueryURL = 'https://spoonacular-recipe-food-nutrition-v1.p.mashape.com/recipes/' + recipeID + '/information?includeNutrition=false';

                    $.ajax({
                        url: recipeQueryURL,
                        type: 'GET',
                        data: {},
                        dataType: 'json',
                        success: function(data) {
                            // save data to an array for use below in recipeDetails function
                            recipeDetailArr.push(data);                               
                        },
                        beforeSend: function(xhr) {
                            xhr.setRequestHeader("X-Mashape-Authorization", apiKey);
                        }
                    })

                    recipeDiv.append(recipeImage);
                    innerRecipeDiv.append(recipeTitle);
                    innerRecipeDiv.append(recipeUsedIngredientsList);
                    innerRecipeDiv.append(recipeMissingIngredientsList);
                    recipeDiv.append(innerRecipeDiv);
                    $('#recipe-list').append(recipeDiv);
                }
                
            },
            error: function(err) { alert(err); },
            beforeSend: function(xhr) {
                xhr.setRequestHeader("X-Mashape-Authorization", apiKey);
            }

        });
    });

    $(document).on("click", ".recipe-title", function() {
        $('.detailed-view-page').removeClass('hide');
        $('.recipe-shortlist-page').addClass('hide');
        var recipeTitle = $(this).text();
        var youTubeQ = recipeTitle;

        recipeDetails(recipeTitle);

        youTubeQ = youTubeQ.trim().replace(/\s/g, '+');

        var APIKey = "AIzaSyAldakVxQrbZabH9SdIO3iocly3sOA727U"
        var queryURL = 'https://www.googleapis.com/youtube/v3/search?q='+ youTubeQ +'&key='+ APIKey + '&maxfields=25&fields=items(id(kind,videoId),snippet)&part=snippet&order=rating&relevanceLanguage=en&type=video&videoDefinition=standard&videoEmbeddable=true&safeSearch=strict&regionCode=us&topicId=/m/02wbm';

        displayVideos(recipeTitle, queryURL, '100%', '100%', 'https://www.youtube.com/embed/');
    });

    // back button to recipe short from detailed page  page
    $('#back-recipe-shortlist').on('click', function(){
        $('.recipe-shortlist-page').removeClass('hide');
        $('.detailed-view-page').addClass('hide');
    
        // remove videos - this will stop them playing
        $('.video-list').empty();

        return false;
    });

    function recipeDetails(recipeTitle){
        
        for (var i = 0; i < recipeDetailArr.length; i++ ){
            // find the current recipe - the one the user clicked on
            if(recipeDetailArr[i].title === recipeTitle){
                $('#recipe-details').html('<h2>Recipe Details</h2>')
                $('#recipe-details').append('<h3>' + recipeDetailArr[i].title + '</h3>');
                $('#recipe-details').append('<h3><img class="selected-recipe-image" src="' + recipeDetailArr[i].image + '"</h3>');
                $('#recipe-details').append('<h4>Preparation Time: '+ recipeDetailArr[i].readyInMinutes + " minutes</h4>");     
                 $('#recipe-details').append('<h4>Servings: '+ recipeDetailArr[i].servings + "</h4>");     
                $('#recipe-details').append('<p><u>Ingredients</u> <br></p>');
                    $('#recipe-details').append('<ul>');
                for (var j = 0; j < recipeDetailArr[i].extendedIngredients.length; j++){
                    // if there is not unit give for ingredients - use the backup original string 
                    // as its usually one or the other
                    if (recipeDetailArr[i].extendedIngredients[j].unit === ''){
                        $('#recipe-details').append('<li>' + recipeDetailArr[i].extendedIngredients[j].originalString +'</li>');
                    } else {
                        $('#recipe-details').append('<li>' + recipeDetailArr[i].extendedIngredients[j].amount + '  ' + recipeDetailArr[i].extendedIngredients[j].unit + ' ' + recipeDetailArr[i].extendedIngredients[j].name + '</li>');
 
                    }      
                   
                }
                $('#recipe-details').append('<br><u>Method</p>');
                $('#recipe-details').append(recipeDetailArr[i].instructions + '</br>');
                $('#recipe-details').append('<u>Credit:</u> ' + recipeDetailArr[i].creditText + '</br>');
                $('#recipe-details').append('<u>Source:</u> '+ recipeDetailArr[i].sourceName + ' at <a href="' + recipeDetailArr[i].sourceUrl + '">' + recipeDetailArr[i].sourceUrl + '</a>');
            }
        }

    };


    function displayVideos(recipe, queryURL, videoWidth, videoHeight, videoSrc) {
                
        $('.video-list').empty();
        $('.video-list').append("You searched for: " + recipe + ". Click on any of the youTube videos below for recipes!");
        $.ajax({
                url: queryURL,
                method: 'GET'
            })
            .done(function(response) {
                if (response.items.length !== 0 ){
                    var videoArray = [];
                    for (var i = 0; i < response.items.length; i++ ){
                        putVideosOnDom(response.items, videoWidth, videoHeight, videoSrc, response.items[i].id.videoId, i);
                                     // save to videos to the database for current uid
                        var newVideo = {
                            id: response.items[i].id.videoId,
                            title: response.items[i].snippet.title,
                            description: response.items[i].snippet.description
                        }
                        videoArray.push(newVideo);
                    }
                    var currentUID = firebase.auth().currentUser.uid;
                    memberFolder.child(currentUID).child('videos').set(videoArray);

                }  else {
                    $('.video-list').empty();
                    $('.video-list').append("Sorry, there are no YouTube instructional videos for this recipe.");
       
                }   

            });
    }

    function putVideosOnDom(result, videoWidth, videoHeight, videoSrc, videoId, i){
        
                var c = $('<div>');
                c.addClass('expand-video');
                var d = $('<span>');
                d.addClass('glyphicon glyphicon-resize-full expand-video-icon');
                d.attr('aria-hidden','true');
                c.append(d);
     

                $('.video-list').append(c);

                var b = $('<iframe>', {
                    allowScriptAccess : "always",
                    width : videoWidth,
                    height : videoHeight,
                    id: "video"+i,
                    src : videoSrc + videoId + "?version=3&enablejsapi=1&playerapiid=ytplayer",
                    class : "new-videos",
                });
                // add video information to the span so when clicked we can expand that video
                c.attr('data-video', "video"+i );
                $(c).append(b);

   
    }

    // if the browser is refeshed - log user out and they must reauthenticate
    resetOnRefresh();

}) // end of document on ready


// Zoom levels
// 1: World
// 5: Landmass/continent
// 10: City
// 15: Streets
// 20: Buildings

function initMap(){
    // initialised the map and sets the default center location
    var center = new google.maps.LatLng(latitude,longitude);
    var map = new google.maps.Map(document.getElementById('map'), {
      center: {lat: latitude, lng: longitude},
      zoom: 13  // 15 is a street level zoom
    });
    var message='';
    var markersArray =[];
    var infoWindow = new google.maps.InfoWindow({map: map});
    
    function findNewCenter(latitude,longitude, message){
        var pos = {
          lat: latitude,
          lng: longitude
        };
        infoWindow.setPosition(pos);
        infoWindow.setContent(message);
        map.setCenter(pos);
        centerlocation = map.getCenter();
        // remove entries from db
        uid = firebase.auth().currentUser.uid;
        var storefolder = memberFolder.child(uid).child('/stores/');
        storefolder.set(null);
        doSearchFromCurrentLocation(centerlocation);
    }

    // HTML5 geolocation. 
    // gets users current location then does search in predefined radius
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
        message = "<strong>You are here!</strong>"
        findNewCenter(position.coords.latitude,position.coords.longitude,message);
      }, function() {
        // if user does not allow location just use default
        doSearchFromCurrentLocation(center);
      });
    } 
    else {
      // if geolocation doesnt work just center map on predefined coords and search
        doSearchFromCurrentLocation(center);
    }
    
    $(document).on('click', '.store-data', function(){

        latitude = $(this).data('lat');
        longitude = $(this).data('lng');
        $(this).attr('style', 'background-color: darkgrey;');
        message = "<strong>" + $(this).data('name') + "</strong> is here.";

        var pos = {
          lat: latitude,
          lng: longitude
        };

        infoWindow.setPosition(pos);
        infoWindow.setContent(message);
        map.setCenter(pos);

     })

    function clearOverlays() {
      for (var i = 0; i < markersArray.length; i++ ) {
        markersArray[i].setMap(null);
      }
      markersArray.length = 0;
    }

    //Add listener - to allow user to click where they are and it will do another search
    map.addListener("click", function (event) {
        var latitude = event.latLng.lat();
        var longitude = event.latLng.lng();  
        clearOverlays();
        // recenter  map
        map.panTo(new google.maps.LatLng(latitude,longitude));

        message = "<strong>Found You!</strong>";

        findNewCenter(latitude, longitude, message);


    }); //end addListener

    // var count = 0;  

    // This is where the stores are located and marked on the map
    function doSearchFromCurrentLocation(centerlocation)   {

        // search for 
        var request = {
            location: centerlocation,
            radius: '500',  //500m radius
            query: 'grocery'
          };
        
        service = new google.maps.places.PlacesService(map);
        service.textSearch(request, callback);  
  

        function callback(results, status) {

            $('#map-stores > tbody').empty();
            $('#map-stores > tbody:last-child').append('<tr><th> Number </th><th> Store Name </th><th> Store Address </th><th> Open Now </th></tr>');
            // count = 0;
            if (status == google.maps.places.PlacesServiceStatus.OK) {
                var storeLocation = {};
                for (var i = 0; i < results.length; i++) {
                    
                    try{
                      open = results[i].opening_hours.weekday_text;
                    }
                    catch(e){
                      open='No information provided';
                    }

                    try{
                      openNow = results[i].opening_hours.open_now;
            
                    }
                    catch(e){
                      openNow='No information provided';
                    }



                    storeLocation = {name : results[i].name, formatted_address:results[i].formatted_address,openNow: openNow, openingTime: open, position_lat: results[i].geometry.location.lat(), position_lng: results[i].geometry.location.lng()};
                    
                    var marker = new google.maps.Marker({
                        position: results[i].geometry.location,
                        map: map,
                        title: results[i].name + " Address: " + results[i].formatted_address,
                        address: results[i].formatted_address
                    });

                    markersArray.push(marker);
                   
                    marker.addListener('click', function(){

                    map.setCenter(this.getPosition());
                        
                    })

                    // store to database for future use
                    $('#map-stores > tbody:last-child').append('<tr class="store-data" data-name=' + results[i].name + ' data-lat=' + results[i].geometry.location.lat() + ' data-lng=' + results[i].geometry.location.lng()+ '><td>'+ i +'</td><td>'+ results[i].name  +'</td><td>'+ results[i].formatted_address +'</td><td>'+ openNow +'</td></tr>');
        
                    // store to database for future use --  
                    uid = firebase.auth().currentUser.uid;
                    var storefolder = memberFolder.child(uid).child('/stores/');
            
                    storefolder.push(storeLocation);
                    storefolder.onDisconnect().set(null);
                    storeLocation = {};

                }
            }
        }
    }
} // end of initmap
       



