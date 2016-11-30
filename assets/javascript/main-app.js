var config = {        
    apiKey: "AIzaSyB86ufSLxlXh_Oj7Se_rmg5FmddSA9qYEU",
    authDomain: "test-a0542.firebaseapp.com",
    databaseURL: "https://test-a0542.firebaseio.com",
    storageBucket: "test-a0542.appspot.com",
    messagingSenderId: "655697953340"
  

        // apiKey: "AIzaSyDeASMIr2HuqX9YdWU5U9M8wZFb0Apwj80",
        // authDomain: "test-cac0a.firebaseapp.com",
        // databaseURL: "https://test-cac0a.firebaseio.com",
        // storageBucket: "test-cac0a.appspot.com",
        // messagingSenderId: "818755096086"
      };
     
firebase.initializeApp(config);

var database = firebase.database();
// decided to use one main db folder for all members
//needed for maps to access so global
var memberFolder = database.ref('/members/');
var player;




// decided to use one main db folder for all members
// var memberFolder = database.ref('/members/');
var map;
var latitude = 41.881832;
var longitude =  -87.623177; 
var currentUser;

$(document).ready(function() { 
    
    var loggedUser = null;
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
        // hidden by setting the display to none
        $('#registration-modal').hide();
        // Elements to Hide
        // hidden by removing a class hide
        $('.landing-page').removeClass('hide');
        // displayed by setting display to block
        $('#guest').show();
        $('#register').show();
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
        console.log("status: " + status);
        // add to database
        let userFolder = database.ref('/members/' + uid);
        // check what is happening and handle accordingly - new user, existing or upgrade
        if ( status === 'new'){
             // console.log("in here ***");
            userFolder.set(userProfile);
        } 
        else if (status === 'existing'){
            // userProfile.loginStatus = true;
            // add to database
            // console.log("in here ****");
            userFolder.update({lastLogIn: userProfile.lastLogIn}
            );
        } else if (status === 'upgrade'){
            // console.log("in here");
            userFolder.update({email: user.email}
            );
        }
            
        // when user closes window / disconnects remove the guest user
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
       
        // $('#navbar-login-form').hide();
        let email = $('#registration-email-input').val().trim();
        let password = $('#registration-password-input').val().trim();
        const credential = firebase.auth.EmailAuthProvider.credential(
            email, 
            password
        );

        firebase.auth().currentUser.link(credential).then(function(user) {
console.log("here toooooo");
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
                console.log("here users");
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
                // close the map if it is open
                // if (mapWindow !== null){
                //     closeMapWin();
                // }
                
                


            })
            .catch(e => {
                
                displayErrorMessage(e.message);

            });

        //remove logged in user name in header
        $('#userName').html('');

        //add login option up top on navbar
        renderNavBarLogIn();

    }

    // event listener for authentication state change e.g. logout 
    // this also allows user to be logged in after registering
    firebase.auth().onAuthStateChanged(firebaseUser => {
        currentUser = firebaseUser;
        loggedUser = firebase.auth().currentUser.uid;
        console.log(loggedUser);
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
            // $('#google-maps').addClass('hide');
        }
    })

    // reset password
    function resetPassword(){
        let auth = firebase.auth();
        let user = firebase.auth().currentUser;
        let emailAddress = user.email;
        console.log(emailAddress);

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
        $('.homepage').removeClass('hide');
        $('.landing-page').addClass('hide');
        $('.recipe-shortlist-page').addClass('hide');
        $('.detailed-view-page').addClass('hide');
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
        // recipe-shortlist-page
        // $('.map-page').removeClass('hide');
        // $('#google-maps').removeClass('hide');
        $('.recipe-shortlist-page').addClass('hide');
    }
    // displays default homepage and DOM items
    function showHomepage(email){
        $('#show-homepage').removeClass('hide');
        $('.homepage').removeClass('hide');
        $('#userName').show();
        $('#userName').html('Logged in as: ' + email); 
    }
    // displays additional items for an anon guest user
    function displayGuestItems(){
        // display guest upgrade button
        $('#upgrade-from-guest').removeClass('hide');
        // make sure the following buttons are hidden
        $('#reset-email').addClass('hide');
        $('#reset-password').addClass('hide');
        $('.landing-page').addClass('hide');
        // $('.map-page').removeClass('hide');
         // $('#google-maps').removeClass('hide');
    }
    // displays additional items for a member  user
    function displayMemberItems(){
        $('#password-reset').addClass('hide');
        $('#email-reset').addClass('hide');
    }
    // resets homepage layout when navigating from other pages
    function resetHomepage(){ 
        $('.homepage').removeClass('hide');
        $('#show-homepage').removeClass('hide'); //added
        $('.landing-page').addClass('hide');
        $('.recipe-shortlist-page').addClass('hide');
        $('.detailed-view-page').addClass('hide');
        if (userProfile.email !== 'guest'){
            $('#email-reset').removeClass('hide');
            $('#password-reset').removeClass('hide');
        }
    }
    // modal for login error messages
    function displayErrorMessage(message){  
        // captures errors on login 
        // let errorCode = e.code;
        // let errorMessage = e.message;
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
    
    // Button Actions Section
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


    $('#open-map').on('click', function(){
        $('.map-page').removeClass('hide');
    })

    $('#close-map').on('click', function(){
        $('.map-page').addClass('hide');
    })

    // $('#open-map').on('click', function(){
    //     // $('.show-map').removeClass('hide');
    //     openMapWin();
    //     // $('#userName').show();
    // });


    // $('#close-map').on('click', function(){
    //     closeMapWin();
    //     // $('.show-map').addClass('hide');
    // });

    // if the browser is refeshed - log user out and they must reauthenticate
    resetOnRefresh();



//// This is where Recipe API is called and handled
    
    //various database references for food updates
    let ref = database.ref();
    // let ingredientZone = ref.child("ingredientZone");
    let userZone = ref.child('members');
    let usedIngredientsArray = [];
    // var userIng = firebase.auth().currentUser.uid;
    var userPlace = "";
   
  
    function initialIngredientsList(){
        
        memberFolder.child(uid).child('ingredients').on('child_added', function(childSnapshot) {
        
            if (usedIngredientsArray.indexOf(childSnapshot.val().name) > -1) {
                return;
            } else {

                let newChild = updateIngredientList(childSnapshot);

                addCheckBoxListener(newChild);
            }
        })  
    }  
        
    
   

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
        if (checked == 'true') {
            usedIngredientsArray.push(childSnapshot.val().name);
        }
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

        usedIngredientsArray = [];

        var newIngredientName = $('#ingredients-search').val().trim();

        var newIngredient = {
            name: newIngredientName,
            checked: 'true'
        }
        // var currentUID = uid;
        // var currentUID = firebase.auth().currentUser.uid;
        memberFolder.child(uid).child('ingredients').child(newIngredientName).set(newIngredient);

        $("#ingredients-search").val("");

        return false;

    })

    $(document.body).on('click', '.deletebox', function() {

        var ingredientToDelete = $(this).attr("id");

        $("#" + ingredientToDelete).remove();

        var deleteLocation = memberFolder.child(uid).child('ingredients').child(ingredientToDelete);

        deleteLocation.remove();
    });

    $('#submitIngredientsButton').on('click', function() {
        $('.recipe-list').empty();
        $('.homepage').addClass('hide'); // added by Fiona
        $('#map-page').addClass('hide'); // added by Fiona
        $('#topZone').hide();
        $('.recipe-shortlist-page').removeClass('hide');

        // $('.recipe-shortlist').removeClass('hide'); // added by Fiona
      
        var ingredientsRef = memberFolder.child(uid).child('ingredients');

        // ingredientsRef.once('value')
        //     .then(function(snapshot) {
        //         snapshot.forEach(function(childSnapshot){
        //             if (childSnapshot.val('checked') == 'false') {
        //                 usedIngredientsArray.push(childSnapshot.val('name'));
        //                 console.log('yay  ' + childSnapshot);
        //             }
        //         })
        //     })

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
                                console.log(data);
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

        youTubeQ = youTubeQ.trim().replace(/\s/g, '+');

        var APIKey = "AIzaSyAldakVxQrbZabH9SdIO3iocly3sOA727U"
        var queryURL = 'https://www.googleapis.com/youtube/v3/search?q='+ youTubeQ +'&key='+ APIKey + '&maxfields=25&fields=items(id(kind,videoId),snippet)&part=snippet&order=rating&relevanceLanguage=en&type=video&videoDefinition=standard&videoEmbeddable=true&safeSearch=strict&regionCode=us&topicId=/m/02wbm';

        displayVideos(recipeTitle, queryURL, '100%', '100%', 'https://www.youtube.com/embed/');
    });

    function displayVideos(recipe, queryURL, videoWidth, videoHeight, videoSrc) {
        console.log("recipe: " + recipe);        
        $('.video-list').empty();
        $('.video-list').append("You searched for: " + recipe + ". Click on any of the videos below for recipes!");
        $.ajax({
                url: queryURL,
                method: 'GET'
            })
            .done(function(response) {
            
               for (var i = 0; i < response.items.length; i++ ){
                    var b = $('<iframe>', {
                        allowScriptAccess : "always",
                        width : videoWidth,
                        height : videoHeight,
                        id: "myytplayer"+i,
                        src : videoSrc + response.items[i].id.videoId + "?version=3&enablejsapi=1&playerapiid=ytplayer",
                        class : "new-videos",
                    });


                    // var b = $('<iframe>'+ videoSrc + response.items[i].id.videoId + '</iframe>');
                    // console.log("b" + b);
                    $('.video-list').append(b);
                    // b.append('<p><a href="javascript:" class="star"></a></p>');
                    // var c = $('<div>'+ response.items[i].snippet.title +'</div>');
                    // var d = $('<div>'+ response.items[i].snippet.description +'</div>');
                    // console.log(response.items[i].snippet.title);
                    // $('#video-list').append(c);
                    // $('#video-list').append(d);

            
                    // function onYouTubeIframeAPIReady() {
                    //     var playerstring = 'myytplayer'+i;
                    //     // var players =  ;
                    //     var players = new YT.Player("player" + i);

                    //     console.log("players" +players);
                    // }

                    
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

// function pauseVideoOnSlide(){
//   var iframe =document.getElementById('myytplayer0');

//     if (iframe) {
//         var target = iframe.contentWindow;
//         target.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
//     }
// }
    
    // back button to recipe short from detailed page  page
    $('#back-recipe-shortlist').on('click', function(){
        $('.recipe-shortlist-page').removeClass('hide');
        $('.detailed-view-page').addClass('hide');
        // stop any videos playing
            // cant get stop video to work
            // var slides = document.getElementsByClassName("new-videos");
            // for(var i = 0; i < slides.length; i++)
            // {
            //    $('#myytplayer' + i).onload = function(){
            //     var target = document.getElementById('myytplayer' + i).contentWindow;
            //     target.postMessage(JSON.stringify({
            //     "event": "command",
            //     "func": "pauseVideo",
            //     "args": ""}), "*");
            //     };
     
            // }
            // remove videos - this will stop them playing
            $('.video-list').empty();
            




            return false;
        })

}) // end of document on ready


 

function initMap(){
    // initialised the map and sets the default center location
    var center = new google.maps.LatLng(latitude,longitude);
    var map = new google.maps.Map(document.getElementById('map'), {
      center: {lat: latitude, lng: longitude},
      zoom: 15  // 15 is a street level zoom
    });
    var message='';
    var markersArray =[];

    // Zoom levels
    // 1: World
    // 5: Landmass/continent
    // 10: City
    // 15: Streets
    // 20: Buildings

    var infoWindow = new google.maps.InfoWindow({map: map});

    function findNewCenter(latitude,longitude, message){
        var pos = {
          lat: latitude,
          lng: longitude
        };

        infoWindow.setPosition(pos);
        infoWindow.setContent(message);
       
        // infoMessage(latitude,longitude);
        map.setCenter(pos);
        // console.log(map.getCenter());
        centerlocation = map.getCenter();
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
        message = "<strong>" + $(this).data('name') + "</strong> is here.";

        // infoMessage(latitude,longitude);
        var pos = {
          lat: latitude,
          lng: longitude
        };

        infoWindow.setPosition(pos);
        infoWindow.setContent(message);
        // map.setZoom(15);
        // findNewCenter(latitude, longitude, message);

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

    var count = 0;  

    // This is where the stores are located and marked on the map
    function doSearchFromCurrentLocation(centerlocation)   {

        // search for 
        var request = {
            location: centerlocation,
            radius: '500',  //500m radius
            query: 'grocery'
          };
        
        // marker.setMap(null); //clears markers
        service = new google.maps.places.PlacesService(map);
        service.textSearch(request, callback);  
  

 

        function callback(results, status) {

            $('#map-stores > tbody').empty();
            $('#map-stores > tbody:last-child').append('<tr><th> Number </th><th> Store Name </th><th> Store Address </th><th> Open Now </th></tr>');
            count = 0;
            if (status == google.maps.places.PlacesServiceStatus.OK) {
                var storeLocation = [];
                for (var i = 0; i < results.length; i++) {
                    // to view object details  console.log(results); 

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



                    storeLocation.push({name : results[i].name, formatted_address:results[i].formatted_address,openNow: openNow, openingTime: open, position_lat: results[i].geometry.location.lat(), position_lng: results[i].geometry.location.lng()});
                    console.log(storeLocation);
                    // var marker = new google.maps.Marker();
                    // marker.setMap(null); //clears markers
                    var marker = new google.maps.Marker({
                    position: results[i].geometry.location,
                    map: map,
                    title: results[i].name + " Address: " + results[i].formatted_address,
                    address: results[i].formatted_address
                    });

                    markersArray.push(marker);
                    // marker.setMap(null); //clears markers

                    marker.addListener('click', function(){
                        // map.setZoom(15);
                        map.setCenter(this.getPosition());
                        // $('.map-well').removeClass('hide');
                    })

                    // marker.setMap(null); 


                     // var uid = user.uid;
                    // var loggedUser;
                    // hardcoded UID
                    /// UID not being passed
                    // workaround create unique key and store date there until logout
                    // var currentUID = firebase.auth().currentUser.uid;
                    // uniqueKey = "dfasfsdafasfasf";

                    uid = firebase.auth().currentUser.uid;
                    var storefolder = memberFolder.child(uid).child('/stores/');
                    storefolder.set(storeLocation);
                    storefolder.onDisconnect().set(null);
                    storeLocation = [];

                    storefolder.on('child_added', function(childSnapshot){
                        count++;
                        //empty table  
                        // console.log(childSnapshot.val()); 
                        if (childSnapshot.val().openNow){
                            var open = 'Open';
                        }
                        else if (!childSnapshot.val().openNow){
                            var open = 'Closed';
                        } else{
                            var open = childSnapshot.val().openNow;
                        }
                       
                        $('#map-stores > tbody:last-child').append('<tr class="store-data" data-name=' + JSON.stringify(childSnapshot.val().name) + ' data-lat=' + childSnapshot.val().position_lat + ' data-lng=' + childSnapshot.val().position_lng+ '><td>'+ count +'</td><td>'+ childSnapshot.val().name +'</td><td>'+ childSnapshot.val().formatted_address +'</td><td>'+ open +'</td></tr>');
        

                    });  


 }
                }
            }
        }
    }
       




// $('#close-map').on('click', function(){

//     window.close();

// })


