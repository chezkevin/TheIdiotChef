

var config = {
	apiKey: "AIzaSyCfGxrkb9P3oYRWrQ5XL4wxNmpyv_x9VL0",
    authDomain: "theidiotchef-149717.firebaseapp.com",
    databaseURL: "https://theidiotchef-149717.firebaseio.com",
    storageBucket: "theidiotchef-149717.appspot.com",
    messagingSenderId: "963963795794"
    
  };

firebase.initializeApp(config);
var database = firebase.database().ref();

const txtEmail = $('#txtEmail');
const txtPassword = $('#txtPassword');
var btnLogin = $('#btnLogin');
const btnSignUp = $('#btnSignUp');
const btnLogout = $('#btnLogout');
console.log("in here");
btnLogout.hide();

btnLogin.on('click', e => {
   console.log("in here");
	const email = txtEmail.val();
	const pass = txtPassword.val();
	const auth = firebase.auth();

	const promise = auth.signInWithEmailAndPassword(email, pass);
	promise.catch(e => console.log(e.message));


});

btnSignUp.on('click', e => {
   
	const email = txtEmail.val();  // we must validate
	const pass = txtPassword.val();
	const auth = firebase.auth();

	const promise = auth.createUserWithEmailAndPassword(email, pass);
	promise.catch(e => console.log(e.message));

});

//signs out the currently authenticated user
btnLogout.on('click', e => {
   
	firebase.auth().signOut();

});
var currentUser;
// add a real time listener // firebaseUser null if not logged in
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

// testing to see if rules work

	      var newVideo = {
                id: "test",
                title: "test",
                description: "test"
             }
            database.child('videoList').set(newVideo);


//adding ingredients to data and display - TY

var ingredientsArray = [];

function loadIngredients() {

	for(var i=0; i<ingredientsArray.length; i++) {

		$('#ingredients-list').empty();

		var ingredientDisplay = $('<p>').text(ingredientsArray[i]);

    	$('#ingredients-list').append(ingredientDisplay);
	}

}

database.on("value", function(snapshot) {

	ingredientsArray = snapshot.val().ingredientsArray;

	loadIngredients();

})

$('#addIngredientButton').on('click', function() {

    var newIngredient = $('#ingredients-search').val().trim();

    ingredientsArray.push(newIngredient);

    database.set({
      ingredientsArray: ingredientsArray
    })

    loadIngredients();
})