var express = require('express');
var router = express.Router();
var session = require('./databaseConnexion.js');

router.post('/createAccount', function(req, res, next) {
  var firstname = req.body.firstname;
  var lastname = req.body.lastname;
  var age = req.body.age;
  var mail = req.body.mail;
  var country =  req.body.country;

  const resultPromise = session.run(
    'CREATE (n :User {firstname:"' + firstname + '", ' +
    'lastname:"' + lastname + '", ' +
    'age: ' + age + ', ' +
    'mail:"' + mail + '", ' +
    'country:"' + country + '"})'+
    'RETURN n',
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

router.put('/updateAccount', function(req, res, next) {
  var id = req.body.id;
  var firstname = req.body.firstname;
  var lastname = req.body.lastname;
  var age = req.body.age;
  var mail = req.body.mail;

  const resultPromise = session.run(
    'MATCH (n :User)' +
    'WHERE ID(n) = ' + id + ' ' +
    'SET n.firstname = "' + firstname + '", ' +
    'n.lastname = "' + lastname + '", ' +
    'n.age = ' + age + ', ' +
    'n.mail = "' + mail +  '"' +
    'RETURN n',
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

router.put('/updateUserCountry', function(req, res, next) {
  var country = req.body.country;
  var id = req.body.id;

  const resultPromise = session.run(
    'MATCH (n :User) WHERE ID(n) = ' + id + ' SET n.country = "' + country + '" RETURN n',
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

router.delete('/deleteAccount', function(req, res, next) {
  var id = req.body.id;
  const resultPromise = session.run(
    'MATCH (n :User) WHERE ID(n) = ' + id + ' SET n.firstname = "", n.lastname = "", n.age = 0, n.country = "", n.mail = "" RETURN n'
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

router.get('/getAll', function(req, res, next) {
  const resultPromise = session.run(
    'MATCH (n :User) RETURN n',
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

/*
MATCH (n { name: 'Andy' })
SET n.surname = 'Taylor'
RETURN n.name, n.surname
*/

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
