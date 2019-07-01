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

var dateFormat = require('dateformat');
const request = require('request');

function uglyName(name){
  name = name.charAt(0).toLowerCase() + name.slice(1);
  while(name.indexOf(' ') != -1)
    name = name.replace(' ', '_');
  return name;
}

function addIfNotExiste(finalList, suggestionList){
  suggestionList.forEach(news => {
    var existe = 0;
    finalList.forEach(old =>{
      if(old.id == news.id)
        existe++;
    })
    if(existe == 0)
      finalList.push(news);
  })
  return finalList;
}

function sortByDate(events){
  var change = 0;
  while(change == 0){
    change = 0;
    for(i = 0; i < events.length-1; i++){
      var a = events[i];
      var b = events[i+1];
      var c = new Date(a.date);
      var d = new Date(b.date);
      if(c < d){
        var tmp = a;
        a = b;
        b = tmp;
        change = 1;
        console.log("changement");
      }
    }
  }
  return events;

}

router.get('/clearDataBase', function(req, res, next) {
  const resultPromise = session.run(
    'Match (a:Event) Detach Delete a',
  );

  resultPromise.then(result => {
    const records = result.records;
    console.log(records);

    res.send([]);
  })
  .catch(error => {
    console.log('Error : ' + error);
    res.status(500).send('Error : ' + error);
  });
});

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

router.post('/test', function(req, res, next) {
  let idUser = req.body.id;
  let idElement = req.body.element;

  const resultPromise = session.run(
    'MATCH (u:User), (e) WHERE ID(u) = ' + idUser + ' And ID(e) = ' + idElement +
    ' Create (u)-[l:SEE]->(e) RETURN e',
  );

  resultPromise.then(result => {
    const records = result.records;

    res.send(records);
  }).catch( error => {
    console.log('Error : ' + error);
    res.status(500).send('Error : ' + error);
  });
});

router.post('/testLike', function(req, res, next) {
  let idUser = req.body.id;
  let idElement = req.body.element;

  const resultPromise = session.run(
    'MATCH (u:User), (e) WHERE ID(u) = ' + idUser + ' And ID(e) = ' + idElement +
    ' Create (u)-[l:LIKE]->(e) RETURN e',
  );

  resultPromise.then(result => {
    const records = result.records;

    res.send(records);
  }).catch( error => {
    console.log('Error : ' + error);
    res.status(500).send('Error : ' + error);
  });
});

router.get('/recherche/:name/:option?', function(req, res, next) {
  var name = req.params.name;
  var location = currentUser.at.location;
  var option = req.params.option;

  if (!option)
    option = '';
  else
    option = uglyName(option);

  googleApi.rechByName(name, location, option)
  .then(resultActivity => {
    var nextToken = resultActivity.token;

    if(resultActivity.results) {
      neo4jActivity.createIfDoNotExiste(resultActivity.results, -1)
      .then(activityArray => {
        if(activityArray){
          var tagArray = [];
          var cityArray = [];

          activityArray.forEach(activity => {
            if(activity.type){
              activity.type = activity.type.split(',');
              activity.type.forEach(tag => {
                if(tagArray.indexOf(tag) == -1)
                  tagArray.push(tag);
              })
            } else {
              activity.type = [];
            }
            if(cityArray.indexOf(activity.city) == -1 && activity.city)
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
                      console.log('Error 6: ' + error);
                      res.status(500).send('Error : ' + error);
                    });
                  }
                })
            })
          })
          .catch(error => {
            console.log('Error 5: ' + error);
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
                    console.log('Error 4: ' + error);
                    res.status(500).send('Error : ' + error);
                  });
                }
              })
            })

          })
          .catch(error => {
            console.log('Error 3: ' + error);
            res.status(500).send('Error : ' + error);
          });

          var returnValue = {
            "results" : activityArray,
            "token" : nextToken
          }

          res.send(returnValue);
        } else{
          var returnEmpty = {
            results : [],
            token: ""
          }
          res.send(returnEmpty);
        }

      })
      .catch(error => {
        console.log('Error 2: ' + error);
        res.status(500).send('Error : ' + error);
      });
    } else {
      res.send([]);
    }
  })
  .catch(error => {
    console.log('Error 1: ' + error);
    res.status(500).send('Error : ' + error);
  });


});

