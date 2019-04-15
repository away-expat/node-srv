var express = require('express');
var router = express.Router();
var session = require('./databaseConnexion.js');

router.post('/createUser', function(req, res, next) {
  var firstname = req.body.firstname;
  var lastname = req.body.lastname;
  var age = req.body.age;
  var mail = req.body.mail;

  var nameNode = firstname+lastname;

  const resultPromise = session.run(
    'CREATE (' + nameNode + ':User {firstname:"' + firstname + '", lastname:"' + lastname + '", age: ' + age + ', mail:"' + mail + '"})',
  );

  resultPromise.then(result => {
    const records = result.records;
    var returnValue = [];
    records.forEach(function(element){
      returnValue.push(element.get(0));
    });
    var returnValue = [];



    res.send(returnValue);
  }).catch( error => {
    console.log(error);
  });
});

/*
  Delete link
MATCH (n { name: 'Andy' })-[r:KNOWS]->()
DELETE r

  Create link
MATCH (a:City),(b:Activity)
WHERE a.name = 'Tokyo' AND b.name = 'Kintaro'
CREATE (a)-[l:HAS]->(b)
RETURN a,b,l

  Return Node with link ans node linked
// Match(c:City {name:'Tokyo'})-[l:HAS]->(other) return c,l,other

*/




module.exports = router;
