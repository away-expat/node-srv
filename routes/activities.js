var express = require('express');
var router = express.Router();
var session = require('./databaseConnexion.js');


router.get('/getActivities', function(req, res, next) {
  const resultPromise = session.run(
    'Match (a:Activity) Return a',
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

router.get('/getActivity/:id', function(req, res, next) {
  let id = req.params.id;
  const resultPromise = session.run(
    'MATCH (a:Activity) WHERE ID(a) = ' + id + ' RETURN a',
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


module.exports = router;
