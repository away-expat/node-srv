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
              var nameCity = response.json.results[0].address_components[0].long_name;
              for(j = 0; j < decomposedAdressCity; j++){
                if(response.json.results[0].address_components[i].types[j] == 'country')
                  var countryCity = response.json.results[0].address_components[i].long_name;
              }
            }
            var locationCity = [response.json.results[0].geometry.location.lat,response.json.results[0].geometry.location.lng];

            var city = {
              "name" : nameCity,
              "country" : countryCity,
              "place_id" : placeIdCity,
              "location" : locationCity
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
            "country" : country
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
      googleMaps.places({
        pagetoken: token
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
  /*
  getRechName: function (token) {
    return new Promise((resolve, reject) => {
      googleMaps.placesQueryAutoComplete({
        input: 'pizza near New York',
        language: 'en',
        location: [40.724, -74.013],
        radius: 5000
      })
      .asPromise()
      .then(function(response) {
        var resp = response.json.predictions;
        resp.forEach(el => {
          console.log(el);
        })
        resolve(response);
        /*
        expect(response.json.predictions).toEqual(
            arrayContaining([
              objectContaining({
                description: 'pizza near New York, NY, USA'
              })
            ]));
      })
      .catch((err) => {
        console.log(err);
        reject(err);
      });
    });
  },*/





};
