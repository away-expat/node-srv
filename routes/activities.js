var express = require('express');
var router = express.Router();
var session = require('./databaseConnexion.js');
var googleApi = require('./google_api.js');

var neo4jCity = require('../neo4j_func/cities.js');
var neo4jActivity = require('../neo4j_func/activity.js');
var neo4jTag = require('../neo4j_func/tag.js');
var neo4jUser = require('../neo4j_func/user.js');
var neo4jEvent = require('../neo4j_func/event.js');

var apiKey = 

router.get('/googleGetNextPage/:token', function(req, res, next) {
  var token = req.params.token;

  googleApi.getNextPage(token)
  .then(resultActivity => {
    var token = resultActivity.token;
    resultActivity = resultActivity.results;

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
                  console.log('Error : ' + error);
                  res.status(500).send('Error : ' + error);
                });
              }
            })
        })
      })
      .catch(error => {
        console.log('Error : ' + error);
        res.status(500).send('Error : ' + error);
      });

      neo4jCity.createMultyCity(cityArray)
      .then(cityResult => {
        activityArray.forEach(activity => {
          cityResult.forEach(city => {
            tmpCity = city.name + " " + city.country;
            if(activity.city == tmpCity){
              neo4jCity.createLink(activity.id, city.id)
              .catch( error => {
                console.log('Error : ' + error);
                res.status(500).send('Error : ' + error);
              });
            }
          })
        })

      })
      .catch(error => {
        console.log('Error : ' + error);
        res.status(500).send('Error : ' + error);
      });

      res.send(activityArray);

    })
    .catch(error => {
      console.log('Error : ' + error);
      res.status(500).send('Error : ' + error);
    });

  })
  .catch( error => {
    console.log('Error : ' + error);
    res.status(500).send('Error : ' + error);
  });

});

/*
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
});*/

router.get('/clearDataBase', function(req, res, next) {
  const resultPromise = session.run(
    'Match (a) Detach Delete a',
  );

  resultPromise.then(result => {
    const records = result.records;
    console.log(records);

    res.send([]);
  }).catch( error => {
    console.log(error);
  });
});

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
        var token = resultActivity.token;
        resultActivity = resultActivity.results;

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
                      console.log('Error : ' + error);
                      res.status(500).send('Error : ' + error);
                    });
                  }
                })
            })

          })
          .catch(error => {
            console.log('Error : ' + error);
            res.status(500).send('Error : ' + error);
          });

          var returnValue = {
            "results" : activityArray,
            "token" : token
          }
          res.send(returnValue);

        })
        .catch(error => {
          console.log('Error : ' + error);
          res.status(500).send('Error : ' + error);
        });
      })
      .catch(error => {
        console.log('Error : ' + error);
        res.status(500).send('Error : ' + error);
      });
    }).catch(error => {
      console.log('Error : ' + error);
      res.status(500).send('Error : ' + error);
    });
  }).catch(error => {
    console.log('Error : ' + error);
    res.status(500).send('Error : ' + error);
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
                  console.log('Error : ' + error);
                  res.status(500).send('Error : ' + error);
                });
              }
            })
        })
      })
      .catch(error => {
        console.log('Error : ' + error);
        res.status(500).send('Error : ' + error);
      });

      neo4jCity.createMultyCity(cityArray)
      .then(cityResult => {
        activityArray.forEach(activity => {
          cityResult.forEach(city => {
            tmpCity = city.name + " " + city.country;
            if(activity.city == tmpCity){
              neo4jCity.createLink(activity.id, city.id)
              .catch( error => {
                console.log('Error : ' + error);
                res.status(500).send('Error : ' + error);
              });
            }
          })
        })

      })
      .catch(error => {
        console.log('Error : ' + error);
        res.status(500).send('Error : ' + error);
      });

      res.send(activityArray);

    })
    .catch(error => {
      console.log('Error : ' + error);
      res.status(500).send('Error : ' + error);
    });
  })
  .catch(error => {
    console.log('Error : ' + error);
    res.status(500).send('Error : ' + error);
  });

});

router.get('/suggestion', function(req, res, next) {
  neo4jTag.getTags(currentUser.id)
  .then(tags => {
    console.log(tags);

    tags.forEach(tag => {
      var limite = 0;

      neo4jActivity.getFromCityAndTagWithEvent(currentUser.at.id, tag.id)
      .then(activities => {
        if(activities.length > 0){
          var endLength = activities.length;
          var eventArray = [];
          var numberOfEvent = 0;
          activities.forEach(activity => {
            if(limite < 5){
              console.log(activity.id);
              neo4jEvent.getNextEvent(activity.id)
              .then(event => {
                if(event)
                  eventArray.push(event);

                numberOfEvent++;
                if(numberOfEvent == endLength)
                  res.send(eventArray);

              })
              .catch(error => {
                console.log('Error : ' + error);
                res.status(500).send('Error : ' + error);
              })

              limite += 1;
            }
          })
        } else
          res.send([]);

      })
      .catch(error => {
        console.log('Error : ' + error);
        res.status(500).send('Error : ' + error);
      });
    }); //forEach

  })
  .catch(error => {
    console.log('Error : ' + error);
    res.status(500).send('Error : ' + error);
  });
});

router.get('/ByTag/:tag/', function(req, res, next) {
  let idTag = req.params.tag;

  neo4jActivity.getFromCityAndTag(currentUser.at.id, idTag)
  .then(activities => {
      res.send(activities);
  })
  .catch(error => {
    console.log('Error : ' + error);
    res.status(500).send('Error : ' + error);
  })


});

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
      var photo = "https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&key="+apiKey+"&photoreference=";
      photo += el.properties.photos;
      var activity = {
        "id" : el.identity.low,
        "name" : el.properties.name,
        "address" : el.properties.address,
        "place_id" : el.properties.place_id,
        "rating" : el.properties.rating,
        "url" : el.properties.url,
        "photos" : photo,
        "type" : el.properties.type
      }
      returnValue.push(activity);
    });

    res.send(returnValue);
  }).catch( error => {
    console.log('Error : ' + error);
    res.status(500).send('Error : ' + error);
  });
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
      var photo = "https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&key="+apiKey+"&photoreference=";
      photo += el.properties.photos;
      var activity = {
        "id" : el.identity.low,
        "name" : el.properties.name,
        "address" : el.properties.address,
        "place_id" : el.properties.place_id,
        "rating" : el.properties.rating,
        "url" : el.properties.url,
        "photos" : photo,
        "type" : el.properties.type
      }
      returnValue.push(activity);
    });

    res.send(returnValue);
  }).catch( error => {
    console.log('Error : ' + error);
    res.status(500).send('Error : ' + error);
  });
});

router.get('/:id', function(req, res, next) {
  let id = req.params.id;

  const resultPromise = session.run(
    'MATCH (a:Activity) WHERE ID(a) = ' + id + ' RETURN a',
  );

  resultPromise.then(result => {
    const records = result.records;
    var el = records[0].get(0);
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

    var t = activity.type.split(',');
    var sizeSeeTag = 0;

    t.forEach(ac => {
      neo4jTag.userSee(u.id, ac)
      .then(r => {
        sizeSeeTag++;
        if(sizeSeeTag >= t.length)
          res.send(activity);
      })
      .catch( error => {
        console.log('Error : ' + error);
        res.status(500).send('Error : ' + error);
      });
    });

  })
  .catch( error => {
    console.log('Error : ' + error);
    res.status(500).send('Error : ' + error);
  });


});









module.exports = router;
