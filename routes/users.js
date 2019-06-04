var express = require('express');
var router = express.Router();
var session = require('./databaseConnexion.js');

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
        "age" : el.properties.age.low,
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
        "age" : el.properties.age.low,
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
  var age = req.body.age;
  var mail = req.body.mail;
  var country =  req.body.country;
  var password = req.body.password;

  const resultPromise = session.run(
    'CREATE (n :User {firstname:"' + firstname + '", ' +
    'lastname:"' + lastname + '", ' +
    'age: ' + age + ', ' +
    'mail:"' + mail + '", ' +
    'password:"' + password + '", ' +
    'country:"' + country + '"})'+
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
        "age" : el.properties.age.low,
      }
      returnValue = user;
    });

    res.send(returnValue);
  }).catch( error => {
    console.log(error);
  });
});

router.put('/', function(req, res, next) {
  var id = req.body.id;
  var firstname = req.body.firstname;
  var lastname = req.body.lastname;
  var age = req.body.age;
  var mail = req.body.mail;
  var country = req.body.country;

  const resultPromise = session.run(
    'MATCH (n :User)' +
    'WHERE ID(n) = ' + id + ' ' +
    'SET n.firstname = "' + firstname + '", ' +
    'n.lastname = "' + lastname + '", ' +
    'n.age = ' + age + ', ' +
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
    'MATCH (n :User) WHERE ID(n) = ' + id + ' SET n.firstname = "", n.lastname = "", n.age = 0, n.country = "", n.mail = "" RETURN n'
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
        "age" : el.properties.age.low,
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


/*
MATCH (n { name: 'Andy' })
SET n.surname = 'Taylor'
RETURN n.name, n.surname
*/

/*
  Delete link
MATCH (n { name: 'Andy' })-[r:KNOWS]->()
DELETE r

  Create link
MATCH (a:City),(b:Activity)
WHERE a.name = 'Tokyo' AND b.name = 'Kintaro'
CREATE (a)-[l:HAS]->(b)
RETURN a,b,l

  Return Node with link ans node linked
// Match(c:City {name:'Tokyo'})-[l:HAS]->(other) return c,l,other

*/




module.exports = router;
