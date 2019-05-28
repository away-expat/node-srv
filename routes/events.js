var express = require('express');
var router = express.Router();
var session = require('./databaseConnexion.js');

router.get('/getEvents', function(req, res, next) {
  const resultPromise = session.run(
    'MATCH (n :Event)-[:INSTANCE]->(a :Activity) RETURN n,a',
  );

  resultPromise.then(result => {
    const records = result.records;
    var returnValue = [];
    records.forEach(function(element){
      var el = element.get(0);
      var activity = element.get(1);
      var event = {
        "id" : el.identity.low,
        "date" : el.properties.date,
        "description" : el.properties.description,
        "activityName" : activity.properties.name,
        "activityId" : activity.identity.low,
      }
      returnValue.push(event);
    });

    res.send(returnValue);
  }).catch( error => {
    console.log(error);
  });
});

router.get('/getEvent/:id', function(req, res, next) {
    let id = req.params.id
  const resultPromise = session.run(
    'Match (e: Event)-[:INSTANCE]->(a:Activity) Where ID(e) = ' + id + '  Return e,a'
  );

  resultPromise.then(result => {
    const records = result.records;
    var returnValue = [];
    records.forEach(function(element){
      var el = element.get(0);
      var activity = element.get(1);
      var event = {
        "id" : el.identity.low,
        "date" : el.properties.date,
        "description" : el.properties.description,
        "activityName" : activity.properties.name,
        "activityId" : activity.identity.low,
      }
      returnValue = event;
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
    'MATCH (e:Event)-[:INSTANCE]->(a :Activity),(u:User) ' +
    'WHERE ID(e) = ' + idEvent + ' AND ID(u) = ' + idUser + ' ' +
    'CREATE (u)-[r:TAKEPART]->(e) ' +
    'RETURN e,a'
  );

  resultPromise.then(result => {
    const records = result.records;
    var returnValue;
    records.forEach(function(element){
      var el = element.get(0);
      var activity = element.get(1);
      var event = {
        "id" : el.identity.low,
        "date" : el.properties.date,
        "description" : el.properties.description,
        "activityName" : activity.properties.name,
        "activityId" : activity.identity.low,
      }
      returnValue = event;
    });

    res.send(returnValue);

  }).catch( error => {
    console.log(error);
  });
});

router.post('/postEvent', function(req, res, next) {
  let idActivity = req.body.idActivity;
  let idUser = req.body.idUser;
  let date = req.body.date;
  let description = req.body.description;

  const resultPromise = session.run(
    'MATCH (u:User), (a:Activity)'+
    'WHERE ID(u) = ' + idUser + ' AND ID(a) = ' + idActivity + ' ' +
    'CREATE (u)-[:CREATE]->(n :Event {date:"' + date + '", ' +
    'description:"' + description + '"})-[:INSTANCE]->(a)'+
    'RETURN n,a',
  );

  resultPromise.then(result => {
    const records = result.records;
    var returnValue;
    records.forEach(function(element){
      var el = element.get(0);
      var activity = element.get(1);
      var event = {
        "id" : el.identity.low,
        "date" : el.properties.date,
        "description" : el.properties.description,
        "activityName" : activity.properties.name,
        "activityId" : activity.identity.low,
      }
      returnValue = event;
    });

    res.send(returnValue);

  }).catch( error => {
    console.log(error);
  });
});

router.delete('/deleteParticipationAtEvent', function(req, res, next) {
  let idEvent = req.body.idEvent;
  let idUser = req.body.idUser;

  const resultPromise = session.run(
    'MATCH (u:User)-[r:TAKEPART]->(e:Event)-[:INSTANCE]->(a :Activity)' +
    'WHERE ID(e) = ' + idEvent + ' AND ID(u) = ' + idUser + ' ' +
    'DELETE r ' +
    'RETURN e,a'
  );

  resultPromise.then(result => {
    const records = result.records;
    var returnValue;
    records.forEach(function(element){
      var el = element.get(0);
      var activity = element.get(1);
      var event = {
        "id" : el.identity.low,
        "date" : el.properties.date,
        "description" : el.properties.description,
        "activityName" : activity.properties.name,
        "activityId" : activity.identity.low,
      }
      returnValue = event;
    });

    res.send(returnValue);

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
      var el = element.get(0);
      var event = {
        "id" : el.identity.low,
        "date" : el.properties.date,
        "description" : el.properties.description
      }
      returnValue.push(event);
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
