var express = require('express');
var router = express.Router();
var session = require('./databaseConnexion.js');

router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/getFollowByUser/:id', function(req, res, next) {
  let id = req.params.id;

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
    console.log(error);
  });
});

router.post('/postFollowUser', function(req, res, next) {
  let id = req.body.id;
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
    console.log(error);
  });
});

router.delete('/deleteFollowUser/', function(req, res, next) {
  let id = req.body.id;
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
    console.log(error);
  });
});








module.exports = router;
