const googleMaps = require('@google/maps').createClient({
  key: 
  Promise: Promise
});

module.exports = {
  getByName: function (city) {
    return new Promise((resolve, reject) => {
      googleMaps.geocode({
          components: {
            locality: city,
            type: 'locality'
          },
        })
        .asPromise()
        .then((response) => {
          if(response.json.status == 'OK'){

            var placeIdCity = response.json.results[0].place_id;
            let sizeAdressCity = response.json.results[0].address_components.length;

            for(i = 0; i < sizeAdressCity; i++){
              let decomposedAdressCity = response.json.results[0].address_components[i].types.length;
              var nameCity;
              for(j = 0; j < decomposedAdressCity; j++){
                if(response.json.results[0].address_components[i].types[j] == 'country'){
                  var countryCity = response.json.results[0].address_components[i].long_name;
                  var countryCode = response.json.results[0].address_components[i].short_name;
                }
                if(response.json.results[0].address_components[i].types[j] == 'locality'){
                  nameCity = response.json.results[0].address_components[i].long_name;
                }
              }
            }

            var locationCity = [response.json.results[0].geometry.location.lat,response.json.results[0].geometry.location.lng];

            var city = {
              "name" : nameCity,
              "country" : countryCity,
              "place_id" : placeIdCity,
              "location" : locationCity,
              "countryCode" : countryCode
            }
            resolve(city);
          } else {
            resolve([]);
          }
        })
        .catch((error) => {
          console.log(error);
          reject(error);
        });
      });
  },
  getDetail: function (place_id) {
    return new Promise((resolve, reject) => {
      googleMaps.place({
        placeid: place_id,
      })
      .asPromise()
      .then(function(detailElement) {
        if(detailElement.json.status == 'OK'){
          var address_components = detailElement.json.result.address_components;
          var city;
          var country;
          address_components.forEach(add => {
            if(add.types[0]=='locality')
              city = add.long_name;
            if(add.types[0]=='country')
              country = add.long_name;
          })

          var loc = detailElement.json.result.geometry.location;
          var location = [loc.lat, loc.lng];
          var address = detailElement.json.result.formatted_address;
          var name = detailElement.json.result.name;
          var place_id = detailElement.json.result.place_id;
          var rating = -1;
          if(detailElement.json.result.rating)
            rating = detailElement.json.result.rating;
          var url = detailElement.json.result.url;
          var photos;
          if(detailElement.json.result.photos)
            photos = detailElement.json.result.photos[0].photo_reference;
          else
            photos = "";
          var tmp_types = detailElement.json.result.types;
          var types = [];

          tmp_types.forEach(el => {
            if(el != 'point_of_interest' && el != 'establishment')
              types.push(el);
          });

          var activity = {
            "address" : address,
            "name" : name,
            "place_id" : place_id,
            "rating" : rating,
            "types" : types,
            "url" : url,
            "photos" : photos,
            "city" : city,
            "country" : country,
            "location" : location
          }

          resolve(activity);
        }

      }).catch(error => {
        console.log(error);
        reject(error);
      });

    });
  },
  getNear: function (location, type) {
    return new Promise((resolve, reject) => {
      googleMaps.placesNearby({
          location: location,
          radius: 5000,
          type: type
        })
        .asPromise()
        .then((response) => {
          if(response.json.status == 'OK'){
            var tokenNextPage = "";
            if(response.json.next_page_token)
              tokenNextPage = response.json.next_page_token;

            var returnValueActivities = []
            response.json.results.forEach(el => {
              if(el.types[0] != 'locality' && el.types[0] != 'colloquial_area' && el.types[0] != 'sublocality_level_1'){
                returnValueActivities.push(el.place_id);
              }
            });
            var returnValue = {
              "results" : returnValueActivities,
              "token" : tokenNextPage
            }
            resolve(returnValue);
          } else {
            resolve([]);
          }
        })
        .catch((err) => {
          console.log(err);
          reject(err);
        });
    });
  },
  getNextPage: function (token) {
    return new Promise((resolve, reject) => {
      var request = require('request');
      request("https://maps.googleapis.com/maps/api/place/nearbysearch/json?pagetoken=" + token + "&key=AIzaSyB17-DLIRJDd2fZetdqBPByqyQn2n5F7KM", function (error, response, body) {
        if(response && response.statusCode != 200){
          console.log(error)
          reject(error);
        }

        body = JSON.parse(body);
        if(body.status == 'OK'){
          var tokenNextPage = "";
          if(body.next_page_token)
            tokenNextPage = body.next_page_token;

          var returnValueActivities = []
          body.results.forEach(el => {
            if(el.types[0] != 'locality' && el.types[0] != 'colloquial_area' && el.types[0] != 'sublocality_level_1'){
              returnValueActivities.push(el.place_id);
            }
          });
          var returnValue = {
            "results" : returnValueActivities,
            "token" : tokenNextPage
          }
          resolve(returnValue);
        } else {
          resolve([]);
        }
      });

    });
  },
  rechByName : function(name, location, type){
    return new Promise((resolve, reject) => {
      googleMaps.places({
        query: name,
        language: 'fr',
        location: location,
        type: type,
        radius: 5000
      })
      .asPromise()
      .then((response) => {

        if(response.json.status == 'OK'){
          var tokenNextPage = "";
          if(response.json.next_page_token)
            tokenNextPage = response.json.next_page_token;

          var returnValueActivities = []
          response.json.results.forEach(el => {
            if(el.types[0] != 'locality' && el.types[0] != 'colloquial_area' && el.types[0] != 'sublocality_level_1'){
              returnValueActivities.push(el.place_id);
            }
          });
          var returnValue = {
            "results" : returnValueActivities,
            "token" : tokenNextPage
          }
          resolve(returnValue);
        } else {
          resolve([]);
        }
      })
      .catch((err) => {
        console.log(err);
        reject(err);
      });
    });
  },
  rechNameCity: function(name) {
    return new Promise((resolve, reject) => {
      googleMaps.placesQueryAutoComplete({
        input: name,
        language: 'fr',
      })
      .asPromise()
      .then(function(response) {
        if(response.json.status == 'OK'){
          var resultArray = [];
          var tmpResultArray = response.json.predictions;
          tmpResultArray.forEach(el => {
            if(el.types[0] == 'locality')
              resultArray.push(el.description);
          });
          resolve(resultArray);
        } else {
          console.log('Error : Status req not ok');
          reject('Error : Status req not ok');
        }

      })
      .catch((error) => {
        console.log(error);
        reject(error);
      });
    })
  },




};