router.get('/rechercheAngular/:name/:location/:option?', function(req, res, next) {

  var name = req.params.name;
  var location = req.params.location;
  var option = req.params.option;

  if (!option)
    option = '';
  else
    option = uglyName(option);

  googleApi.rechByName(name, location, option)
  .then(resultActivity => {
    if(resultActivity.results) {
      neo4jActivity.createIfDoNotExiste(resultActivity.results, -1)
      .then(activityArray => {
        if(activityArray){
          var tagArray = [];
          var cityArray = [];

          activityArray.forEach(activity => {
            if(activity.type){
              activity.type = activity.type.split(',');
              activity.type.forEach(tag => {
                if(tagArray.indexOf(tag) == -1)
                  tagArray.push(tag);
              })
            } else {
              activity.type = [];
            }
            if(cityArray.indexOf(activity.city) == -1 && activity.city)
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
                      console.log('Error 6: ' + error);
                      res.status(500).send('Error : ' + error);
                    });
                  }
                })
            })
          })
          .catch(error => {
            console.log('Error 5: ' + error);
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
                    console.log('Error 4: ' + error);
                    res.status(500).send('Error : ' + error);
                  });
                }
              })
            })

          })
          .catch(error => {
            console.log('Error 3: ' + error);
            res.status(500).send('Error : ' + error);
          });

          res.send(activityArray);
        } else{
          var returnEmpty = {
            results : [],
            token: ""
          }
          res.send(returnEmpty);
        }

      })
      .catch(error => {
        console.log('Error 2: ' + error);
        res.status(500).send('Error : ' + error);
      });
    } else {
      res.send([]);
    }
  })
  .catch(error => {
    console.log('Error 1: ' + error);
    res.status(500).send('Error : ' + error);
  });


});

router.get('/googleGetNextPage/:token', function(req, res, next) {
  var token = req.params.token;

  googleApi.getNextPage(token)
  .then(resultActivity => {
    var nextToken = resultActivity.token;
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
        } else {
          activity.type = [];
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
                  console.log('Error 6: ' + error);
                  res.status(500).send(error);
                });
              }
            })
        })
      })
      .catch(error => {
        console.log('Error 5: ' + error);
        res.status(500).send(error);
      });

      neo4jCity.createMultyCity(cityArray)
      .then(cityResult => {
        activityArray.forEach(activity => {
          cityResult.forEach(city => {
            tmpCity = city.name + " " + city.country;
            if(activity.city == tmpCity){
              neo4jCity.createLink(activity.id, city.id)
              .catch( error => {
                console.log('Error 4: ' + error);
                res.status(500).send(error);
              });
            }
          })
        })
      })
      .catch(error => {
        console.log('Error 3: ' + error);
        res.status(500).send(error);
      });

      var returnValue = {
        "results" : activityArray,
        "token" : nextToken
      }

      res.send(returnValue);

    })
    .catch(error => {
      console.log('Error 2: ' + error);
      res.status(500).send(error);
    });

  })
  .catch( error => {
    console.log('Error 1: ' + error);
    res.status(500).send(error);
  });

});

router.get('/googleByCity/:city/:option?', function(req, res, next) {
  var city = req.params.city;
  var option = req.params.option;
  var returnValue = [];

  if (!option)
    option = '';
  else
    option = uglyName(option);

  googleApi.getByName(city)
  .then(result => {
    var cityFromGoogle = result;

    neo4jCity.createIfDoNotExiste(cityFromGoogle)
    .then(reslt => {

      googleApi.getNear(reslt.location, option)
      .then(resultActivity => {
        var token = resultActivity.token;
        resultActivity = resultActivity.results;

        if(resultActivity) {
          neo4jActivity.createIfDoNotExiste(resultActivity, reslt.id)
          .then(activityArray => {
            if(activityArray.length > 0) {
              var tagArray = [];
              activityArray.forEach(activity => {
                if(activity.type){
                  activity.type = activity.type.split(',');
                  activity.type.forEach(tag => {
                    if(tagArray.indexOf(tag) == -1)
                      tagArray.push(tag);
                  })
                } else {
                  activity.type = [];
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
                          console.log('Error 6: ' + error);
                          res.status(500).send('Error 6: ' + error);
                        });
                      }
                    })
                })

                if(option){
                  neo4jTag.userSee(currentUser.id, option)
                  .then(r => {
                    console.log("link see to " + option + " fait !");
                  })
                  .catch( error => {
                    console.log('Error 7: ' + error);
                    res.status(500).send('Error 7: ' + error);
                  });
                }

              })
              .catch(error => {
                console.log('Error 5: ' + error);
                res.status(500).send('Error 5: ' + error);
              });

              var returnValue = {
                "results" : activityArray,
                "token" : token
              }

              res.send(returnValue);
            } else{
              var returnEmpty = {
                results : [],
                token: ""
              }
              res.send(returnEmpty);
            }

          })
          .catch(error => {
            console.log('Error 4: ' + error);
            res.status(500).send('Error 4: ' + error);
          });
        } else{
          var returnEmpty = {
            results : [],
            token: ""
          }
          res.send(returnEmpty);
        }

      })
      .catch(error => {
        console.log('Error 3: ' + error);
        res.status(500).send('Error 3: ' + error);
      });
    })
    .catch(error => {
      console.log('Error 2: ' + error);
      res.status(500).send('Error 2: ' + error);
    });
  })
  .catch(error => {
    console.log('Error 1: ' + error);
    res.status(500).send('Error 1: ' + error);
  });

});

