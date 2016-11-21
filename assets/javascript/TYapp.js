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

// have checkbox functionality working with cheat (refresh) if anyone has ideas to avoid, feel free to edit TY

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

// food requests - appears to work but getting back odd result, not a lot of ingredients used TY

$('#submitIngredientsButton').on('click', function() {
        $('#recipe-list').empty();

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

                    $('#recipe-list').append(recipeDiv);
                }
            },
            error: function(err) { alert(err); },
            beforeSend: function(xhr) {
            xhr.setRequestHeader("X-Mashape-Authorization", apiKey); 
            }

        });
});

$(document).on("click",".recipe-title",function() {
    var youTubeQ = $(this).text();
    youTubeQ = youTubeQ.trim().replace(/\s/g, '+');

    //var queryURL = 'https://www.googleapis.com/youtube/v3/search?q='+ youTubeQ +'&key='+ 'AIzaSyDOkg-u9jnhP-WnzX5WPJyV1sc5QQrtuyc' + '&maxfields=25&fields=items(id(kind,videoId),snippet)&part=snippet&order=rating&relevanceLanguage=en&type=video&videoDefinition=standard&videoEmbeddable=true&safeSearch=strict&regionCode=us&topicId=/m/02wbm';
    var queryURL = 'https://www.googleapis.com/youtube/v3/search?q='+ youTubeQ +'&key='+ 'AIzaSyDOkg-u9jnhP-WnzX5WPJyV1sc5QQrtuyc' + '&maxfields=25&fields=items(id(kind,videoId),snippet)&part=snippet&topicId=/m/02wbm&type=video';
    displayVideos(queryURL,'100%','100%','https://www.youtube.com/embed/');
});

function displayVideos(queryURL,videoWidth,videoHeight,videoSrc){
    $('#video-list').empty();
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
            console.log("b: " + b);
            // response.items[i].id.videoId;
            $('#video-list').append(b);
            var c = $('<div>'+ response.items[i].snippet.title +'</div>');
            var d = $('<div>'+ response.items[i].snippet.description +'</div>');
            // console.log(response.items[i].snippet.title);
            $('#video-list').append(c);
            $('#video-list').append(d);

            // firebase.initializeApp(config);

            var newVideo = {
                id: response.items[i].id.videoId,
                title: response.items[i].snippet.title,
                description: response.items[i].snippet.description
            }
        }
    console.log(response);
        
    });
}