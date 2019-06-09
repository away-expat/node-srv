var express = require('express');
var router = express.Router();
var session = require('./databaseConnexion.js');
var googleApi = require('./google_api.js');
var neo4jCity = require('../neo4j_func/cities.js');
var neo4jActivity = require('../neo4j_func/activity.js');
var neo4jTag = require('../neo4j_func/tag.js');

router.get('/googleByCity/:city/:option?', function(req, res, next) {
  var city = req.params.city;
  var option = req.params.option;
  var returnValue = [];

  if (!option)
    option = '';

  googleApi.getByName(city)
  .then(result => {
    var cityFromGoogle = result;

    neo4jCity.createIfDoNotExiste(cityFromGoogle)
    .then(reslt => {

      googleApi.getNear(reslt.location, option)
      .then(resultActivity => {

        neo4jActivity.createIfDoNotExiste(resultActivity, reslt.id)
        .then(activityArray => {

          var tagArray = [];
          activityArray.forEach(activity => {
            if(activity.type){
              activity.type = activity.type.split(',');
              activity.type.forEach(tag => {
                if(tagArray.indexOf(tag) == -1)
                  tagArray.push(tag);
              })
            }
          })
          neo4jTag.createMultyTag(tagArray)
          .then(tagResult => {
            activityArray.forEach(activity => {
              if(activity.type)
                tagResult.forEach(tag => {
                  if(activity.type.indexOf(tag.name) != -1){

                    neo4jTag.createLink(activity.id, tag.id)
                    .catch( error => {
                      console.log(error);
                      reject(error);
                    });
                  }
                })
            })

          })


          res.send(activityArray);

        }).catch(error => {
          res.status(500).send(error);
          console.log(error);
        });
      })
      .catch(error => {
        res.status(500).send(error);
        console.log(error);
      });
    }).catch(error => {
      res.status(500).send(error);
      console.log(error);
    });
  }).catch(error => {
    res.status(500).send(error);
    console.log(error);
  });

});

router.get('/googleByLocation/:location/:option?', function(req, res, next) {
  var location = req.params.location;
  var option = req.params.option;
  var returnValue = [];

  if (!option)
    option = '';

  googleApi.getNear(location, option)
  .then(resultActivity => {

    neo4jActivity.createIfDoNotExiste(resultActivity, -1)
    .then(activityArray => {
      var tagArray = [];
      var cityArray = [];

      activityArray.forEach(activity => {
        if(activity.type){
          activity.type = activity.type.split(',');
          activity.type.forEach(tag => {
            if(tagArray.indexOf(tag) == -1)
              tagArray.push(tag);
          })
        }
        if(cityArray.indexOf(activity.city) == -1)
          cityArray.push(activity.city);
      })

      neo4jTag.createMultyTag(tagArray)
      .then(tagResult => {
        activityArray.forEach(activity => {
          if(activity.type)
            tagResult.forEach(tag => {
              if(activity.type.indexOf(tag.name) != -1){

                neo4jTag.createLink(activity.id, tag.id)
                .catch( error => {
                  console.log(error);
                  reject(error);
                });
              }
            })
        })
      })
      .catch(error => {
        res.status(500).send(error);
        console.log(error);
      });

      neo4jCity.createMultyCity(cityArray)
      .then(cityResult => {
        activityArray.forEach(activity => {
          cityResult.forEach(city => {
            tmpCity = city.name + " " + city.country;
            if(activity.city == tmpCity){
              neo4jCity.createLink(activity.id, city.id)
              .catch( error => {
                console.log(error);
                reject(error);
              });
            }
          })
        })

      })
      .catch(error => {
        res.status(500).send(error);
        console.log(error);
      });

      res.send(activityArray);

    })
    .catch(error => {
      res.status(500).send(error);
      console.log(error);
    });
  })
  .catch(error => {
    res.status(500).send(error);
    console.log(error);
  });

});

router.get('/testGoogleDetail/:tkn', function(req, res, next) {
  var tkn = req.params.tkn;

  googleApi.getDetail(tkn)
  .then(result => {
    console.log(result);
    res.send(result)
  }).catch(error => {
    res.status(500).send(error);
    console.log(error);
  });

});

router.get('/testGoogleNameCity/:city', function(req, res, next) {
  var city = req.params.city;

  googleApi.getByName(city)
  .then(result => {
    var cityFromGoogle = result;

    res.send(result)
  }).catch(error => {
    res.status(500).send(error);
    console.log(error);
  });

});

router.get('/photo/:ref', function(req, res, next) {
  var ref = req.params.ref;

  googleApi.getPhotoPlaces(ref,100,100);
  res.send([]);
  /*
  .then(result => {

    res.send(result)
  }).catch(error => {
    res.status(500).send(error);
    console.log(error);
  });*/

});

router.get('/', function(req, res, next) {
  const resultPromise = session.run(
    'Match (a:Activity) Return a',
  );

  resultPromise.then(result => {
    const records = result.records;
    var returnValue = [];
    records.forEach(function(element){
      var el = element.get(0);
      var activity = {
        "id" : el.identity.low,
        "name" : el.properties.name,
        "address" : el.properties.address,
        "place_id" : el.properties.place_id,
        "rating" : el.properties.rating,
        "url" : el.properties.url,
        "photos" : el.properties.photos,
        "type" : el.properties.type
      }
      returnValue = activity;
    });

    res.send(returnValue);
  }).catch( error => {
    console.log(error);
  });
});

router.get('/:id', function(req, res, next) {
  let id = req.params.id;
  const resultPromise = session.run(
    'MATCH (a:Activity) WHERE ID(a) = ' + id + ' RETURN a',
  );

  resultPromise.then(result => {
    const records = result.records;
    var returnValue;
    records.forEach(function(element){
      var el = element.get(0);
      var activity = {
        "id" : el.identity.low,
        "name" : el.properties.name,
        "address" : el.properties.address,
        "place_id" : el.properties.place_id,
        "rating" : el.properties.rating,
        "url" : el.properties.url,
        "photos" : el.properties.photos,
        "type" : el.properties.type
      }
      returnValue = activity;
    });

    res.send(returnValue);
  }).catch( error => {
    console.log(error);
  });
});
/*
router.post('/', function(req, res, next) {
  var name = req.body.name;
  var address = req.body.address;
  var name = req.body.name;

  neo4jCity.(adress, name, place_id, rating, types, url, photos, idCity).then(res => {

      var activity = {
        "id" : el.identity.low,
        "name" : el.properties.name,
        "address" : el.properties.address,
        "place_id" : el.properties.place_id,
        "rating" : el.properties.rating,
        "url" : el.properties.url,
        "photos" : el.properties.photos,
        "type" : el.properties.type
      }

    res.send([]);
  }).catch( error => {
    console.log(error);
  });

  res.send([]);
});*/

router.get('/ByCity/:id', function(req, res, next) {
  let id = req.params.id;
  const resultPromise = session.run(
    'MATCH (c: City)-[:HAS]->(a:Activity) WHERE ID(c) = ' + id + ' RETURN a',
  );

  resultPromise.then(result => {
    const records = result.records;
    var returnValue = [];
    records.forEach(function(element){
      var el = element.get(0);
      var activity = {
        "id" : el.identity.low,
        "name" : el.properties.name,
        "type" : el.properties.type,
        "address" : el.properties.address
      }
      returnValue.push(activity);
    });

    res.send(returnValue);
  }).catch( error => {
    console.log(error);
  });
});





module.exports = router;