router.get('/googleByLocation/:location/:option?', function(req, res, next) {
  var location = req.params.location;
  var option = req.params.option;
  var returnValue = [];

  if (!option)
    option = '';
  else
    option = uglyName(option);

  googleApi.getNear(location, option)
  .then(resultActivity => {

    neo4jActivity.createIfDoNotExiste(resultActivity.results, -1)
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
        else {
          activity.type = [];
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
  var finalResult = [];
  var limit = 0;

  neo4jEvent.suggestionThree(currentUser.id, currentUser.at.id, 3)
  .then(resultSug1 => {
    //console.log("Suggestion 1");
    //console.log(resultSug1);
    finalResult = resultSug1;

    limit = 2 + ( 3 - finalResult.length);
    console.log("Size of 1 : " + finalResult.length);

    neo4jEvent.suggestionFour(currentUser.id, currentUser.at.id, limit)
    .then(resultSug2 => {
      finalResult = addIfNotExiste(finalResult, resultSug2);
      //console.log("Suggestion 2");
      //console.log(resultSug2);

      limit = 3 + ( 5 - finalResult.length);
      console.log("Size of 2 : " + finalResult.length);


      neo4jEvent.suggestionOne(currentUser.id, currentUser.at.id, limit)
      .then(resultSug3 => {
        finalResult = addIfNotExiste(finalResult, resultSug3);
        //console.log("Suggestion 3");
        //console.log(resultSug3);

        limit = 2 + ( 8 - finalResult.length);
        console.log("Size of 3 : " + finalResult.length);

        neo4jEvent.suggestionTwo(currentUser.id, currentUser.at.id, limit)
        .then(resultSug4 => {
          finalResult = addIfNotExiste(finalResult, resultSug4);
          //console.log("Suggestion 4");
          //console.log(resultSug4);

          limit = 3 + ( 10 - finalResult.length);
          console.log("Size of 4 : " + finalResult.length);

          neo4jEvent.suggestionSix(currentUser.id, currentUser.at.id, limit)
          .then(resultSug5 => {
            finalResult = addIfNotExiste(finalResult, resultSug5);
            //console.log("Suggestion 5");
            //console.log(resultSug5);

            limit = 5 + ( 13 - finalResult.length);
            console.log("Size of 5 : " + finalResult.length);

            neo4jEvent.suggestionFive(currentUser.id, currentUser.at.id, limit)
            .then(resultSug6 => {
              finalResult = addIfNotExiste(finalResult, resultSug6);
              //console.log("Suggestion 6");
              //console.log(resultSug6);

              finalResult.sort(function(a, b) {
                  var dateA = new Date(a.date), dateB = new Date(b.date);
                  return dateA - dateB;
              });

              neo4jEvent.getPromotedEvent(currentUser.at.id)
              .then(resultPromotedEvent => {

                if(resultPromotedEvent[0] != null)
                  finalResult.unshift(resultPromotedEvent[0]);

                if(resultPromotedEvent[1] != null)
                  finalResult.unshift(resultPromotedEvent[1]);

                res.send(finalResult);
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
      var photo;
      if(el.properties.photos){
        photo = "https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&key="+apiKey+"&photoreference=";
        photo += el.properties.photos;
      } else {
        photo = "http://51.75.122.187:3000/img/noPhoto.jpg";
      }

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
      var photo;
      if(el.properties.photos){
        photo = "https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&key="+apiKey+"&photoreference=";
        photo += el.properties.photos;
      } else {
        photo = "http://51.75.122.187:3000/img/noPhoto.jpg";
      }

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
    var photo;
    if(el.properties.photos){
      photo = "https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&key="+apiKey+"&photoreference=";
      photo += el.properties.photos;
    } else {
      photo = "http://51.75.122.187:3000/img/noPhoto.jpg";
    }

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


    var t = activity.type.split(',');
    var sizeSeeTag = 0;

    if(activity.type != ""){
      t.forEach(ac => {
        neo4jTag.userSee(currentUser.id, ac)
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
    } else {
      activity.type = [];
    }

  })
  .catch( error => {
    console.log('Error : ' + error);
    res.status(500).send('Error : ' + error);
  });


});









module.exports = router;
