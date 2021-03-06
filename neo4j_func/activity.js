var session = require('../routes/databaseConnexion.js');
var googleApi = require('../routes/google_api.js');
var neo4jTag = require('./tag.js');
var apiKey = 

function takeOffSimpleCote(name){
  while(name.indexOf('"') != -1)
      name = name.replace('"', "'");
  return name;
}

module.exports = {
  getByGoogleId: function (id) {
    return new Promise((resolve, reject) => {
      const resultPromise = session.run(
        'Match (a:Activity {place_id : "' + id + '" }) Return a',
      );

      resultPromise.then(result => {
        const records = result.records;
        var returnValue;
        records.forEach((element) => {
          var el = element.get(0);
          var photo;
          if(el.properties.photos){
            photo = "https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&key="+apiKey+"&photoreference=";
            photo += el.properties.photos;
          } else {
            photo = "http://51.75.122.187:3000/img/noPhoto.jpg";
          }

          var activity = {
            "id" : el.identity.low,
            "name" : el.properties.name,
            "address" : el.properties.address,
            "place_id" : el.properties.place_id,
            "url" : el.properties.url,
            "photos" : photo,
            "location" : el.properties.location,
            "type" : el.properties.type
          }
          if(el.properties.rating.low)
            activity.rating = el.properties.rating.low;
          else
            activity.rating = el.properties.rating;

          returnValue = activity;
        });

        resolve(returnValue);

      }).catch( error => {
        console.log(error);
        reject(error);
      });
    })
  },
  create: function (adress, name, place_id, rating = -1, types, url, photos, idCity,location) {
    return new Promise((resolve, reject) => {
      name = takeOffSimpleCote(name);
      const resultPromise = session.run(
        'Match (c:City) ' +
        'WHERE ID(c)= ' + idCity + ' ' +
        'Create (a:Activity {' +
        'address: "' + adress + '", ' +
        'name: "'+ name + '", ' +
        'place_id: "' + place_id + '", ' +
        'rating: ' + rating + ', ' +
        'url: "' + url + '", ' +
        'type : "' + types + '", ' +
        'location: "' + location + '", ' +
        'photos: "' + photos + '" ' +
        '})<-[:HAS]-(c) Return a',
      );

      resultPromise.then(result => {
        const records = result.records;
        var returnValue;
        records.forEach(function(element){
          var el = element.get(0);
          var photo;
          if(el.properties.photos){
            photo = "https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&key="+apiKey+"&photoreference=";
            photo += el.properties.photos;
          } else {
            photo = "http://51.75.122.187:3000/img/noPhoto.jpg";
          }

          var activity = {
            "id" : el.identity.low,
            "name" : el.properties.name,
            "address" : el.properties.address,
            "place_id" : el.properties.place_id,
            "url" : el.properties.url,
            "photos" : photo,
            "location" : el.properties.location,
            "type" : el.properties.type
          }
          if(el.properties.rating.low)
            activity.rating = el.properties.rating.low;
          else
            activity.rating = el.properties.rating;

          returnValue = activity;
        });

        resolve(returnValue);
      }).catch( error => {
        console.log(error);
        reject(error);
      });

    })
  },
  createWithoutCity: function (adress, name, place_id, rating = -1, types, url, photos,location) {
    return new Promise((resolve, reject) => {
      name = takeOffSimpleCote(name);
      const resultPromise = session.run(
        'Create (a:Activity {' +
        'address: "' + adress + '", ' +
        'name: "'+ name + '", ' +
        'place_id: "' + place_id + '", ' +
        'rating: ' + rating + ', ' +
        'url: "' + url + '", ' +
        'type : "' + types + '", ' +
        'location: "' + location + '", ' +
        'photos: "' + photos + '" ' +
        '}) Return a',
      );

      resultPromise.then(result => {
        const records = result.records;
        var returnValue;
        records.forEach(function(element){
          var el = element.get(0);
          var photo;
          if(el.properties.photos){
            photo = "https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&key="+apiKey+"&photoreference=";
            photo += el.properties.photos;
          } else {
            photo = "http://51.75.122.187:3000/img/noPhoto.jpg";
          }

          var activity = {
            "id" : el.identity.low,
            "name" : el.properties.name,
            "address" : el.properties.address,
            "place_id" : el.properties.place_id,
            "url" : el.properties.url,
            "photos" : photo,
            "location" : el.properties.location,
            "type" : el.properties.type
          }
          if(el.properties.rating.low)
            activity.rating = el.properties.rating.low;
          else
            activity.rating = el.properties.rating;

          returnValue = activity;
        });

        resolve(returnValue);
      }).catch( error => {
        console.log(error);
        reject(error);
      });

    })
  },
  createIfDoNotExiste: function (activities, idCity) {
    return new Promise((resolve, reject) => {
      var returnValue = [];
      var sizeInput = activities.length;

      activities.forEach(el => {
        this.getByGoogleId(el)
        .then(results => {
          if(results){
            returnValue.push(results);
            if (returnValue.length == sizeInput)
               resolve(returnValue);
          }
          else {
            googleApi.getDetail(el)
            .then(activityDetail => {
              if(idCity != -1){
                this.create(activityDetail.address, activityDetail.name, activityDetail.place_id, activityDetail.rating, activityDetail.types, activityDetail.url, activityDetail.photos, idCity, activityDetail.location)
                .then(newActivity => {
                  returnValue.push(newActivity);
                  if (returnValue.length == sizeInput)
                     resolve(returnValue);
                })
                .catch(error => {
                  console.log("Error createIfDoNotExiste 4");
                  console.log(error);
                  reject(error);
                });
              } else {
                var tmpNewCity = activityDetail.city + " " + activityDetail.country;

                this.createWithoutCity(activityDetail.address, activityDetail.name, activityDetail.place_id, activityDetail.rating, activityDetail.types, activityDetail.url, activityDetail.photos, activityDetail.location)
                .then(newActivity => {
                  newActivity.city = tmpNewCity;
                  returnValue.push(newActivity);
                  if (returnValue.length == sizeInput)
                     resolve(returnValue);
                })
                .catch(error => {
                  console.log("Error createIfDoNotExiste 3");
                  console.log(error);
                  reject(error);
                });
              }


            })
            .catch(error => {
              console.log("Error createIfDoNotExiste 2");
              console.log(error);
              reject(error);
            });

          }
        })
        .catch(error => {
          console.log("Error createIfDoNotExiste 1");
          console.log(error);
          reject(error);
        });

      });

    })
  },
  getFromCityAndTag: function (idCity, idTag) {
    return new Promise((resolve, reject) => {
      const resultPromise = session.run(
        'Match (c:City)-[:HAS]->(a:Activity)-[:TYPE]->(t:Tag) WHERE ID(c)= ' +idCity+ ' AND ID(t)=' +idTag+ ' Return a',
      );

      resultPromise.then(result => {
        const records = result.records;
        var returnValue = [];
        records.forEach((element) => {
          var el = element.get(0);
          var photo;
          if(el.properties.photos){
            photo = "https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&key="+apiKey+"&photoreference=";
            photo += el.properties.photos;
          } else {
            photo = "http://51.75.122.187:3000/img/noPhoto.jpg";
          }

          var activity = {
            "id" : el.identity.low,
            "name" : el.properties.name,
            "address" : el.properties.address,
            "place_id" : el.properties.place_id,
            "rating" : el.properties.rating,
            "url" : el.properties.url,
            "photos" : photo,
            "location" : el.properties.location,
            "type" : el.properties.types
          }
          returnValue.push(activity);
        });

        resolve(returnValue);

      }).catch( error => {
        console.log(error);
        reject(error);
      });
    })
  },
  getFromCityAndTagWithEvent: function (idCity, idTag) {
    return new Promise((resolve, reject) => {
      const resultPromise = session.run(
        'Match (c:City)-[:HAS]->(a:Activity)-[:TYPE]->(t:Tag), (a)<-[:INSTANCE]-(:Event) WHERE ID(c)= ' +idCity+ ' AND ID(t)=' +idTag+ ' Return a',
      );

      resultPromise.then(result => {
        const records = result.records;
        var returnValue = [];
        records.forEach((element) => {
          var el = element.get(0);
          var photo;
          if(el.properties.photos){
            photo = "https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&key="+apiKey+"&photoreference=";
            photo += el.properties.photos;
          } else {
            photo = "http://51.75.122.187:3000/img/noPhoto.jpg";
          }

          var activity = {
            "id" : el.identity.low,
            "name" : el.properties.name,
            "address" : el.properties.address,
            "place_id" : el.properties.place_id,
            "rating" : el.properties.rating,
            "url" : el.properties.url,
            "photos" : photo,
            "location" : el.properties.location,
            "type" : el.properties.types
          }
          returnValue.push(activity);
        });
        resolve(returnValue);

      }).catch( error => {
        console.log(error);
        reject(error);
      });
    })
  },


};
