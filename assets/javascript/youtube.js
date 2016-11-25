//  YouTube Data
//the below code fills in the first row of the table

$('document').ready(function(){
    var q = 'Chicken recipe'; //think you need add the word recipe to all searches otherwise you get some junk - i also added topicId for food.
    // I have put API Key in a separate js file. This is so we can follow best practise and save it as config variable on server - not visible to general public.
    // var channelID = 'UC73_TM2cRyOa1QOgoAl71gg'
    // var channelID = 'UCLj8f_mZrTVp7lv7HDQbNcA';
    // can only search one food channel at time
    // var channelID3 = 'UCov7K2Edykoh-40B3oLPOUw'
    // string to search all channels
    var APIKey = "AIzaSyCfGxrkb9P3oYRWrQ5XL4wxNmpyv_x9VL0"
    var queryURL = 'https://www.googleapis.com/youtube/v3/search?q='+ q +'&key='+ APIKey + '&maxfields=25&fields=items(id(kind,videoId),snippet)&part=snippet&order=rating&relevanceLanguage=en&type=video&videoDefinition=standard&videoEmbeddable=true&safeSearch=strict&regionCode=us&topicId=/m/02wbm';
    console.log(queryURL);
    // limit to known cooking channels
    // var queryURL = 'https://www.googleapis.com/youtube/v3/search?q='+ q +'&key='+ APIKey + '&channelId=' + channelID + '&maxfields=25&fields=items(id,snippet)&part=snippet&order=rating&relevanceLanguage=en&type=video&videoDefinition=standard&videoEmbeddable=true&safeSearch=strict&regionCode=us';
    // API Endpoint  https://www.googleapis.com/youtube/v3/search

    var videoWidth = '420';
    var videoHeight = '345';
    var videoSrc = 'https://www.youtube.com/embed/';



// var config = {
//     apiKey: "AIzaSyCfGxrkb9P3oYRWrQ5XL4wxNmpyv_x9VL0",
//     authDomain: "theidiotchef-149717.firebaseapp.com",
//     databaseURL: "https://theidiotchef-149717.firebaseio.com",
//     storageBucket: "theidiotchef-149717.appspot.com",
//     messagingSenderId: "963963795794"
    
//   };

// firebase.initializeApp(config);
// // var database = firebase.database("members").ref();
// var currentUID = firebase.auth().currentUser.uid;
// const txtEmail = $('#txtEmail');
// const txtPassword = $('#txtPassword');
// var btnLogin = $('#btnLogin');
// const btnSignUp = $('#btnSignUp');
// const btnLogout = $('#btnLogout');
// console.log("in here");
// btnLogout.hide();

// btnLogin.on('click', e => {
//    console.log("in here");
//     const email = txtEmail.val();
//     const pass = txtPassword.val();
//     const auth = firebase.auth();

//     const promise = auth.signInWithEmailAndPassword(email, pass);
//     promise.catch(e => console.log(e.message));


// });

// btnSignUp.on('click', e => {
   
//     const email = txtEmail.val();  // we must validate
//     const pass = txtPassword.val();
//     const auth = firebase.auth();

//     const promise = auth.createUserWithEmailAndPassword(email, pass);
//     promise.catch(e => console.log(e.message));

// });

// //signs out the currently authenticated user
// btnLogout.on('click', e => {
   
//     firebase.auth().signOut();

// });
// var currentUser;
// add a real time listener // firebaseUser null if not logged in
// firebase.auth().onAuthStateChanged(firebaseUser => {
//     console.log(firebaseUser);
//     currentUser = firebaseUser;
//     if (firebaseUser){
//         console.log("user: "+ firebaseUser);
//         btnLogout.show();
//     }
//     else {
//         console.log ('not logged in');
//         btnLogout.hide();
//     }
// } )

// // testing to see if rules work

//           var newVideo = {
//                 id: "test",
//                 title: "test",
//                 description: "test"
//              }
//             database.child('videoList').set(newVideo);



    $.ajax({
        url: queryURL,
        method: 'GET'
    })
    .done(function(response) {
        for(var i = 0; i < response.items.length; i++ ){
            var b = $('<iframe>', {
                width : videoWidth,
                height : videoHeight,
                src : videoSrc + response.items[i].id.videoId,
            }) 
            // response.items[i].id.videoId;
            $('.addVideos').append(b);
            var c = $('<div>'+ response.items[i].snippet.title +'</div>');
            var d = $('<div>'+ response.items[i].snippet.description +'</div>');
            // console.log(response.items[i].snippet.title);
            $('.addVideos').append(c);
            $('.addVideos').append(d);

            // firebase.initializeApp(config);

            var newVideo = {
                id: response.items[i].id.videoId,
                title: response.items[i].snippet.title,
                description: response.items[i].snippet.description
            }

            var currentUID = uid;
            memberFolder.child(currentUID).child('videoList').push(newVideo);

        }
      

    // console.log(response);
        
    });
})
