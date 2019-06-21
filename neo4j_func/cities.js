var session = require('../routes/databaseConnexion.js');
var googleApi = require('../routes/google_api.js');

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
            "location" : el.properties.location,
            "countryCode" : el.properties.countryCode,
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
  getByNeoId: function (id) {
    return new Promise((resolve, reject) => {
      const resultPromise = session.run(
        'Match (c:City) Where ID(c) = ' + id + ' Return c',
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
            "location" : el.properties.location,
            "countryCode" : el.properties.countryCode,
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
  create: function (name, country, place_id, location, countryCode) {
    return new Promise((resolve, reject) => {
      const resultPromise = session.run(
        'Create (c:City {' +
        'name: "' + name + '", ' +
        'country: "' + country + '", ' +
        'place_id: "' + place_id + '", ' +
        'location: "' + location + '", ' +
        'countryCode: "' + countryCode + '" ' +
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
            "countryCode" : el.properties.countryCode,
          }

          returnValue = city;
        });

        resolve(returnValue);
      })
      .catch( error => {
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
          this.create(city.name, city.country, city.place_id, city.location, city.countryCode)
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
  createMultyCity: function (citys) {
    return new Promise((resolve, reject) => {
      var returnValue = [];
      var sizeInput = citys.length;
      citys.forEach((city, key, arr) => {
        googleApi.getByName(city)
        .then(resultGoogleCity => {
          this.createIfDoNotExiste(resultGoogleCity)
          .then(el => {
            returnValue.push(el);
            if (returnValue.length == sizeInput)
              resolve(returnValue);
          })
          .catch( error => {
            console.log(error);
            reject(error);
          });
        })
        .catch( error => {
          console.log(error);
          reject(error);
        });
      })
    })

  },
  createLink: function (idActivity, idCity) {
    return new Promise((resolve, reject) => {

      const resultPromise = session.run(
        'Match (c:City),(a:Activity) Where ID(c) = '+ idCity +' AND ID(a) = ' + idActivity + ' ' +
        'Create (c)-[:HAS]->(a) Return c',
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
            "location" : el.properties.location,
            "countryCode" : el.properties.countryCode,
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
  createLinkUser: function (idUser, idCity) {
    return new Promise((resolve, reject) => {

      const resultPromise = session.run(
        'Match (u:User),(c:City) Where ID(u) = '+ idUser +' AND ID(c) = ' + idCity + ' ' +
        'Create (u)-[:AT]->(c) Return c',
      );

      resultPromise.then(result => {
        const records = result.records;
        var el = records[0].get(0);
        var city = {
          "id" : el.identity.low,
          "name" : el.properties.name,
          "country" : el.properties.country,
          "place_id" : el.properties.place_id,
          "location" : el.properties.location,
          "countryCode" : el.properties.countryCode,
        }
        resolve(city);
      })
      .catch(error => {
        console.log(error);
        reject(error);
      });

    })
  },
  autocompleteNameCity: function(name) {
    return new Promise((resolve, reject) => {
      googleApi.rechNameCity(name)
      .then(resultPrediction => {
        var length = resultPrediction.length;
        var resultArray = []
        resultPrediction.forEach(el => {

          googleApi.getByName(el)
          .then(reusltDetail => {

            this.createIfDoNotExiste(reusltDetail)
            .then(city => {
              resultArray.push(city);
              if(resultArray.length == length)
                resolve(resultArray);
            })
            .catch((error) => {
              console.log(error);
              reject(error);
            });
          })
          .catch((error) => {
            console.log(error);
            reject(error);
          });
        })

      })
      .catch((error) => {
        console.log(error);
        reject(error);
      });
    });
  }






};
