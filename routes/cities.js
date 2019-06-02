var express = require('express');
var router = express.Router();
var session = require('./databaseConnexion.js');


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
        "country" : el.properties.country
      }
      returnValue.push(city);
    });

    res.send(returnValue);
  }).catch( error => {
    console.log(error);
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
        "country" : el.properties.country
      }

      returnValue = city;
    });

    res.send(returnValue);
  }).catch( error => {
    console.log(error);
  });
});

router.get('/getCityByName/:name', function(req, res, next) {
  let name = req.params.name;

  const resultPromise = session.run(
    'Match (c:City {name:"' + name + '"}) Return c',
  );

  resultPromise.then(result => {
    const records = result.records[0];
    var returnValue = [records.get(0)];

    res.send(returnValue);
  }).catch( error => {
    console.log(error);
  });
});

/*
router.get('/getCityByNameAndTag/:name/:idTag', function(req, res, next) {
  let name = req.params.name;
  let idTag = req.params.idTag;


  const resultPromise = session.run(
    'Match (c:City {name:"' + name + '"})-[l:HAS]->(otherNode) Return c,l,otherNode',
  );

  resultPromise.then(result => {
    const sizeOfNodeLinked = result.records.length;
    var returnValue = [];
    returnValue.push(result.records[0]._fields[0].properties);
    for(var i = 0; i < sizeOfNodeLinked; i++){
      returnValue.push(result.records[i]._fields[2].properties);
      //console.log(returnValue[i]);
    }

    res.send(returnValue);
  }).catch( error => {
    console.log(error);
  });
});

router.get('/get/:name/:link/:type', function(req, res, next) {
  let name = req.params.name;
  let link = req.params.link;
  let type = req.params.type;

  const resultPromise = session.run(
    'Match (c:City {name:"' + name + '"})-[l:' + link + ' {type: "' + type + '"}]->(otherNode) Return c,l,otherNode',
  );

  resultPromise.then(result => {
    const sizeOfNodeLinked = result.records.length;
    var returnValue = [];
    returnValue.push(result.records[0]._fields[0].properties);
    for(var i = 0; i < sizeOfNodeLinked; i++){
      returnValue.push(result.records[i]._fields[2].properties);
      //console.log(returnValue[i]);
    }

    res.send(returnValue);
  }).catch( error => {
    console.log(error);
  });
});
*/

module.exports = router;
