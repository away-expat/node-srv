var express = require('express');
var router = express.Router();
var session = require('./databaseConnexion.js');
var apiKey = 
var neo4jUser = require('../neo4j_func/user.js');
var neo4jEvent = require('../neo4j_func/event.js');
var neo4jTag = require('../neo4j_func/tag.js');
var dateFormat = require('dateformat');

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

router.get('/', function(req, res, next) {
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
        "title" : el.properties.title,
        "date" : el.properties.date,
        "hour" : el.properties.hour,
        "description" : el.properties.description,
        "activityName" : activity.properties.name,
        "activityId" : activity.identity.low,
      }
      returnValue.push(event);
    });

    res.send(returnValue);
  }).catch( error => {
    console.log('Error : ' + error);
    res.status(500).send('Error : ' + error);
  });
});

router.get('/:id', function(req, res, next) {
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
        "title" : el.properties.title,
        "date" : el.properties.date,
        "hour" : el.properties.hour,
        "description" : el.properties.description,
        "activityName" : activity.properties.name,
        "activityId" : activity.identity.low,
      }
      returnValue = event;
    });

    res.send(returnValue);
  }).catch( error => {
    console.log('Error : ' + error);
    res.status(500).send('Error : ' + error);
  });
});

router.post('/', function(req, res, next) {
  let idActivity = req.body.idActivity;
  let idUser = currentUser.id;
  let date = req.body.date;
  let description = req.body.description;
  let title = req.body.title;
  let hour = req.body.hour;

  const resultPromise = session.run(
    'MATCH (u:User), (a:Activity) '+
    'WHERE ID(u) = ' + idUser + ' AND ID(a) = ' + idActivity + ' ' +
    'CREATE (u)-[:CREATE]->(n :Event {title: "' + title + '", date:"' + date + '", hour:"' + hour + '", ' +
    'description:"' + description + '"})-[:INSTANCE]->(a)'+
    'RETURN n,a',
  );

  resultPromise.then(result => {
    const records = result.records;
    var returnValue;
    records.forEach(function(element){
      var el = element.get(0);
      var activity = element.get(1);
      var evenement = {
        "id" : el.identity.low,
        "title" : el.properties.title,
        "date" : el.properties.date,
        "hour" : el.properties.hour,
        "description" : el.properties.description,
        "activityName" : activity.properties.name,
        "activityId" : activity.identity.low,
      }
      returnValue = evenement;
    });

    res.send(returnValue);

  })
  .catch( error => {
    console.log('Error : ' + error);
    res.status(500).send('Error : ' + error);
  });
});

router.get('/getEventWithDetails/:id', function(req, res, next) {
  let id = req.params.id
  const resultPromise = session.run(
    'Match (u:User)-[:CREATE]->(e: Event)-[:INSTANCE]->(a:Activity) Where ID(e) = ' + id + '  Return u,e,a'
  );

  resultPromise.then(result => {
    const records = result.records;
    console.log(records);
    var returnValue = {};
    var u = records[0].get(0);
    var user = {
      "id" : u.identity.low,
      "firstname" : u.properties.firstname,
      "lastname" : u.properties.lastname,
    }

    var e = records[0].get(1);
    var event = {
      "id" : e.identity.low,
      "title" : e.properties.title,
      "date" : e.properties.date,
      "hour" : el.properties.hour,
      "description" : e.properties.description
    };

    var a = records[0].get(2);
    var photo = "https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&key="+apiKey+"&photoreference=";
    photo += a.properties.photos;
    var activity = {
      "id" : a.identity.low,
      "name" : a.properties.name,
      "address" : a.properties.address,
      "place_id" : a.properties.place_id,
      "url" : a.properties.url,
      "photos" : photo,
      "type" : a.properties.type
    }
    if(a.properties.rating.low)
      activity.rating = a.properties.rating.low;
    else
      activity.rating = a.properties.rating;

    returnValue.creator = user;
    returnValue.event = event;
    returnValue.activity = activity;
    returnValue.participant = [];

    neo4jTag.getTagsOfActivity(activity.id)
    .then(tagResult => {
      returnValue.tag = tagResult;
      const resultPromiseUser = session.run(
        'Match (u:User)-[:TAKEPART]->(e: Event) Where ID(e) = ' + id + '  Return u'
      );

      resultPromiseUser.then(users => {
        const usersArray = users.records;
        usersArray.forEach(function(element){
          var el = element.get(0);
          var user = {
            "id" : el.identity.low,
            "firstname" : el.properties.firstname,
            "lastname" : el.properties.lastname,
          }
          returnValue.participant.push(user);
        });
      })
      .catch( error => {
        console.log('Error 3: ' + error);
        res.status(500).send('Error 3: ' + error);
      });

      neo4jEvent.userSeeEvent(currentUser.id, id)
      .then()
      .catch( error => {
        console.log('See Error 2.1: ' + error);
      });

      res.send(returnValue);
    })
    .catch( error => {
      console.log('Error 2: ' + error);
      res.status(500).send('Error 2: ' + error);
    });

  })
  .catch( error => {
    console.log('Error 1: ' + error);
    res.status(500).send('Error 1: ' + error);
  });
});

