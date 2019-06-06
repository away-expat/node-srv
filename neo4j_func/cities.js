var session = require('../routes/databaseConnexion.js');

module.exports = {
  getByGoogleId: function (id) {
    return new Promise((resolve, reject) => {
      const resultPromise = session.run(
        'Match (c:City {place_id : "' + id + '" }) Return c',
      );
      resultPromise.then(result => {
        const records = result.records;
        var returnValue;
        records.forEach((element) => {
          var el = element.get(0);
          var city = {
            "id" : el.identity.low,
            "name" : el.properties.name,
            "country" : el.properties.country,
            "place_id" : el.properties.place_id,
            "location" : el.properties.location
          }
          returnValue = city;
        });

        resolve(returnValue);
      }).catch( error => {
        console.log(error);
        reject(error);
      });
    })
  },
  create: function (name, country, place_id, location) {
    return new Promise((resolve, reject) => {
      const resultPromise = session.run(
        'Create (c:City {' +
        'name: "' + name + '", ' +
        'country: "' + country + '", ' +
        'place_id: "' + place_id + '", ' +
        'location: "' + location + '" ' +
        '}) Return c',
      );

      resultPromise.then(result => {
        const records = result.records;
        var returnValue;
        records.forEach(function(element){
          var el = element.get(0);
          var city = {
            "id" : el.identity.low,
            "name" : el.properties.name,
            "country" : el.properties.country,
            "place_id" : el.properties.place_id,
            "location" : el.properties.location,
          }

          returnValue = city;
        });

        resolve(returnValue);
      }).catch( error => {
        console.log(error);
        reject(error);
      });
    })
  },
  createIfDoNotExiste: function (city) {
    return new Promise((resolve, reject) => {
      this.getByGoogleId(city.place_id)
      .then(res => {
        if(res)
          resolve(res);
        else {
          this.create(city.name, city.country, city.place_id, city.location)
          .then(result => {
            resolve(result);
          }).catch(error => {
            console.log(error);
            reject(error);
          });
        }
      }).catch(error => {
        console.log(error);
        reject(error);
      });



    })
  },





};
