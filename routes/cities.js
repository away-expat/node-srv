var express = require('express');
var router = express.Router();
var session = require('./databaseConnexion.js');


router.get('/getAllCities', function(req, res, next) {
  const resultPromise = session.run(
    'Match (c:City) Return c',
  );

  resultPromise.then(result => {
    const records = result.records;
    var returnValue = [];
    records.forEach(function(element){
      returnValue.push(element.get(0).properties);
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

router.get('/getCityByNameWhithLink/:name/:link/:type', function(req, res, next) {
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

module.exports = router;
