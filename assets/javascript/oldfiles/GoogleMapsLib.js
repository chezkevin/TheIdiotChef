
  
      var map;
      
        function initMap() {
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
            infoWindow.setContent('Location found.');
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

        console.log(centerlocation);
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
                    console.log(results); 
        
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


                    })
                }
            }
        }
    }
       

 }

