// global configuration details are outside the document.ready function for now
// notes on disconnect not working for set Login Status = false need to take another look at
$(document).ready(function() { 
    var config = {
        // apiKey: "AIzaSyCfGxrkb9P3oYRWrQ5XL4wxNmpyv_x9VL0",
        // authDomain: "theidiotchef-149717.firebaseapp.com",
        // databaseURL: "https://theidiotchef-149717.firebaseio.com",
        // storageBucket: "theidiotchef-149717.appspot.com",
        // messagingSenderId: "963963795794"

        apiKey: "AIzaSyDeASMIr2HuqX9YdWU5U9M8wZFb0Apwj80",
        authDomain: "test-cac0a.firebaseapp.com",
        databaseURL: "https://test-cac0a.firebaseio.com",
        storageBucket: "test-cac0a.appspot.com",
        messagingSenderId: "818755096086"
      };
     
    firebase.initializeApp(config);

    var database = firebase.database();
    // decided to use one main db folder for all members
    var memberFolder = database.ref('/members/');
    var uid = ''; //user id for tracking purposes
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
        // Elements to Hide
        // by adding a class hide
        $('.homepage').addClass('hide');
        $('.email-update').addClass('hide');
        $('#show-homepage').addClass('hide');
        $('#navbar-logout-button').addClass('hide');
        $('#upgrade-from-guest').addClass('hide');
        $('#password-reset').addClass('hide');
        $('#email-reset').addClass('hide');
        // hidden by setting the display to none
        $('#registration-modal').hide();
        // Elements to Hide
        // hidden by removing a class hide
        $('.landing-page').removeClass('hide');
        // displayed by setting display to block
        $('#register').show();
        $('#guest').show();

    }

    // Function to capture user data on login as member or guest
    function captureUserData(user, status){
                uid = user.uid;
        //set as var accessible to other functions in the page 
        userProfile.userID = uid;
        userProfile.loginStatus = true;
        userProfile.email = user.email;
        // if logging in as a guest (anonymous)
        if (userProfile.email === null){
            userProfile.email = "guest";
        }
        // add to database
        let userFolder = database.ref('/members/' + uid);
        if ( status = 'new'){
            userFolder.set(userProfile);
        } 
        else if (status = 'existing'){
              userProfile.loginStatus = true;
              // add to database
              userFolder.update({loginStatus: userProfile.loginStatus, 
                        lastLogIn: userProfile.lastLogIn}
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
                // catch any errors related to guest / anonymous login
                let errorCode = e.code;
                let errorMessage = e.message;
                // try to make errors plain English
                // network related errors
                if (errorCode = "auth/network-request-failed") {
                    let displayMessage = 'Network error - unable to login as guest. Please try again.';
                }
                else {
                    let displayMessage = '<p> Guest Login Error: ' + errorCode + ' Please try again.</p>';
                }
                // for all other errors
                let displayMessage = '<p>Login Error: ' + errorMessage + ' Please try again.</p>';
                // call display message function
                displayErrorMessage(displayMessage); 

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

            let userFolder = database.ref('/members/' + uid);
            userFolder.update({email: user.email, 
                        lastLogIn: userProfile.lastLogIn}
                    );
            // set DOM items to display on login
            loginDisplayElements(user.email);
            // hide modal on successful registration
            hideRegistrationModal();

        }, function(error) {
            // console.log("Error upgrading anonymous account", error);
            let displayMessage = '<p>Error creating user account. Please try again later.</p>';
            displayErrorMessage(displayMessage); //modal not popping *****


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
                // captures errors on login 
                let errorCode = e.code;
                let errorMessage = e.message;
                let displayMessage = '<p>Login Error: ' + errorMessage + ' Please try again.</p>';
                // displays error messages
                displayErrorMessage(displayMessage);  

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
            .then(() => {

                //listener in event of log-out DRY OPPORTUNITY -IN ALL 3 login flows
                let loginStatusFolder = database.ref('/members/' + uid + '/loginStatus');

                // loginStatusFolder.on('value', function(snapshot) {
                //     if (snapshot.val()) {
                //         loginStatusFolder.onDisconnect().update(false);
                //     }
                // })

                //on success, render next page
                //TODO
                // renderLogOut();


            })
            .catch(e => {

                let errorCode = e.code;
                let errorMessage = e.message;
                let displayMessage = '<p>Login Error: ' + errorMessage + ' Please try again.</p>';
               
                $('#reg-error-msg').html(displayMessage); 
                // reset page
                $('#navbar-login-form').show();
                $('#register').show();


            })
           

    }

    function logOut() {

        firebase.auth().signOut()
            .then(() => {
    
                initialState();


            })
            .catch(error => {
                console.log(error);
                console.error('Sign Out Error: ', errorMessage);
                // $('.error-modal').addClass('show');
                $('.error-modal').show();
                $('#error-modal-message').html('<p>Sign Out Error: ' + errorMessage + '</p>');


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
        if (firebaseUser){
            $('#navbar-logout-button').removeClass('hide');
            $('#register').hide();
            $('#navbar-login-form').hide();
            $('#guest').addClass('hide');
        }
        else {
            $('#navbar-logout-button').addClass('hide');
            $('#register').show();
            $('#guest').removeClass('hide');
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
        }, function(error) {
          // An error happened.
          console.log(error);
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
        }, function(error) {
          // An error happened.
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
        $('.error-modal').show();
        $('#error-modal-message').html(message);
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

        //login anonymously
        memberLogIn();
        console.log(firebase.auth().currentUser);


        //call function to render next page
        //TODO

        //prevent page refresh
        return false

    });

    $('#navbar-logout-button').on('click', function(e) {

        // e.preventDefault();


        logOut();
        // resetPageOnLogout();
        // resetHomepage(); //make homepage visible

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
        $('#reg-error-msg').hide();

        //prevent page refresh
        return false

    });

   // close error msg
    $('#close-modal').on('click', function(){
        // $('.error-modal').hide();
        console.log("clicking me!");
        $('.error-modal').hide();
        // $('.error-modal').addClass('hide');

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
        // $('.email-update').addClass('show');
        // resetEmail();
        return false;
    })
    $('#cancel-email-reset').on('click', function(){
        // $('.email-update').removeClass('show');
        $('.email-update').addClass('hide');
        // resetEmail();
        return false;
    })


    $('#send-email-reset').on('click', function(){
        // $('show-email-input').show();
        resetEmail();
        // $('.email-update').removeClass('show');
        $('#email-update').addClass('hide');
        return false;
    })

    // Show and hide initial elements
    initialState();
   
    /*
    Parking Lot
        Merge anonymous acount data accumulated upon login w/ user's profile    
    */
    //  click events for whole site
    $('#show-homepage').on('click', function(){
        resetHomepage();

        return false;
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
        return false;
    })

    
    //various database references for food updates
    let ref = database.ref();
    // let ingredientZone = ref.child("ingredientZone");
    let userZone = ref.child('members');
    let usedIngredientsArray = [];
    // var userIng = firebase.auth().currentUser.uid;
    var userPlace = "";

    // userZone.on('child_added', function(childSnapshot) {
        
    //     console.log(userIng);
    //     userPlace = childSnapshot.val().userID;
    // })
   
  
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
        $('.recipe-shortlist-page').removeClass('hide'); // added by Fiona
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
        var youTubeQ = $(this).text();
        youTubeQ = youTubeQ.trim().replace(/\s/g, '+');

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
                // console.log(response.items.length);
               for (var i = 0; i < response.items.length; i++ ){
                    var b = $('<iframe>', {
                        width : videoWidth,
                        height : videoHeight,
                        src : videoSrc + response.items[i].id.videoId,
                        class : "new-videos",
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

    // $('.new-videos').on('click', function(){
    //     //make display it on top bigger
    //     $("#big-image").removeClass('hide');
    //     $("#big-image").append(this);
    //     // $(this).attr("height", "100%");


    // })
    // $('#big-image-close').on('click', function(){
    //     //make it normal
    //     $("#big-image").addClass('hide');
        
    // })
}) // end of document on ready

/// google maps - initMap must be global and outside document.ready

var map;
      
function initMap(){
    var center = new google.maps.LatLng(41.881832, -87.623177);
    var map = new google.maps.Map(document.getElementById('map'), {
      center: {lat:41.881832, lng: -87.623177},
      zoom: 15
    });

    // var map = new google.maps.Map(document.getElementById('map'), {
    //   zoom: 15,
    //   center: chicago
    // });

    var marker = new google.maps.Marker({
      position: center,
      map: map,
      title: 'Chicago!'
    });




    var infoWindow = new google.maps.InfoWindow({map: map});

    // HTML5 geolocation. 
    // gets users current location then does search in predefined radius
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function(position) {
        var pos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };

        infoWindow.setPosition(pos);
        infoWindow.setContent('Found You!');
        map.setCenter(pos);
        // console.log(map.getCenter());
        centerlocation = map.getCenter();
        console.log("in part 1");
        doSearchFromCurrentLocation(centerlocation)
      }, function() {
        // if user does not allow location
        // handleLocationError(true, infoWindow, map.getCenter());
        // handleLocationError(true, infoWindow, centerlocation);
              console.log("in part 2");
              doSearchFromCurrentLocation(center);
      });
    } 
    else {
      // if geolocation doesnt work just center map on predefined coords and search
      // handleLocationError(false, infoWindow, centerlocation);
       console.log("in part 3");
        doSearchFromCurrentLocation(center);
    }

    function handleLocationError(browserHasGeolocation, infoWindow, pos) {
    // infoWindow.setPosition(pos);
    // infoWindow.setContent(browserHasGeolocation ?
                          // 'Error: The Geolocation service failed.' :
                          // 'Error: Your browser doesn\'t support geolocation.');
       
    }

    function doSearchFromCurrentLocation(centerlocation)   {

        // console.log(centerlocation);
        var request = {
            location: centerlocation,
            radius: '500',
            query: 'restaraunt'
          };

        service = new google.maps.places.PlacesService(map);
        service.textSearch(request, callback);

        function callback(results, status) {
        
            createMarker = new google.maps.Marker;
            if (status == google.maps.places.PlacesServiceStatus.OK) {
                for (var i = 0; i < results.length; i++) {
                    // to view object details  console.log(results); 
                    // console.log(results); 
        
                    var marker = new google.maps.Marker({
                    position: results[i].geometry.location,
                    map: map,
                    title: results[i].name + " Opening Now: " + results[i].opening_hours.open_now + " Address: " + results[i].formatted_address,
                    // title: results[i].name,
                    address: results[i].formatted_address
                    });

                    // marker.addListener('center_changed', function(){
                    //     //3 sec after the center has changed pan back to the marker
                    //     window.setTimeout(function(){
                    //         map.panTo(marker.getPosition());}, 3000);
                    // })
                    // this allows you to zoom in and click on a flag to get
                    // details to populate DOM
                    marker.addListener('click', function(){
                        map.setZoom(15);
                        map.setCenter(this.getPosition());
                        // console.log(marker);
                        $('#marker-title').html(this.title);
                        // can use these coord to recenter the map and to save for later 
                        $('#marker-position-lat').html(this.getPosition().lat());
                        $('#marker-position-lng').html(this.getPosition().lng());
                        $('#marker-address').html(this.address);
                        $('.map-well').removeClass('hide');


                    })
                }
            }
        }
    }
       

 }


