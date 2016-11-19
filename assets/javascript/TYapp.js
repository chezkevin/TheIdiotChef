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

$('#get-videos').on('click', function() {
    //var youTubeQ = 'what to make with ';
    var youTubeQ = ingredientsArray.join('+');
    youTubeQ = youTubeQ.trim().replace(/\s/g, '+');
    console.log(youTubeQ);

    //var queryURL = 'https://www.googleapis.com/youtube/v3/search?q='+ youTubeQ +'&key='+ 'AIzaSyDOkg-u9jnhP-WnzX5WPJyV1sc5QQrtuyc' + '&maxfields=25&fields=items(id(kind,videoId),snippet)&part=snippet&order=rating&relevanceLanguage=en&type=video&videoDefinition=standard&videoEmbeddable=true&safeSearch=strict&regionCode=us&topicId=/m/02wbm';
    var queryURL = 'https://www.googleapis.com/youtube/v3/search?q='+ youTubeQ +'&key='+ 'AIzaSyDOkg-u9jnhP-WnzX5WPJyV1sc5QQrtuyc' + '&maxfields=25&fields=items(id(kind,videoId),snippet)&part=snippet';
    //var queryURL = 'https://www.googleapis.com/youtube/v3/search?q='+ youTubeQ +'&key='+ 'AIzaSyDOkg-u9jnhP-WnzX5WPJyV1sc5QQrtuyc';
    displayVideos(queryURL,'100%','100%','https://www.youtube.com/embed/');
})

function displayVideos(queryURL,videoWidth,videoHeight,videoSrc){
    console.log("tried to displayVideos");
    console.log("query: " + queryURL);
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