var express = require('express');
var router = express.Router();
var session = require('./databaseConnexion.js');
var neo4jFunc = require('../neo4j_func/cities.js');

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
  const resultPromise = session.run(
    'Match (c:City) Return c',
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
      returnValue.push(city);
    });

    res.send(returnValue);
  }).catch( error => {
    console.log('Error : ' + error);
    res.status(500).send('Error : ' + error);
  });
});

router.get('/:id', function(req, res, next) {
  let id = req.params.id;
  const resultPromise = session.run(
    'Match (c:City) Where ID(c) = ' + id + ' Return c',
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
        "location" : el.properties.location
      }

      returnValue = city;
    });

    res.send(returnValue);
  }).catch( error => {
    console.log('Error : ' + error);
    res.status(500).send('Error : ' + error);
  });
});

router.get('/google/:id', function(req, res, next) {
  let id = req.params.id;

  neo4jFunc.getByGoogleId(id)
  .then((result) => {
    res.send(result);
    console.log(result);
  }).catch( error => {
    console.log('Error : ' + error);
    res.status(500).send('Error : ' + error);
  });
});

router.get('/getCityByName/:name', function(req, res, next) {
  let name = req.params.name;

  const resultPromise = session.run(
    'Match (c:City) where lower(n.Name) contains lower('+name+') Return c',
  );

  resultPromise.then(result => {
    const records = result.records[0];
    var returnValue = [records.get(0)];

    res.send(returnValue);
  }).catch( error => {
    console.log('Error : ' + error);
    res.status(500).send('Error : ' + error);
  });
});

router.post('/', function(req, res, next) {
  let name = req.body.name;
  let country = req.body.country;
  let place_id = req.body.place_id;
  let location = req.body.location;

  neo4jFunc.create(name, country, place_id, location)
  .then((result) => {
    res.send(result);
  }).catch( error => {
    console.log('Error : ' + error);
    res.status(500).send('Error : ' + error);
  });

});

module.exports = router;
