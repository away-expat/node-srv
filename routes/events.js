var express = require('express');
var router = express.Router();
var session = require('./databaseConnexion.js');

router.get('/getAll', function(req, res, next) {
  const resultPromise = session.run(
    'MATCH (n :Tag) RETURN n',
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





module.exports = router;
