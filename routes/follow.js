var express = require('express');
var router = express.Router();
var session = require('./databaseConnexion.js');
var neo4jUser = require('../neo4j_func/user.js');

// Auth User
var currentUser;
router.use(function (req, res, next) {
  var token = req.headers['authorization'];
  neo4jUser.findOneByTkn(token)
  .then(user => {
    if(user){
      currentUser = user;
      next();
    }
    else {
      console.log("Erreur d'authentification !");
      res.status(401).send("Erreur d'authentification !");
    }
  })
  .catch( error => {
    console.log('Error : ' + error);
    res.status(500).send('Error : ' + error);
  });
});

router.get('/', function(req, res, next) {
  let id = currentUser.id;

  const resultPromise = session.run(
    'MATCH (u:User) -[l:FOLLOW]-> (otherNode:User) WHERE ID(u) = ' + id + ' RETURN otherNode',
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
    console.log('Error : ' + error);
    res.status(500).send('Error : ' + error);
  });
});

router.post('/', function(req, res, next) {
  let id = currentUser.id;
  let idfollow = req.body.idfollow;

  const resultPromise = session.run(
    'MATCH (u:User),(f:User) ' +
    'WHERE ID(u) = ' + id + ' AND ID(f) = ' + idfollow + ' ' +
    'CREATE (u)-[l:FOLLOW]->(f)' +
    'RETURN f'
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
    console.log('Error : ' + error);
    res.status(500).send('Error : ' + error);
  });
});

router.delete('/', function(req, res, next) {
  let id = currentUser.id;
  let idfollow = req.body.idfollow;

  const resultPromise = session.run(
    'MATCH (u:User)-[r:FOLLOW]->(f:User) ' +
    'WHERE ID(u) = ' + id + ' AND ID(f) = ' + idfollow + ' ' +
    'DELETE r ' +
    'RETURN f'
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
    console.log('Error : ' + error);
    res.status(500).send('Error : ' + error);
  });
});

module.exports = router;
