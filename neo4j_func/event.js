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
};
