var express = require('express');
var router = express.Router();
var session = require('./databaseConnexion.js');
var googleApi = require('./google_api.js');
var neo4jFunc = require('../neo4j_func/cities.js');
var neo4jUser = require('../neo4j_func/user.js');

router.get('/autoCompleteCityName/:name', function(req, res, next) {
  var name = req.params.name;
  neo4jFunc.autocompleteNameCity(name)
  .then(results => {
    res.send(results);
  })
  .catch(error => {
    console.log('Error : ' + error);
    res.status(500).send('Error : ' + error);
  });
});

router.get('/getCityByName/:name', function(req, res, next) {
  let name = req.params.name;

  googleApi.getByName(name)
  .then(cityByGoogle => {
    neo4jFunc.createIfDoNotExiste(cityByGoogle)
    .then(cityNeo => {
      res.send(cityNeo);
    })
    .catch( error => {
      console.log('Error : ' + error);
      res.status(500).send('Error : ' + error);
    });
  })
  .catch( error => {
    console.log('Error : ' + error);
    res.status(500).send('Error : ' + error);
  });
});

router.get('/suggestion', function(req, res, next) {
  const resultPromise = session.run(
    'Match (c:City)<-[l:AT]-(:User) ' +
    'With c, count(l) as popularity ' +
    'Return c Order By popularity Limit 10',
  );

  resultPromise.then(result => {
    const records = result.records;
    var returnValue = [];
    records.forEach(function(element){
      var el = element.get(0);
      var countryCode = "https://www.countryflags.io/" + el.properties.countryCode + "/shiny/64.png";
      var city = {
        "id" : el.identity.low,
        "name" : el.properties.name,
        "country" : el.properties.country,
        "place_id" : el.properties.place_id,
        "location" : el.properties.location,
        "countryCode" : countryCode
      }

      returnValue.push(city);
    });

    res.send(returnValue);
  }).catch( error => {
    console.log('Error : ' + error);
    res.status(500).send('Error : ' + error);
  });
});

router.get('/allCountry', function(req, res, next) {
  const resultPromise = session.run(
    'Match (c:City) Return c Order By c.name',
  );

  resultPromise.then(result => {
    const records = result.records;
    var returnValue = [];

    records.forEach(function(element){
      var el = element.get(0);
      var country = el.properties.country;
      if(returnValue.indexOf(country) == -1 && country != "undefined")
        returnValue.push(country);
    });

    res.send(returnValue);
  }).catch( error => {
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
      var countryCode = "https://www.countryflags.io/" + el.properties.countryCode + "/shiny/64.png";
      var city = {
        "id" : el.identity.low,
        "name" : el.properties.name,
        "country" : el.properties.country,
        "place_id" : el.properties.place_id,
        "location" : el.properties.location,
        "countryCode" : countryCode
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
      var countryCode = "https://www.countryflags.io/" + el.properties.countryCode + "/shiny/64.png";
      var city = {
        "id" : el.identity.low,
        "name" : el.properties.name,
        "country" : el.properties.country,
        "place_id" : el.properties.place_id,
        "location" : el.properties.location,
        "countryCode" : countryCode
      }

      returnValue = city;
    });

    res.send(returnValue);
  }).catch( error => {
    console.log('Error : ' + error);
    res.status(500).send('Error : ' + error);
  });
});



/*
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
});*/


module.exports = router;
