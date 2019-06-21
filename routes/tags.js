var express = require('express');
var router = express.Router();
var session = require('./databaseConnexion.js');
var neo4jUser = require('../neo4j_func/user.js');

router.get('/', function(req, res, next) {
  const resultPromise = session.run(
    'MATCH (n :Tag) RETURN n',
  );

  resultPromise.then(result => {
    const records = result.records;
    var returnValue = [];
    records.forEach(function(element){
      var el = element.get(0);
      var tag = {
        "id" : el.identity.low,
        "name" : el.properties.name,
      }
      returnValue.push(tag);
    });

    res.send(returnValue);
  }).catch( error => {
    console.log(error);
  });
});

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

router.get('/ofUser', function(req, res, next) {
  var id = currentUser.id;
  const resultPromise = session.run(
    'MATCH (n :Tag)<-[:LIKE]-(u:User) Where ID(u) = ' + id + ' RETURN n',
  );

  resultPromise.then(result => {
    const records = result.records;
    var returnValue = [];
    records.forEach(function(element){
      var el = element.get(0);
      var tag = {
        "id" : el.identity.low,
        "name" : el.properties.name,
      }
      returnValue.push(tag);
    });

    res.send(returnValue);
  }).catch( error => {
    console.log(error);
  });
});

router.get('/autocompleteNameTag/:name', function(req, res, next) {
  var name = req.params.name;
  const resultPromise = session.run(
    'MATCH (n :Tag) Where toLower(n.name) Contains toLower("' + name + '") RETURN n',
  );

  resultPromise.then(result => {
    const records = result.records;
    var returnValue = [];
    records.forEach(function(element){
      var el = element.get(0);
      var tag = {
        "id" : el.identity.low,
        "name" : el.properties.name,
      }
      returnValue.push(tag);
    });

    res.send(returnValue);
  }).catch( error => {
    console.log(error);
  });
});

router.post('/', function(req, res, next) {
  let name = req.body.name;

  const resultPromise = session.run(
    'CREATE (n :Tag {name: "' + name + '"}) RETURN n'
  );

  resultPromise.then(result => {
    const records = result.records;
    var returnValue;
    records.forEach(function(element){
      var el = element.get(0);
      var tag = {
        "id" : el.identity.low,
        "name" : el.properties.name,
      }
      returnValue = tag;
    });

    res.send(returnValue);
  }).catch( error => {
    console.log('Error : ' + error);
    res.status(500).send('Error : ' + error);
  });
});

router.post('/like/:id', function(req, res, next) {
  let idTag = req.params.id;
  let idUser = currentUser.id;

  const resultPromiseCheck = session.run(
    'Match (u:User)-[l:LIKE]->(t:Tag) Where ID(u) = ' + idUser + ' And ID(t) = ' + idTag + ' Return l'
  );

  resultPromiseCheck.then(resultCheck => {
    const recordsCheck = resultCheck.records.length;
    if(recordsCheck > 0){
      res.send("Already Existe");
    } else {
      const resultPromise = session.run(
        'Match (u:User),(t:Tag) Where ID(u) = ' + idUser + ' And ID(t) = ' + idTag +
        ' Create (u)-[:LIKE]->(t) Return t'
      );

      resultPromise.then(result => {
        const records =  result.records[0].get(0);
        var tag = {
          "id" : records.identity.low,
          "name" : records.properties.name,
        }
        res.send(tag);

      }).catch( error => {
        console.log('Error : ' + error);
        res.status(500).send('Error : ' + error);
      });
    }
  }).catch( error => {
    console.log('Error : ' + error);
    res.status(500).send('Error : ' + error);
  });
});

router.delete('/dislike/:id', function(req, res, next) {
  let idTag = req.params.id;
  let idUser = currentUser.id;

  const resultPromise = session.run(
    'Match (u:User)-[l:LIKE]->(t:Tag) Where ID(u) = ' + idUser + ' And ID(t) = ' + idTag + ' Delete l'
  );

  resultPromise.then(result => {
    console.log(result);
    res.send(result.records);
  }).catch( error => {
    console.log('Error : ' + error);
    res.status(500).send('Error : ' + error);
  });
});


module.exports = router;
