var config = {
    apiKey: "AIzaSyBO9FzAeEmaMZiTrt648ni-rUIRzdUGzFs",
    authDomain: "myfirstfirebase-3c395.firebaseapp.com",
    databaseURL: "https://myfirstfirebase-3c395.firebaseio.com",
    storageBucket: "myfirstfirebase-3c395.appspot.com",
    messagingSenderId: "535414917818"
  };
firebase.initializeApp(config);

var database = firebase.database();

var ingredientsArray = [];

var ingredientCount = 0;

function loadIngredients() {

    ingredientCount = 0;

    $('#ingredients-list').empty();

	for(var i=0; i<ingredientsArray.length; i++) {

        var ingredientDisplay = $('<button>');
        ingredientDisplay.attr("id", "ingredient-" + ingredientCount);
        ingredientDisplay.append(" " + ingredientsArray[i]);

        var ingredientDelete = $("<button>");
        ingredientDelete.attr("data-ingredient", ingredientCount);
        ingredientDelete.addClass("checkbox");
        ingredientDelete.append("X");

        ingredientDisplay = ingredientDisplay.prepend(ingredientDelete);

    	$('#ingredients-list').append(ingredientDisplay);

        ingredientCount++;

	}

}

database.ref().on("value", function(snapshot) {

	ingredientsArray = snapshot.val().ingredientsArray;

	loadIngredients();

})

$('#addIngredientButton').on('click', function() {

    var newIngredient = $('#ingredients-search').val().trim();

    ingredientsArray.push(newIngredient);

    database.ref().set({
      ingredientsArray: ingredientsArray
    })

    loadIngredients();

})

$(document.body).on('click', '.checkbox', function(){

    var ingredientNumber = $(this).data("ingredient");

    $("#item-" + ingredientNumber).remove();

    ingredientsArray.splice(ingredientNumber, 1); 

    database.ref().set({
      ingredientsArray: ingredientsArray
    })

    loadIngredients();

});