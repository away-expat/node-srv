var express = require('express');
var router = express.Router();
var session = require('./databaseConnexion.js');

router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/getFollowByUser/:id', function(req, res, next) {
  let id = req.params.id;

  const resultPromise = session.run(
    'MATCH (u:User) -[l:FOLLOW]-> (otherNode:User) WHERE ID(u) = ' + id + ' RETURN u,l,otherNode',
  );

  resultPromise.then(result => {
    const sizeOfNodeLinked = result.records.length;
    var returnValue = [];
    returnValue.push(result.records[0]._fields[0].properties);
    for(var i = 0; i < sizeOfNodeLinked; i++){
      returnValue.push(result.records[i]._fields[2].properties);
    }

    res.send(returnValue);
  }).catch( error => {
    console.log(error);
  });
});

router.post('/postFollowUser', function(req, res, next) {
  let id = req.body.id;
  let idfollow = req.body.idfollow;

  const resultPromise = session.run(
    'MATCH (u:User),(f:User) ' +
    'WHERE ID(u) = ' + id + ' AND ID(f) = ' + idfollow + ' ' +
    'CREATE (u)-[l:FOLLOW]->(f)' +
    'RETURN u,f,l'
  );

  resultPromise.then(result => {
    const sizeOfNodeLinked = result.records.length;
    var returnValue = [];
    returnValue.push(result.records[0]._fields[0].properties);
    for(var i = 0; i < sizeOfNodeLinked; i++){
      returnValue.push(result.records[i]._fields[2].properties);
    }

    res.send(returnValue);
  }).catch( error => {
    console.log(error);
  });
});

router.delete('/deleteFollowUser/', function(req, res, next) {
  let id = req.body.id;
  let idfollow = req.body.idfollow;

  const resultPromise = session.run(
    'MATCH (u:User)-[r:FOLLOW]->(f:User) ' +
    'WHERE ID(u) = ' + id + ' AND ID(f) = ' + idfollow + ' ' +
    'DELETE r'
  );

  resultPromise.then(result => {
    res.send(result);
  }).catch( error => {
    console.log(error);
  });
});








module.exports = router;
