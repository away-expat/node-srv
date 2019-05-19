var express = require('express');
var router = express.Router();
var session = require('./databaseConnexion.js');

router.get('/getEvents', function(req, res, next) {
  const resultPromise = session.run(
    'MATCH (n :Event) RETURN n',
  );

  resultPromise.then(result => {
    const records = result.records;
    var returnValue = [];
    records.forEach(function(element){
      returnValue.push(element.get(0));
    });

    res.send(returnValue);
  }).catch( error => {
    console.log(error);
  });
});

// Simple
router.get('/getEvent/:id', function(req, res, next) {
    let id = req.params.id
  const resultPromise = session.run(
    'Match (e: Event)-[:INSTANCE]->(a:Activity) Where ID(e) = ' + id + '  Return e,a'
  );

  resultPromise.then(result => {
    const records = result.records;
    console.log(records);
    //console.log(records[0]._fields);
    var returnValue = [];
    records.forEach(function(element){
      returnValue.push(element.get(0));
    });

    res.send(returnValue);
  }).catch( error => {
    console.log(error);
  });
});

router.get('/getEventWithDetails/:id', function(req, res, next) {
    let id = req.params.id
  const resultPromise = session.run(
    'Match (e: Event)-[:INSTANCE]->(a:Activity)-[:TYPE]->(t:Tag), (e)<-[:TAKEPART]-(u:User) Where ID(e) = ' + id + '  Return e,a,t,u'
  );

  resultPromise.then(result => {
    const records = result.records;
    console.log(records);
    //console.log(records[0]._fields);
    var returnValue = [];
    records.forEach(function(element){
      returnValue.push(element.get(0));
    });

    res.send(returnValue);
  }).catch( error => {
    console.log(error);
  });
});

router.post('/postParticipateAtEvent', function(req, res, next) {
  let idEvent = req.body.idEvent;
  let idUser = req.body.idUser;

  const resultPromise = session.run(
    'MATCH (e:Event),(u:User) ' +
    'WHERE ID(e) = ' + idEvent + ' AND ID(u) = ' + idUser + ' ' +
    'CREATE (u)-[r:TAKEPART]->(e) ' +
    'RETURN u,e,r'
  );

  resultPromise.then(result => {
    const records = result.records;
    var returnValue = [];
    records.forEach(function(element){
      returnValue.push(element.get(0));
    });

    res.send(records);

  }).catch( error => {
    console.log(error);
  });
});

router.delete('/deleteParticipationAtEvent', function(req, res, next) {
  let idEvent = req.body.idEvent;
  let idUser = req.body.idUser;

  const resultPromise = session.run(
    'MATCH (u:User)-[r:TAKEPART]->(e:Event) ' +
    'WHERE ID(e) = ' + idEvent + ' AND ID(u) = ' + idUser + ' ' +
    'DELETE r ' +
    'RETURN u'
  );

  resultPromise.then(result => {
    const records = result.records;
    var returnValue = [];
    records.forEach(function(element){
      returnValue.push(element.get(0));
    });

    res.send(result);

  }).catch( error => {
    console.log(error);
  });
});

router.get('/getEventsByActivity/:id', function(req, res, next) {
  let id = req.params.id;
  const resultPromise = session.run(
    'MATCH (e: Event)-[:INSTANCE]->(a:Activity) WHERE ID(a) = ' + id + ' RETURN e',
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

router.get('/getAttendeesByEvent/:id', function(req, res, next) {
  let id = req.params.id;
  const resultPromise = session.run(
    'MATCH (u: User)-[:TAKEPART]->(e:Event) WHERE ID(e) = ' + id + ' RETURN u',
  );

  resultPromise.then(result => {
    const records = result.records;
    console.log(records);
    var returnValue = [];
    records.forEach(function(element){
      returnValue.push(element.get(0).properties);
    });

    res.send(returnValue);
  }).catch( error => {
    console.log(error);
  });
});





module.exports = router;
