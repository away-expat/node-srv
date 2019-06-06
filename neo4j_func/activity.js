var session = require('../routes/databaseConnexion.js');
var googleApi = require('../routes/google_api.js');
var neo4jTag = require('./tag.js');

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
          var activity = {
            "id" : el.identity.low,
            "name" : el.properties.name,
            "address" : el.properties.address,
            "place_id" : el.properties.place_id,
            "rating" : el.properties.rating,
            "url" : el.properties.url,
            "photos" : el.properties.photos,
            "type" : el.properties.types
          }
          returnValue = activity;
        });

        resolve(returnValue);

      }).catch( error => {
        console.log(error);
        reject(error);
      });
    })
  },
  create: function (adress, name, place_id, rating = -1, types, url, photos, idCity) {
    return new Promise((resolve, reject) => {
      const resultPromise = session.run(
        'Match (c:City) ' +
        'WHERE ID(c)= ' + idCity + ' ' +
        'Create (a:Activity {' +
        'address: "' + adress + '", ' +
        'name: "' + name + '", ' +
        'place_id: "' + place_id + '", ' +
        'rating: ' + rating + ', ' +
        'url: "' + url + '", ' +
        'type : "' + types + '", ' +
        'photos: "' + photos + '" ' +
        '})<-[:HAS]-(c) Return a',
      );

      resultPromise.then(result => {
        const records = result.records;
        var returnValue;
        records.forEach(function(element){
          var el = element.get(0);
          var activity = {
            "id" : el.identity.low,
            "name" : el.properties.name,
            "address" : el.properties.address,
            "place_id" : el.properties.place_id,
            "rating" : el.properties.rating,
            "url" : el.properties.url,
            "photos" : el.properties.photos,
            "type" : el.properties.type
          }
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
              this.create(activityDetail.address, activityDetail.name, activityDetail.place_id, activityDetail.rating, activityDetail.types, activityDetail.url, activityDetail.photos, idCity)
              .then(newActivity => {
                returnValue.push(newActivity);
                if (returnValue.length == sizeInput)
                   resolve(returnValue);
              })
              .catch(error => {
                console.log(error);
                reject(error);
              });

            })
            .catch(error => {
              console.log(error);
              reject(error);
            });

          }
        })
        .catch(error => {
          console.log(error);
          reject(error);
        });

      });

    })
  },

};