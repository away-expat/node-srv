var express = require('express');
var router = express.Router();
var session = require('./databaseConnexion.js');
const random128Hex = require('../core/random128').random128Hex;
const jwt = require('jwt-simple');

router.get('/', function(req, res, next) {
  const resultPromise = session.run(
    'MATCH (n :User) RETURN n',
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
        "country" : el.properties.country,
        "birth" : el.properties.birth,
      }
      returnValue.push(user);
    });

    res.send(returnValue);
  }).catch( error => {
    console.log(error);
  });
});

router.get('/:id', function(req, res, next) {
  let id = req.params.id
  const resultPromise = session.run(
    'MATCH (n :User) WHERE ID(n) = ' + id + ' RETURN n',
  );

  resultPromise.then(result => {
    const records = result.records;
    var returnValue;
    records.forEach(function(element){
      var el = element.get(0);
      var user = {
        "id" : el.identity.low,
        "firstname" : el.properties.firstname,
        "lastname" : el.properties.lastname,
        "mail" : el.properties.mail,
        "country" : el.properties.country,
        "birth" : el.properties.birth,
        "token" :  el.properties.token
      }
      returnValue = user;
    });

    res.send(returnValue);
  }).catch( error => {
    console.log(error);
  });
});

router.post('/', function(req, res, next) {
  var firstname = req.body.firstname;
  var lastname = req.body.lastname;
  var birth = req.body.birth;
  var mail = req.body.mail;
  var country =  req.body.country;
  var password = req.body.password;
  const token = jwt.encode({mail, password}, random128Hex())

  const checkExistancePromise = session.run(
    'Match (n :User {' +
    'mail:"' + mail + '" })'+
    'RETURN n',
  );

  checkExistancePromise.then(resul => {
    const rec = resul.records;
    if(rec.length > 0)
      res.status(422).send("Email address already used !");
    else {
      const resultPromise = session.run(
        'CREATE (n :User {firstname:"' + firstname + '", ' +
        'lastname:"' + lastname + '", ' +
        'birth: "' + birth + '", ' +
        'mail:"' + mail + '", ' +
        'password:"' + password + '", ' +
        'token:"' + token + '", ' +
        'country:"' + country + '"}) '+
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
            "country" : el.properties.country,
            "birth" : el.properties.birth,
            "token" : el.properties.token,
          }
          returnValue = user;
        });

        res.send(returnValue);
      }).catch( error => {
        console.log(error);
        res.status(500).send(error);
      });
    }

  })
  .catch(err => {
    console.log(err);
    res.status(500).send(err);
  })

});

router.put('/', function(req, res, next) {
  var id = req.body.id;
  var firstname = req.body.firstname;
  var lastname = req.body.lastname;
  var birth = req.body.birth;
  var mail = req.body.mail;
  var country = req.body.country;

  const resultPromise = session.run(
    'MATCH (n :User)' +
    'WHERE ID(n) = ' + id + ' ' +
    'SET n.firstname = "' + firstname + '", ' +
    'n.lastname = "' + lastname + '", ' +
    'n.birth = "' + birth + '", ' +
    'n.country = ' + country + ', ' +
    'n.mail = "' + mail +  '"' +
    'RETURN n',
  );

  resultPromise.then(result => {
    const records = result.records;
    var returnValue = [];
    records.forEach(function(element){
      returnValue.push(element.get(0));
    });

    res.send(returnValue);
  }).catch( error => {
    console.log(error);
  });
});

router.delete('/', function(req, res, next) {
  var id = req.body.id;
  const resultPromise = session.run(
    'MATCH (n :User) WHERE ID(n) = ' + id + ' SET n.firstname = "", n.lastname = "", n.birth = "", n.country = "", n.mail = "" RETURN n'
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
        "country" : el.properties.country,
        "birth" : el.properties.birth,
      }
      returnValue = user;
    });

    res.send(returnValue);
  }).catch( error => {
    console.log(error);
  });
});

router.put('/updateUserCity', function(req, res, next) {
  var idCity = req.body.idCity;
  var id = req.body.id;

  const resultPromise = session.run(
    'MATCH (n :User)-[l:FROM]->(c),(newCity:City) WHERE ID(n) = ' + id + ' AND ID(newCity) = ' + idCity + ' DELETE l '+
    'CREATE (n)-[:FROM]->(newCity) ' +
    'RETURN newCity',
  );

  resultPromise.then(result => {
    const records = result.records;
    var returnValue = [];
    records.forEach(function(element){
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

    res.send(returnValue);
  }).catch( error => {
    console.log(error);
  });
});


module.exports = router;
