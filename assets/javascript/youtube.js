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
    var queryURL = 'https://www.googleapis.com/youtube/v3/search?q='+ q +'&key='+ APIKey + '&maxfields=25&fields=items(id(kind,videoId),snippet)&part=snippet&order=rating&relevanceLanguage=en&type=video&videoDefinition=standard&videoEmbeddable=true&safeSearch=strict&regionCode=us&topicId=/m/02wbm';
    // limit to known cooking channels
    // var queryURL = 'https://www.googleapis.com/youtube/v3/search?q='+ q +'&key='+ APIKey + '&channelId=' + channelID + '&maxfields=25&fields=items(id,snippet)&part=snippet&order=rating&relevanceLanguage=en&type=video&videoDefinition=standard&videoEmbeddable=true&safeSearch=strict&regionCode=us';
    // API Endping  https://www.googleapis.com/youtube/v3/search

    var videoWidth = '420';
    var videoHeight = '345';
    var videoSrc = 'https://www.youtube.com/embed/';



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

        }
      

    console.log(response);
        
    });
})
