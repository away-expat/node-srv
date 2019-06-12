var session = require('../routes/databaseConnexion.js');
const random128Hex = require('../core/random128').random128Hex;
const jwt = require('jwt-simple');

module.exports = {
  findOne: function (email) {
    return new Promise((resolve, reject) => {
      const resultPromise = session.run(
        'MATCH (n :User {mail: "' + email + '"}) RETURN n',
      );

      resultPromise.then(result => {
        const records = result.records;
        var returnValue;
        records.forEach((element) => {
          var el = element.get(0);
          var user = {
            "id" : el.identity.low,
            "firstname" : el.properties.firstname,
            "lastname" : el.properties.lastname,
            "mail" : el.properties.mail,
            "country" : el.properties.country,
            "birth" : el.properties.birth,
            "password" : el.properties.password,
            "token" :  el.properties.token
          }
          returnValue = user;
        });

        resolve(returnValue);

      }).catch( error => {
        console.log(error);
        reject(error);
      });
    })
  },
  findOneByTkn: function (tkn) {
    return new Promise((resolve, reject) => {
      const resultPromise = session.run(
        'MATCH (n :User {token: "' + tkn + '"})-[:AT]->(c :City) RETURN n,c',
      );

      resultPromise.then(result => {
        const records = result.records;
        var returnValue;
        records.forEach((element) => {
          var el = element.get(0);
          var c = element.get(1);
          var city = {
            "id" : c.identity.low,
            "name" : c.properties.name,
            "country" : c.properties.country,
            "place_id" : c.properties.place_id,
            "location" : c.properties.location
          }
          var user = {
            "id" : el.identity.low,
            "firstname" : el.properties.firstname,
            "lastname" : el.properties.lastname,
            "mail" : el.properties.mail,
            "country" : el.properties.country,
            "birth" : el.properties.birth,
            "token" :  el.properties.token
          }
          user.at = city;
          returnValue = user;
        });

        resolve(returnValue);

      }).catch( error => {
        console.log(error);
        reject(error);
      });
    })
  },
  createGoogleConnexion: function (firstname, lastname, mail) {
    return new Promise((resolve, reject) => {
      var pwd = "GoogleConnexion";
      const token = jwt.encode({mail, pwd}, random128Hex())

      const resultPromise = session.run(
        'CREATE (n :User {firstname:"' + firstname + '", ' +
        'lastname:"' + lastname + '", ' +
        'mail:"' + mail + '", ' +
        'token:"' + token + '" }) '+
        'RETURN n',
      );

      resultPromise.then(result => {
        const records = result.records;
        var returnValue = [];
        records.forEach(function(element){
          var el = element.get(0);
          var user = {
            "id" : el.identity.low,
            "firstname" : el.properties.firstname,
            "lastname" : el.properties.lastname,
            "mail" : el.properties.mail,
            "token" : el.properties.token,
          }
          returnValue = user;
        });

        resolve(returnValue);
      }).catch( error => {
        console.log(error);
        reject(error);
      });
    })
  },
};
