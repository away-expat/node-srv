var session = require('../routes/databaseConnexion.js');
var googleApi = require('../routes/google_api.js');
var neo4jTag = require('./tag.js');
var apiKey = 
var dateFormat = require('dateformat');

module.exports = {
  getNextEvent: function (idActivity) {
    return new Promise((resolve, reject) => {
      var day = dateFormat(new Date(), "yyyy-mm-dd");
      const resultPromise = session.run(
        'Match (e:Event)-[:INSTANCE]->(a:Activity) WHERE ID(a)= ' +idActivity+ ' AND e.date >= "' + day + '"  Return e,a Order By e.date',
      );

      resultPromise.then(result => {
        const records = result.records;
        var el = records[0].get(0);
        var activity = records[0].get(1);
        var event = {
          "id" : el.identity.low,
          "date" : el.properties.date,
          "hour" : el.properties.hour,
          "description" : el.properties.description,
          "activityName" : activity.properties.name,
          "activityId" : activity.identity.low,
        }
        resolve(event);

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
        'Match (e:Event), (u:User) Where ID(e) = ' + idEvent + ' And ID(u) = ' + idUser + ' Create (e)<-[:SEE]-(u) return e',
      );

      resultPromise.then(result => {
        const records = result.records;
        var returnValue;
        records.forEach((element) => {
          var el = element.get(0);
          returnValue.push(el);
        });

        resolve(returnValue);
      }).catch( error => {
        console.log(error);
        reject(error);
      });
    })
  },
  suggestionOne: function (idUser, idCity, limit) {
    return new Promise((resolve, reject) => {
      const resultPromise = session.run(
        'Match (c:City)-[:HAS]->(a:Activity)<-[:INSTANCE]-(e:Event)<-[s:SEE]-(u:User) '+
        'With c,a,e,u,count(s) as cnt ' +
        'Where cnt >= 3 And ID(u) = ' + idUser + ' And ID(c) = ' + idCity + ' And Not (u)-[:TAKEPART]->(e) And Not (u)-[:CREATE]->(e) ' +
        'Return e,a Order By e.date ' +
        'Limit ' + limit,
      );

      resultPromise.then(result => {
        const records = result.records;
        var returnValue = [];
        records.forEach((element) => {
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
        'Match (t:Tag)<-[s:SEE]-(u:User), (t)<-[:TYPE]-(a:Activity)<-[:INSTANCE]-(e:Event), (c:City)-[:HAS]->(a) ' +
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

          var event = {
            "id" : el.identity.low,
            "title" : el.properties.title,
            "date" : el.properties.date,
            "hour" : el.properties.hour,
            "description" : el.properties.description,
            "activityName" : activity.properties.name,
            "activityId" : activity.identity.low,
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

      const resultPromise = session.run(
        'Match (u:User)-[lt:TAKEPART]->(e:Event)-[:INSTANCE]->(a:Activity)<-[:INSTANCE]-(otherEvent),' +
        ' (a)<-[:HAS]-(c:City)' +
        ' Where ID(u) = ' + idUser +
        ' And ID(c) = ' + idCity +
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

        resolve(returnValue);

      }).catch( error => {
        console.log(error);
        reject(error);
      });


    })
  },
};
