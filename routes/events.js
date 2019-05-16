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

router.get('/getEvent/:id', function(req, res, next) {
    let id = req.params.id
  const resultPromise = session.run(
    'MATCH (n :Event) WHERE ID(n) = ' + id + ' RETURN n',
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

router.post('/createEvent', function(req, res, next) {
  let idActivity = req.body.idActivity;
  let description = req.body.description;
  let date = req.body.date;

  const resultPromise = session.run(
    'CREATE (n :Event {' +
    'description: "' + description + '", ' +
    'date: "' + date + '"}) ' +
    'RETURN n'
  );

  resultPromise.then(result => {
    const records = result.records;
    var returnValue = [];
    records.forEach(function(element){
      returnValue.push(element.get(0));
    });
    let idEvent = returnValue[0].identity.low;

    const resultPromiseForLink = session.run(
      'MATCH (a:Event),(b:Activity) ' +
      'WHERE ID(a) = ' + idEvent + ' AND ID(b) = ' + idActivity + ' ' +
      'CREATE (b)-[r:INSTANCE]->(a),  (a)-[t:OF]->(b)' +
      'RETURN type(r)'
    );

    resultPromiseForLink.then(result => {
      console.log(result);
      //returnValue.push(element.get(0));
    }).catch( error => {
      console.log(error);
    });



    res.send(returnValue);
  }).catch( error => {
    console.log(error);
  });
});





module.exports = router;
