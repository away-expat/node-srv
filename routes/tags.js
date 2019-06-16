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
    console.log('Error : ' + error);
    res.status(500).send('Error : ' + error);
  });
});




module.exports = router;
