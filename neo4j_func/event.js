var session = require('../routes/databaseConnexion.js');
var googleApi = require('../routes/google_api.js');
var neo4jTag = require('./tag.js');
var apiKey = 
var dateFormat = require('dateformat');

module.exports = {
  getNextEvent: function (idActivity, idUser) {
    return new Promise((resolve, reject) => {
      var day = dateFormat(new Date(), "yyyy-mm-dd");
      const resultPromise = session.run(
        'Match (e:Event)-[:INSTANCE]->(a:Activity), ' +
        '(u:User) ' +
        'WHERE ID(a)= ' + idActivity + ' ' +
        'AND ID(u)= ' + idUser + ' ' +
        'AND NOT (u)-[:TAKEPART]->(e) ' +
        'AND e.date >= "' + day + '"  ' +
        'Return e,a Order By e.date',
      );

      resultPromise.then(result => {
        const records = result.records;
        if(records.length > 0){
          var el = element.get(0);
          var activity = element.get(1);
          if(activity.properties.photos){
            photo = "https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&key="+apiKey+"&photoreference=";
            photo += activity.properties.photos;
          } else {
            photo = "http://51.75.122.187:3000/img/noPhoto.jpg";
          }
          var event = {
            "id" : el.identity.low,
            "title" : el.properties.title,
            "date" : el.properties.date,
            "hour" : el.properties.hour,
            "promoted" : el.properties.promoted,
            "description" : el.properties.description,
            "activityName" : activity.properties.name,
            "activityId" : activity.identity.low,
            "photo" : photo
          }
          returnValue.push(event);
        } else {
          resolve(undefined);
        }
      }).catch( error => {
        console.log(error);
        reject(error);
      });
    })
  },
  canIChangeMyMind: function (idEvent) {
    return new Promise((resolve, reject) => {
      var day = dateFormat(new Date(), "yyyy-mm-dd");
      const resultPromise = session.run(
        'Match (e:Event) WHERE ID(e)= ' +idEvent+ ' Return e',
      );

      resultPromise.then(result => {
        const records = result.records;
        var el = records[0].get(0);
        var event = {
          "id" : el.identity.low,
          "date" : el.properties.date,
          "hour" : el.properties.hour,
          "description" : el.properties.description,
        }
        if(event.date >= day)
          resolve(true);
        else
          resolve(false);

      }).catch( error => {
        console.log(error);
        reject(error);
      });
    })
  },
  userSeeEvent: function (idUser, idEvent) {
    return new Promise((resolve, reject) => {
      const resultPromise = session.run(
        'Match (e:Event), (u:User) ' +
        'Where ID(e) = ' + idEvent + ' And ID(u) = ' + idUser +
        ' Create (e)<-[:SEE]-(u) return e',
      );

      resultPromise.then(result => {
        console.log("Lien créé à l'event " + idEvent + " par " + idUser);
        resolve([]);
      }).catch( error => {
        console.log(error);
        reject(error);
      });
    })
  },
  suggestionOne: function (idUser, idCity, limit) {
    return new Promise((resolve, reject) => {
      var day = dateFormat(new Date(), "yyyy-mm-dd");
      const resultPromise = session.run(
        'Match (c:City)-[:HAS]->(a:Activity)<-[:INSTANCE]-(e:Event {promoted:false})<-[s:SEE]-(u:User) '+
        'With c,a,e,u,count(s) as cnt ' +
        'Where cnt >= 3 And ID(u) = ' + idUser + ' And ID(c) = ' + idCity + ' And e.date >= "' + day + '" And Not (u)-[:TAKEPART]->(e) And Not (u)-[:CREATE]->(e) ' +
        'Return e,a Order By e.date ' +
        'Limit ' + limit,
      );

      resultPromise.then(result => {
        const records = result.records;
        var returnValue = [];
        records.forEach((element) => {
          var el = element.get(0);
          var activity = element.get(1);
          if(activity.properties.photos){
            photo = "https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&key="+apiKey+"&photoreference=";
            photo += activity.properties.photos;
          } else {
            photo = "http://51.75.122.187:3000/img/noPhoto.jpg";
          }
          var event = {
            "id" : el.identity.low,
            "title" : el.properties.title,
            "date" : el.properties.date,
            "hour" : el.properties.hour,
            "promoted" : el.properties.promoted,
            "description" : el.properties.description,
            "activityName" : activity.properties.name,
            "activityId" : activity.identity.low,
            "photo" : photo
          }
          returnValue.push(event);
        });

        resolve(returnValue);
      }).catch( error => {
        console.log(error);
        reject(error);
      });
    })
  },
  suggestionTwo: function (idUser, idCity, limit) {
    return new Promise((resolve, reject) => {
      var day = dateFormat(new Date(), "yyyy-mm-dd");
      const resultPromise = session.run(
        'Match (t:Tag)<-[s:SEE]-(u:User), (t)<-[:TYPE]-(a:Activity)<-[:INSTANCE]-(e:Event {promoted:false}), (c:City)-[:HAS]->(a) ' +
        'With t,u,a,e,c,count(s) as cnt ' +
        'Where ID(u) = ' + idUser + ' AND ID(c) = ' + idCity + ' AND e.date >= "' + day + '" AND NOT (u)-[:LIKE]->(t) ' +
        'Return e,a Order By e.date, cnt desc Limit ' + limit ,
      );

      resultPromise.then(result => {
        const records = result.records;
        console.log(records);
        var returnValue = [];
        records.forEach((element) => {
          var el = element.get(0);
          var activity = element.get(1);
          if(activity.properties.photos){
            photo = "https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&key="+apiKey+"&photoreference=";
            photo += activity.properties.photos;
          } else {
            photo = "http://51.75.122.187:3000/img/noPhoto.jpg";
          }
          var event = {
            "id" : el.identity.low,
            "title" : el.properties.title,
            "date" : el.properties.date,
            "hour" : el.properties.hour,
            "promoted" : el.properties.promoted,
            "description" : el.properties.description,
            "activityName" : activity.properties.name,
            "activityId" : activity.identity.low,
            "photo" : photo
          }

          var existe = 0;
          returnValue.forEach(resEvent => {
            if(resEvent.id ==  event.id)
              existe ++;
          });

          if(existe == 0)
            returnValue.push(event);
        });

        resolve(returnValue);
      }).catch( error => {
        console.log(error);
        reject(error);
      });
    })
  },
  suggestionThree: function (idUser, idCity, limit) {
    return new Promise((resolve, reject) => {
      var day = dateFormat(new Date(), "yyyy-mm-dd");
      this.getActivityWithTakePartUpperThan2(idUser, idCity)
      .then(activities => {
        var returnValue = [];
        var countValue = 0;

        activities.forEach(idActivity => {
          console.log(idActivity);
          this.getNextEvent(idActivity, idUser)
          .then(nextEvent => {
            countValue ++;
            if(nextEvent){
              returnValue.push(nextEvent);
              if(countValue == activities.length || countValue == limit)
                resolve(returnValue);
            }
          })
          .catch( error => {
            console.log(error);
            reject(error);
          });
        })
        if(activities.length == 0)
          resolve(returnValue);

      })
      .catch( error => {
        console.log(error);
        reject(error);
      });
    })
  },
  suggestionFour: function (idUser, idCity, limit) {
    return new Promise((resolve, reject) => {
      var day = dateFormat(new Date(), "yyyy-mm-dd");

      const resultPromise = session.run(
        'Match (u:User)-[l:TAKEPART]->(e:Event)<-[:CREATE]-(otherUser:User),' +
        '(otherUser)-[:CREATE]->(otherEvent:Event {promoted:true})-[:INSTANCE]->(a:Activity)<-[:HAS]-(c:City)' +
        ' Where ID(u) = ' + idUser +
        ' And ID(c) = ' + idCity +
        ' And Not (u)-[:TAKEPART]->(otherEvent)' +
        ' And otherEvent.date >= "' + day + '" ' +
        ' And e.date < "' + day + '" ' +
        'Return DISTINCT otherEvent,a Order By otherEvent.date Limit ' + limit,
      );

      resultPromise.then(result => {
        const records = result.records;
        var returnValue = [];
        records.forEach((element) => {
          var el = element.get(0);
          var activity = element.get(1);
          if(activity.properties.photos){
            photo = "https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&key="+apiKey+"&photoreference=";
            photo += activity.properties.photos;
          } else {
            photo = "http://51.75.122.187:3000/img/noPhoto.jpg";
          }
          var event = {
            "id" : el.identity.low,
            "title" : el.properties.title,
            "date" : el.properties.date,
            "hour" : el.properties.hour,
            "promoted" : el.properties.promoted,
            "description" : el.properties.description,
            "activityName" : activity.properties.name,
            "activityId" : activity.identity.low,
            "photo" : photo
          }
          returnValue.push(event);
        });

        resolve(returnValue);

      }).catch( error => {
        console.log(error);
        reject(error);
      });


    })
  },
  suggestionFive: function (idUser, idCity, limit) {
    return new Promise((resolve, reject) => {
      var day = dateFormat(new Date(), "yyyy-mm-dd");

      const resultPromise = session.run(
        'Match (u:User)-[:LIKE]->(t:Tag)<-[:TYPE]-(a:Activity)<-[:INSTANCE]-(e:Event {promoted:false}),' +
        ' (a)<-[:HAS]-(c:City)' +
        ' Where ID(u) = ' + idUser +
        ' And ID(c) = ' + idCity +
        ' And Not (u)-[:TAKEPART]->(e)' +
        ' And e.date >= "' + day + '" ' +
        'Return DISTINCT e,a Order By e.date Limit ' + limit,
      );

      resultPromise.then(result => {
        const records = result.records;
        var returnValue = [];
        records.forEach((element) => {
          var el = element.get(0);
          var activity = element.get(1);
          if(activity.properties.photos){
            photo = "https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&key="+apiKey+"&photoreference=";
            photo += activity.properties.photos;
          } else {
            photo = "http://51.75.122.187:3000/img/noPhoto.jpg";
          }
          var event = {
            "id" : el.identity.low,
            "title" : el.properties.title,
            "date" : el.properties.date,
            "hour" : el.properties.hour,
            "promoted" : el.properties.promoted,
            "description" : el.properties.description,
            "activityName" : activity.properties.name,
            "activityId" : activity.identity.low,
            "photo" : photo
          }
          returnValue.push(event);
        });

        resolve(returnValue);

      }).catch( error => {
        console.log(error);
        reject(error);
      });


    })
  },
  suggestionSix: function (idUser, idCity, limit) {
    return new Promise((resolve, reject) => {

      this.getStrongerLinkWithTags(idUser)
      .then(arrayIdTag => {
        console.log(arrayIdTag);

        this.getUserWithSameStrongerLinkWithTags(idUser, arrayIdTag)
        .then(users => {
          if(users.length > 0){
            var results = [];
            var size = 0;
            users.forEach(u => {

              this.getNextEventFromUserLikeMe(idUser, u, arrayIdTag)
              .then(events => {

                events.forEach(e => {
                  results.push(e);
                });
                size ++;
                if(size >= users.length)
                  resolve(results);

              })
              .catch( error => {
                console.log(error);
                reject(error);
              });

            })
          } else {
            resolve([]);
          }

        })
        .catch( error => {
          console.log(error);
          reject(error);
        });

      })
      .catch( error => {
        console.log(error);
        reject(error);
      });

    })
  },
  getActivityWithTakePartUpperThan2: function (idUser, idCity) {
    return new Promise((resolve, reject) => {
      var day = dateFormat(new Date(), "yyyy-mm-dd");

      const resultPromise = session.run(
        'Match (u:User)-[l:TAKEPART]->(e:Event)-[:INSTANCE]->(a:Activity),' +
        ' (a)<-[:HAS]-(c:City)' +
        ' Where ID(u) = ' + idUser +
        ' And ID(c) = ' + idCity +
        ' And e.date < "' + day + '" ' +
        ' Return a',
      );

      resultPromise.then(result => {
        const records = result.records;
        var returnValue = [];
        var activityArray = [];
        var countLink = [];

        records.forEach((element) => {
          var el = element.get(0);
          var existe = 0;
          for(i = 0; i < activityArray.length; i++){
            if(activityArray[i] == el.identity.low){
              existe ++;
              countLink[i] ++;
            }
          }

          if(existe == 0){
            activityArray.push(el.identity.low);
            countLink.push(1);
          }
        });

        for(j = 0; j < activityArray.length; j ++){
          if(countLink[j] > 1){
            returnValue.push(activityArray[j]);
          }
        }
        resolve(returnValue);

      }).catch( error => {
        console.log(error);
        reject(error);
      });

    })
  },
  getStrongerLinkWithTags: function (idUser) {
    return new Promise((resolve, reject) => {
      const resultPromise = session.run(
        'Match (u:User)-[:LIKE]->(t:Tag) ' +
        'Optional Match (t:Tag)<-[l:SEE]-(u) ' +
        'With u, t, count(l) As Strength ' +
        'Where ID(u) = ' + idUser + ' ' +
        'RETURN t ORDER BY Strength DESC',
      );

      resultPromise.then(result => {
        const records = result.records;
        var turn = 0;
        var resutlTagId = [];

        records.forEach(element => {
          var el = element.get(0);
          if(turn < 3)
            resutlTagId.push(el.identity.low);
          turn ++;
        })

        resolve(resutlTagId);
      })
      .catch( error => {
        console.log(error);
        reject(error);
      });

    })
  },
  getUserWithSameStrongerLinkWithTags: function (idUser, arrayTag) {
    return new Promise((resolve, reject) => {
      const resultPromise = session.run(
        'Match (u:User)-[:LIKE]->(t:Tag) ' +
        'Optional Match (t:Tag)<-[l:SEE]-(u) ' +
        'With u, t, count(l) As Strength ' +
        'Where ID(u) <> ' + idUser + ' ' +
        'RETURN u,t ORDER BY u, Strength DESC',
      );

      resultPromise.then(result => {
        const records = result.records;

        var results = [];
        var idUser = [];
        var idTag = [];
        var userPassed = [];
        records.forEach(element => {
          var el = element.get(0)
          var t = element.get(1);
          idUser.push(el.identity.low);
          idTag.push(t.identity.low);
        })

        var likeMe = 0;
        var posTag = 0;
        var actualUser;

        for(i = 0; i < idUser.length; i ++){
          if(idUser[i] != actualUser){
            likeMe = 0;
            actualUser = idUser[i];
          }

          if(arrayTag[posTag] == idTag[i]){
            likeMe ++;
            posTag ++;
          } else
            posTag = 0;

          if(likeMe >= 3){
            results.push(actualUser);
          }
        }

        resolve(results);
      })
      .catch( error => {
        console.log(error);
        reject(error);
      });

    })
  },
  getNextEventFromUserLikeMe: function (idUser, idOtherUser, arrayTag) {
    return new Promise((resolve, reject) => {
      var day = dateFormat(new Date(), "yyyy-mm-dd");

      const resultPromise = session.run(
        'Match (u:User)-[:TAKEPART]->(e:Event {promoted:false})-[:INSTANCE]->(a:Activity)-[:TYPE]->(t:Tag), ' +
        ' (me:User)' +
        ' Where ID(u) = ' + idOtherUser +
        ' And ID(me) = ' + idUser +
        ' And e.date >= "' + day + '" ' +
        ' And (ID(t) = ' + arrayTag[0] +
        ' Or ID(t) = ' + arrayTag[1] +
        ' Or ID(t) = ' + arrayTag[2] + ')' +
        ' And Not (me)-[:CREATE]->(e)' +
        ' RETURN DISTINCT e,a',
      );

      resultPromise.then(result => {
        const records = result.records;
        var returnValue = [];
        records.forEach(function(element){
          var el = element.get(0);
          var activity = element.get(1);
          if(activity.properties.photos){
            photo = "https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&key="+apiKey+"&photoreference=";
            photo += activity.properties.photos;
          } else {
            photo = "http://51.75.122.187:3000/img/noPhoto.jpg";
          }
          var event = {
            "id" : el.identity.low,
            "title" : el.properties.title,
            "date" : el.properties.date,
            "hour" : el.properties.hour,
            "description" : el.properties.description,
            "activityName" : activity.properties.name,
            "activityId" : activity.identity.low,
            "photo" : photo
          }
          returnValue.push(event);
        });
        resolve(returnValue);
      })
      .catch( error => {
        console.log(error);
        reject(error);
      });

    })
  },
  getPromotedEvent: function (idCity) {
    return new Promise((resolve, reject) => {
      const resultPromise = session.run(
        'Match (e:Event {promoted: true})-[:INSTANCE]->(a:Activity)<-[:HAS]-(c:City)' +
        'Where ID(c) = '+ idCity +
        ' Return e,a',
      );

      resultPromise.then(result => {
        const records = result.records;
        var returnValue = [];
        records.forEach(function(element){
          var el = element.get(0);
          var activity = element.get(1);
          if(activity.properties.photos){
            photo = "https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&key="+apiKey+"&photoreference=";
            photo += activity.properties.photos;
          } else {
            photo = "http://51.75.122.187:3000/img/noPhoto.jpg";
          }
          var event = {
            "id" : el.identity.low,
            "title" : el.properties.title,
            "date" : el.properties.date,
            "hour" : el.properties.hour,
            "promoted" : el.properties.promoted,
            "description" : el.properties.description,
            "activityName" : activity.properties.name,
            "activityId" : activity.identity.low,
            "photo" : photo
          }
          returnValue.push(event);
        });
        resolve(returnValue);

      }).catch( error => {
        console.log(error);
        reject(error);
      });
    })
  },



};