router.get('/getEventsByActivity/:id', function(req, res, next) {
  let id = req.params.id;
  var day = dateFormat(new Date(), "yyyy-mm-dd");
  const resultPromise = session.run(
    'MATCH (e: Event)-[:INSTANCE]->(a:Activity) WHERE ID(a) = ' + id + ' AND e.date >= "' + day + '" RETURN e ORDER BY e.date',
  );

  resultPromise.then(result => {
    const records = result.records;
    var returnValue = [];
    records.forEach(function(element){
      var el = element.get(0);
      var event = {
        "id" : el.identity.low,
        "title" : el.properties.title,
        "date" : el.properties.date,
        "hour" : el.properties.hour,
        "description" : el.properties.description
      }
      returnValue.push(event);
    });

    res.send(returnValue);
  }).catch( error => {
    console.log('Error : ' + error);
    res.status(500).send('Error : ' + error);
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
      var el = element.get(0);
      var user = {
        "id" : el.identity.low,
        "firstname" : el.properties.firstname,
        "lastname" : el.properties.lastname,
        "country" : el.properties.country
      }
      returnValue.push(user);
    });
    res.send(returnValue);
  }).catch( error => {
    console.log('Error : ' + error);
    res.status(500).send('Error : ' + error);
  });
});

router.post('/postParticipateAtEvent', function(req, res, next) {
  let idEvent = req.body.idEvent;
  let idUser = currentUser.id;

  neo4jEvent.canIChangeMyMind(idEvent)
  .then(results => {
    if(results){
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
            "title" : el.properties.title,
            "date" : el.properties.date,
            "hour" : el.properties.hour,
            "description" : el.properties.description,
            "activityName" : activity.properties.name,
            "activityId" : activity.identity.low,
          }
          returnValue = event;
        });

        res.send(returnValue);

      }).catch( error => {
        console.log('Error : ' + error);
        res.status(500).send('Error : ' + error);
      });
    } else {
      console.log("La date est dépassée, vous ne pouvez modifier votre participation à l'evenement");
      res.status(403).send("La date est dépassée, vous ne pouvez modifier votre participation à l'evenement");
    }

  })
  .catch(error => {
    console.log('Error : ' + error);
    res.status(500).send('Error : ' + error);
  });


});

router.delete('/deleteParticipationAtEvent', function(req, res, next) {
  let idEvent = req.body.idEvent;
  let idUser = currentUser.id;


  neo4jEvent.canIChangeMyMind(idEvent)
  .then(results => {
    if(results){
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
            "title" : el.properties.title,
            "date" : el.properties.date,
            "hour" : el.properties.hour,
            "description" : el.properties.description,
            "activityName" : activity.properties.name,
            "activityId" : activity.identity.low,
          }
          returnValue = event;
        });

        res.send(returnValue);

      }).catch( error => {
        console.log('Error : ' + error);
        res.status(500).send('Error : ' + error);
      });
    } else {
      console.log("La date est dépassée, vous ne pouvez modifier votre participation à l'evenement");
      res.status(403).send("La date est dépassée, vous ne pouvez modifier votre participation à l'evenement");
    }

  })
  .catch(error => {
    console.log('Error : ' + error);
    res.status(500).send('Error : ' + error);
  });
});

router.delete('/', function(req, res, next) {
  let idEvent = req.body.idEvent;
  let idUser = currentUser.id;

  const resultPromise = session.run(
    'MATCH (e:Event)<-[:CREATE]-(u:User)' +
    'WHERE ID(e) = ' + idEvent + ' AND ID(u) = ' + idUser + ' ' +
    'DETACH DELETE e '
  );

  resultPromise.then(result => {
    const records = result.summary;
    res.send([]);

  }).catch( error => {
    console.log('Error : ' + error);
    res.status(500).send('Error : ' + error);
  });
});



module.exports = router;
