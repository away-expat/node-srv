var express = require('express');
var router = express.Router();
var session = require('./databaseConnexion.js');

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

router.post('/', function(req, res, next) {
  let name = req.body.name;
  console.log(name);

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
    console.log(error);
  });
});




module.exports = router;
