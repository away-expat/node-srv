var express = require('express');
var router = express.Router();
var session = require('./databaseConnexion.js');


router.get('/getActivities', function(req, res, next) {
  const resultPromise = session.run(
    'Match (a:Activity) Return a',
  );

  resultPromise.then(result => {
    const records = result.records;
    var returnValue = [];
    records.forEach(function(element){
      var el = element.get(0);
      var activity = {
        "id" : el.identity.low,
        "name" : el.properties.name,
        "type" : el.properties.type,
        "address" : el.properties.address
      }
      returnValue.push(activity);
    });

    res.send(returnValue);
  }).catch( error => {
    console.log(error);
  });
});

router.get('/getActivity/:id', function(req, res, next) {
  let id = req.params.id;
  const resultPromise = session.run(
    'MATCH (a:Activity) WHERE ID(a) = ' + id + ' RETURN a',
  );

  resultPromise.then(result => {
    const records = result.records;
    var returnValue;
    records.forEach(function(element){
      var el = element.get(0);
      var activity = {
        "id" : el.identity.low,
        "name" : el.properties.name,
        "type" : el.properties.type,
        "address" : el.properties.address
      }
      returnValue = activity;
    });

    res.send(returnValue);
  }).catch( error => {
    console.log(error);
  });
});

router.get('/getActivitiesByCountry/:id', function(req, res, next) {
  let id = req.params.id;
  const resultPromise = session.run(
    'MATCH (c: City)-[:HAS]->(a:Activity) WHERE ID(c) = ' + id + ' RETURN a',
  );

  resultPromise.then(result => {
    const records = result.records;
    var returnValue = [];
    records.forEach(function(element){
      var el = element.get(0);
      var activity = {
        "id" : el.identity.low,
        "name" : el.properties.name,
        "type" : el.properties.type,
        "address" : el.properties.address
      }
      returnValue.push(activity);
    });

    res.send(returnValue);
  }).catch( error => {
    console.log(error);
  });
});


module.exports = router;
