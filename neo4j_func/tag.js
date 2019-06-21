var session = require('../routes/databaseConnexion.js');
var googleApi = require('../routes/google_api.js');

module.exports = {
  getByName: function (name) {
    return new Promise((resolve, reject) => {
      const resultPromise = session.run(
        'Match (t:Tag {name : "' + name + '" }) Return t',
      );

      resultPromise.then(result => {
        const records = result.records;
        var returnValue;
        records.forEach((element) => {
          var el = element.get(0);
          var tag = {
            "id" : el.identity.low,
            "name" : el.properties.name
          }
          returnValue = tag;
        });

        resolve(returnValue);

      }).catch( error => {
        console.log(error);
        reject(error);
      });
    })
  },
  create: function (name) {
    return new Promise((resolve, reject) => {
      const resultPromise = session.run(
        'Create (t: Tag {' +
        'name: "' + name + '" ' +
        '}) Return t',
      );

      resultPromise.then(result => {
        const records = result.records;
        var returnValue;
        records.forEach(function(element){
          var el = element.get(0);
          var tag = {
            "id" : el.identity.low,
            "name" : el.properties.name
          }

          returnValue = tag;
        });

        resolve(returnValue);
      }).catch( error => {
        console.log(error);
        reject(error);
      });
    })
  },
  createIfDoNotExiste: function (name) {
    return new Promise((resolve, reject) => {
      this.getByName(name)
      .then(results => {
        if(results)
          resolve(results);
        else {
          this.create(name)
          .then(returnValue => {
            resolve(returnValue);
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
    })

  },
  createMultyTag: function (tags) {
    return new Promise((resolve, reject) => {
      var returnValue = [];
      var sizeInput = tags.length;
      tags.forEach((tag, key, arr) => {
        this.createIfDoNotExiste(tag)
        .then(el => {
          returnValue.push(el);
          if (returnValue.length == sizeInput)
            resolve(returnValue);
        })
      })
    })

  },
  createLink: function (idActivity, idTag) {
    return new Promise((resolve, reject) => {

      const resultPromiseCheck = session.run(
        'Match (a:Activity)-[l:TYPE]->(t:Tag) Where ID(t) = '+ idTag +' AND ID(a) = ' + idActivity + ' ' +
        'Return l',
      );

      resultPromiseCheck.then(resultCheck => {
        const recordsCheck = resultCheck.records.length;
        if(recordsCheck == 0){

          const resultPromise = session.run(
            'Match (t:Tag),(a:Activity) Where ID(t) = '+ idTag +' AND ID(a) = ' + idActivity + ' ' +
            'Create (a)-[:TYPE]->(t) Return t',
          );

          resultPromise.then(result => {
            const records = result.records;
            var returnValue;
            records.forEach((element) => {
              var el = element.get(0);
              var tag = {
                "id" : el.identity.low,
                "name" : el.properties.name
              }
              returnValue = tag;
            });

            resolve(returnValue);

          }).catch( error => {
            console.log(error);
            reject(error);
          });


        }
        resolve([]);

      }).catch( error => {
        console.log(error);
        reject(error);
      });

    })
  },
  getTags: function (id) {
    return new Promise((resolve, reject) => {
      const resultPromise = session.run(
        'MATCH (n:User)-[:LIKE]->(t:Tag) WHERE ID(n) = ' + id + ' RETURN t',
      );

      resultPromise.then(result => {
        const records = result.records;
        var returnValue = [];
        records.forEach((element) => {
          var el = element.get(0);
          var tag = {
            "id" : el.identity.low,
            "name" : el.properties.name,
          }
          returnValue.push(tag);
        });

        resolve(returnValue);

      }).catch( error => {
        console.log(error);
        reject(error);
      });
    })
  },
  createLinkUser: function (idUser, idTag) {
    return new Promise((resolve, reject) => {

      const resultPromise = session.run(
        'Match (u:User),(t:Tag) Where ID(u) = '+ idUser +' AND ID(t) = ' + idTag + ' ' +
        'Create (u)-[:LIKE]->(t) Return t',
      );

      resultPromise.then(result => {
        const records = result.records;
        var el = records[0].get(0);
        var tag = {
          "id" : el.identity.low,
          "name" : el.properties.name
        }
        resolve(tag);
      }).catch(error => {
        console.log(error);
        reject(error);
      });

    })
  },
  userSee: function (idUser, name) {
    return new Promise((resolve, reject) => {

      const resultPromise = session.run(
        'Match (u:User),(t:Tag {name : "' + name + '"}) Where ID(u) = '+ idUser +' ' +
        'Create (u)-[:SEE]->(t) Return t',
      );

      resultPromise.then(result => {
        const records = result.records;
        var el = records[0].get(0);
        var tag = {
          "id" : el.identity.low,
          "name" : el.properties.name
        }
        resolve(tag);
      }).catch(error => {
        console.log(error);
        reject(error);
      });

    })
  },
  getTagsOfActivity: function (id) {
    return new Promise((resolve, reject) => {
      const resultPromise = session.run(
        'MATCH (a:Activity)-[:TYPE]->(t:Tag) WHERE ID(a) = ' + id + ' RETURN t',
      );

      resultPromise.then(result => {
        const records = result.records;
        var returnValue = [];
        if(records.length > 0)
          records.forEach((element) => {
            var el = element.get(0);
            var tag = {
              "id" : el.identity.low,
              "name" : el.properties.name,
            }
            returnValue.push(tag);
          });

        resolve(returnValue);

      }).catch( error => {
        console.log(error);
        reject(error);
      });
    })
  },


};
