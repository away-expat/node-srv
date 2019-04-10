var express = require('express');
var router = express.Router();

// Extraire vers fichier conf
const neo4j = require('neo4j-driver').v1;
const user = "neo4j"
const password = "farfar"
const uri = "bolt://localhost:7687"

const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
const session = driver.session();


router.get('/getAllCities', function(req, res, next) {
  const resultPromise = session.run(
    'MATCH (c:City) RETURN c',
  );

  resultPromise.then(result => {
    session.close();

    const records = result.records;
    var returnValue = [];
    records.forEach(function(element){
      returnValue.push(element.get(0));
    });

    res.send(returnValue);

    driver.close();
  }).catch( error => {
    console.log(error);
  });
});

router.get('/getCityByName/:name', function(req, res, next) {
  let name = req.params.name;

  const resultPromise = session.run(
    'MATCH (c:City) WHERE c.name = "' + name + '" RETURN c',
  );

  resultPromise.then(result => {
    session.close();

    const records = result.records[0];
    var returnValue = [records.get(0)];

    res.send(returnValue);

    driver.close();
  }).catch( error => {
    console.log(error);
  });
});

module.exports = router;
