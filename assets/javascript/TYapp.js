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
        ingredientDisplay.append(" " + ingredientsArray[i] + " ");
        ingredientDisplay.data("checked", true);

        var ingredientDelete = $("<button>");
        ingredientDelete.attr("data-ingredient", ingredientCount);
        ingredientDelete.addClass("deletebox");
        ingredientDelete.append("<i class='fa fa-trash' aria-hidden='true'></i>");

        var ingredientCheck = $("<button>");
        ingredientCheck.attr("data-ingredient", ingredientCount);
        ingredientCheck.addClass("checkbox");
        ingredientCheck.append("<i class='fa fa-check-circle-o' aria-hidden='true'></i>");

        ingredientDisplay = ingredientDisplay.append(ingredientDelete);
        ingredientDisplay = ingredientDisplay.prepend(ingredientCheck);

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

$(document.body).on('click', '.deletebox', function(){

    var ingredientNumber = $(this).data("ingredient");

    $("#item-" + ingredientNumber).remove();

    ingredientsArray.splice(ingredientNumber, 1); 

    database.ref().set({
      ingredientsArray: ingredientsArray
    })

    loadIngredients();

});


//working on check functionality - TY

$(document.body).on('click', '.checkbox', function(){

    var ingredientNumber = $(this).data("ingredient");

    if ($("#item-" + ingredientNumber).data('checked') == true){
        console.log('blah');
        $("#item-" + ingredientNumber).data('checked', false);
        //$("#item-" + ingredientNumber).remove("<i class='fa fa-check-circle-o' aria-hidden='true'></i>");
        $("#item-" + ingredientNumber).append("<i class='fa fa-circle-o' aria-hidden='true'></i>");
    }
    else {
        $("#item-" + ingredientNumber).data('checked', true);
        //$("#item-" + ingredientNumber).remove("<i class='fa fa-circle-o' aria-hidden='true'></i>");
        $("#item-" + ingredientNumber).append("<i class='fa fa-check-circle-o' aria-hidden='true'></i>");
    }

});