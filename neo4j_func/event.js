var session = require('../routes/databaseConnexion.js');
var googleApi = require('../routes/google_api.js');
var neo4jTag = require('./tag.js');
var apiKey = 

module.exports = {
  getNextEvent: function (idActivity) {
    return new Promise((resolve, reject) => {
      console.log(idActivity);
      const resultPromise = session.run(
        'Match (e:Event)-[:INSTANCE]->(a:Activity) WHERE ID(a)= ' +idActivity+ ' Return e,a',
      );

      resultPromise.then(result => {
        console.log(result);
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
};
