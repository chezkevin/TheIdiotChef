var config = {
    apiKey: "AIzaSyBO9FzAeEmaMZiTrt648ni-rUIRzdUGzFs",
    authDomain: "myfirstfirebase-3c395.firebaseapp.com",
    databaseURL: "https://myfirstfirebase-3c395.firebaseio.com",
    storageBucket: "myfirstfirebase-3c395.appspot.com",
    messagingSenderId: "535414917818"
  };
firebase.initializeApp(config);

var database = firebase.database();

var ref = database.ref();

var ingredientZone = ref.child("ingredientZone");

var usedIngredientsArray = [];

database.ref('ingredientZone').orderByChild("name").on("child_added", function(childSnapshot) {

    // usedIngredientsArray = snapshot.val().usedIngredientsArray;

	if (childSnapshot.val().checked === 'true') {
		$("#ingredients-list").append("<div class='ingredient' id='" + childSnapshot.val().name + "'><button class='checkbox' id='" + childSnapshot.val().name + "'><i class='fa fa-check-circle-o' aria-hidden='true'></i></button><span id='name'> " + childSnapshot.val().name + " </span><button class='deletebox' id='" + childSnapshot.val().name + "'><i class='fa fa-trash' aria-hidden='true'></i></button></div>");
		usedIngredientsArray.push(childSnapshot.val().name);
	}

	else if (childSnapshot.val().checked === 'false') {
		$("#ingredients-list").append("<div class='ingredient' id='" + childSnapshot.val().name + "'><button class='nocheckbox' id='" + childSnapshot.val().name + "'><i class='fa fa-circle-o' aria-hidden='true'></i></button><span id='name'> " + childSnapshot.val().name + " </span><button class='deletebox' id='" + childSnapshot.val().name + "'><i class='fa fa-trash' aria-hidden='true'></i></button></div>");
	}

}, function(errorObject) {
    console.log("Errors handled: " + errorObject.code);
});

$('#addIngredientButton').on('click', function() {

	usedIngredientsArray = [];

    var newIngredientName = $('#ingredients-search').val().trim();

    var newIngredient = {
    	name: newIngredientName,
    	checked: 'true'
    }

    ingredientZone.child(newIngredientName).set(newIngredient);

    $("#ingredients-search").val("");

    return false;

})

$(document.body).on('click', '.deletebox', function(){

    var ingredientToDelete = $(this).attr("id");

    $("#" + ingredientToDelete).remove();

    var deleteLocation = ingredientZone.child(ingredientToDelete);

    deleteLocation.remove();
});

$(document.body).on('click', '.checkbox', function(){

	var ingredientToCheck = $(this).attr("id");

	var checkLocation = ingredientZone.child(ingredientToCheck);

	var checkStatus = checkLocation.child('checked');

	checkLocation.update({checked: 'false'});

	location.reload();

});

$(document.body).on('click', '.nocheckbox', function(){

	var ingredientToCheck = $(this).attr("id");

	var checkLocation = ingredientZone.child(ingredientToCheck);

	var checkStatus = checkLocation.child('checked');

	checkLocation.update({checked: 'true'});

	location.reload();

});

$('#submitIngredientsButton').on('click', function() {
        $('#recipe-list').empty();

        console.log(usedIngredientsArray);

        var ingredientsURL = usedIngredientsArray.join("&2C");

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

                    $('#recipe-list').append(recipeDiv);
                }
            },
            error: function(err) { alert(err); },
            beforeSend: function(xhr) {
            xhr.setRequestHeader("X-Mashape-Authorization", apiKey); 
            }

        });
});