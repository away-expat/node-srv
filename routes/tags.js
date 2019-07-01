var express = require('express');
var router = express.Router();
var session = require('./databaseConnexion.js');
var neo4jUser = require('../neo4j_func/user.js');

function sweetName(name){
  name = name.charAt(0).toUpperCase() + name.slice(1);
  while(name.indexOf('_') != -1)
    name = name.replace('_', ' ');
  return name;
}

router.get('/', function(req, res, next) {
  const resultPromise = session.run(
    'MATCH (n :Tag) RETURN n Order By n.name',
  );

  resultPromise.then(result => {
    const records = result.records;
    var returnValue = [];
    records.forEach(function(element){
      var el = element.get(0);
      var name = sweetName(el.properties.name);
      var tag = {
        "id" : el.identity.low,
        "name" : name
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

router.get('/ofUser/:id', function(req, res, next) {
  var id = req.params.id;
  const resultPromise = session.run(
    'MATCH (n :Tag)<-[:LIKE]-(u:User) Where ID(u) = ' + id + ' RETURN n Order By n.name',
  );

  resultPromise.then(result => {
    const records = result.records;
    var returnValue = [];
    records.forEach(function(element){
      var el = element.get(0);
      var name = sweetName(el.properties.name);
      var tag = {
        "id" : el.identity.low,
        "name" : name
      }
      returnValue.push(tag);
    });

    res.send(returnValue);
  }).catch( error => {
    console.log(error);
  });
});

router.get('/suggestion', function(req, res, next) {
  var id = currentUser.id;
  const resultPromise = session.run(
    'MATCH (n :Tag)<-[l:SEE]-(u:User) ' +
    'With u,n, count(l) as see ' +
    'Where ID(u) = ' + id +
    ' And Not (n)<-[:LIKE]-(u) ' +
    ' And see >= 3 ' +
    'RETURN n Order By n.name',
  );

  resultPromise.then(result => {
    const records = result.records;
    var returnValue = [];
    records.forEach(function(element){
      var el = element.get(0);
      var name = sweetName(el.properties.name);
      var tag = {
        "id" : el.identity.low,
        "name" : name
      }
      returnValue.push(tag);
    });

    res.send(returnValue);
  }).catch( error => {
    console.log(error);
  });
});

router.get('/recherche/:name', function(req, res, next) {
  var name = req.params.name;
  const resultPromise = session.run(
    'MATCH (n :Tag) Where toLower(n.name) Contains toLower("' + name + '") RETURN n Order By n.name',
  );

  resultPromise.then(result => {
    const records = result.records;
    var returnValue = [];
    records.forEach(function(element){
      var el = element.get(0);
      var name = sweetName(el.properties.name);
      var tag = {
        "id" : el.identity.low,
        "name" : name
      }
      returnValue.push(tag);
    });

    res.send(returnValue);
  }).catch( error => {
    console.log(error);
  });
});

/*
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
      var name = sweetName(el.properties.name);
      var tag = {
        "id" : el.identity.low,
        "name" : name
      }
      returnValue = tag;
    });

    res.send(returnValue);
  }).catch( error => {
    console.log('Error : ' + error);
    res.status(500).send('Error : ' + error);
  });
});
*/

router.post('/like/:id', function(req, res, next) {
  let idTag = req.params.id;
  let idUser = currentUser.id;

  const resultPromiseCheck = session.run(
    'Match (u:User)-[l:LIKE]->(t:Tag) Where ID(u) = ' + idUser + ' And ID(t) = ' + idTag + ' Return l,t'
  );

  resultPromiseCheck.then(resultCheck => {
    const recordsCheck = resultCheck.records.length;
    if(recordsCheck > 0){
      const records =  resultCheck.records[0].get(1);
      var name = sweetName(records.properties.name);
      var tag = {
        "id" : records.identity.low,
        "name" : name
      }
      res.send(tag);
    } else {
      const resultPromise = session.run(
        'Match (u:User),(t:Tag) Where ID(u) = ' + idUser + ' And ID(t) = ' + idTag +
        ' Create (u)-[:LIKE]->(t) Return t'
      );

      resultPromise.then(result => {
        const records = result.records[0].get(0);
        //console.log(result.records);
        var name = sweetName(records.properties.name);
        var tag = {
          "id" : records.identity.low,
          "name" : name
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
    'Match (u:User)-[l]->(t:Tag) Where ID(u) = ' + idUser + ' And ID(t) = ' + idTag + ' Delete l'
  );

  resultPromise.then(result => {
    res.send(result.records);
  }).catch( error => {
    console.log('Error : ' + error);
    res.status(500).send('Error : ' + error);
  });
});

// suggestion tag

module.exports = router;
