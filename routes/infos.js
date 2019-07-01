var express = require('express');
var router = express.Router();
var session = require('./databaseConnexion.js');
var googleApi = require('./google_api.js');
var neo4jFunc = require('../neo4j_func/cities.js');
var neo4jUser = require('../neo4j_func/user.js');

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

router.get('/byCountry/:country', function(req, res, next) {
  var country = req.params.country;

  const resultPromise = session.run(
    'MATCH (n:Info {country: "' + country + '"}) RETURN n',
  );

  resultPromise.then(result => {
    const records = result.records;
    var returnValue = [];
    records.forEach(function(element){
      var el = element.get(0);
      var info = {
        "id" : el.identity.low,
        "title" : el.properties.title,
        "content" : el.properties.content,
      }
      returnValue.push(info);
    });

    res.send(returnValue);
  }).catch( error => {
    console.log(error);
  });
});

router.get('/', function(req, res, next) {
  var country = currentUser.at.country;

  const resultPromise = session.run(
    'MATCH (n:Info {country: "' + country + '"}) RETURN n',
  );

  resultPromise.then(result => {
    const records = result.records;
    var returnValue = [];
    records.forEach(function(element){
      var el = element.get(0);
      var info = {
        "id" : el.identity.low,
        "title" : el.properties.title,
        "content" : el.properties.content,
      }
      returnValue.push(info);
    });

    res.send(returnValue);
  }).catch( error => {
    console.log(error);
  });
});

router.get('/:id', function(req, res, next) {
  var id = req.params.id;

  const resultPromise = session.run(
    'MATCH (n:Info) Where ID(n)= ' + id + ' RETURN n',
  );

  resultPromise.then(result => {
    const records = result.records[0].get(0);
    var info = {
      "id" : records.identity.low,
      "title" : records.properties.title,
      "content" : records.properties.content,
    }

    res.send(info);
  }).catch( error => {
    console.log(error);
  });
});

router.post('/', function(req, res, next) {
  if(currentUser.mail == "away@gmail.com"){
    var title = req.body.title;
    var content = req.body.content;
    var country = req.body.country;

    const resultPromise = session.run(
      'CREATE (n:Info {title: "' + title + '", ' +
      'content: "' + content + '", ' +
      'country: "' + country + '" ' +
      '}) RETURN n'
    );

    resultPromise.then(result => {
      const records = result.records;
      var el = records[0].get(0);
      var info = {
        "id" : el.identity.low,
        "title" : title,
        "content" : content,
        "country" : country
      }

      res.send(info);
    }).catch( error => {
      console.log('Error : ' + error);
      res.status(500).send('Error : ' + error);
    });
  } else {
    console.log("Erreur d'authentification !");
    res.status(401).send("Erreur d'authentification !");
  }

});

router.put('/', function(req, res, next) {
  if(currentUser.mail == "away@gmail.com"){
    var id = req.body.id;
    var title = req.body.title;
    var content = req.body.content;

    const resultPromise = session.run(
      'Match (n:Info) Where ID(n) = ' + id + ' ' +
      'Set n.title = "' + title + '", ' +
      'n.content = "' + content + '" ' +
      'RETURN n'
    );

    resultPromise.then(result => {
      const records = result.records;
      var el = records[0].get(0);
      var info = {
        "id" : el.identity.low,
        "title" : el.properties.title,
        "content" : el.properties.content,
        "country" : el.properties.country
      }

      res.send(info);
    }).catch( error => {
      console.log('Error : ' + error);
      res.status(500).send('Error : ' + error);
    });
  } else {
    console.log("Erreur d'authentification !");
    res.status(401).send("Erreur d'authentification !");
  }

});

router.delete('/:id', function(req, res, next) {
  if(currentUser.mail == "away@gmail.com"){
    var id = req.params.id;

    const resultPromise = session.run(
      'Match (n:Info) Where ID(n) = ' + id + ' Delete n',
    );

    resultPromise.then(result => {
      res.send([]);
    }).catch( error => {
      console.log('Error : ' + error);
      res.status(500).send('Error : ' + error);
    });
  } else {
    console.log("Erreur d'authentification !");
    res.status(401).send("Erreur d'authentification !");
  }

});


module.exports = router;
