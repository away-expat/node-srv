var express = require('express');
var router = express.Router();
var session = require('./databaseConnexion.js');

const googleMaps = require('@google/maps').createClient({
  key: "AIzaSyB17-DLIRJDd2fZetdqBPByqyQn2n5F7KM",
  Promise: Promise
});



function getNextPage(token, googleMapsClient) {
    googleMapsClient.placesNearby({
        pagetoken: token
    })
    .asPromise()
    .then((res) =>{
      return res;
    })
    .catch((err) => {
      console.log(err);
    });;
}

function createActivity(name, place_id, ){
  const resultPromise = session.run(
    'CREATE (a:Activity {'+


    '}) RETURN a',
  );

  resultPromise.then(result => {
    const records = result.records;
    var returnValue;
    records.forEach(function(element){
      var el = element.get(0);
      var activity = {
        "id" : el.identity.low,
        "name" : el.properties.name,
        "type" : el.properties.type,
        "address" : el.properties.address
      }
      returnValue = activity;
    });

    res.send(returnValue);
  }).catch( error => {
    console.log(error);
  });
}

router.get('/testGoogle/:city', function(req, res, next) {
  var city = req.params.city;
  var returnValue = [];

  googleMaps.geocode({
      components: {
        locality: city
      },
    })
    .asPromise()
    .then((response) => {
      if(response.json.status = 'OK'){
        var placeIdCity = response.json.results[0].place_id;
        var city;
        /*
        if( .length == 1){
          city = req;
        } else {
          let sizeAdressCity = response.json.results[0].address_components.length;
          for(i = 0; i < sizeAdressCity; i++){
            let decomposedAdressCity = response.json.results[0].address_components[i].types.length;
            var nameCity = response.json.results[0].address_components[0].long_name;

            for(j = 0; j < decomposedAdressCity; j++){
              if(response.json.results[0].address_components[i].types[j] == 'country')
                var countryCity = response.json.results[0].address_components[i].long_name;
            }
          }
          var locationCity = [response.json.results[0].geometry.location.lat,response.json.results[0].geometry.location.lng];
          city = req;
        }

        console.log(city);

        */

        // get nearplaces
        // if existe add obj to returnValue
        // else
        // get detail nearplaces
        // then add obj to returnValue

        // parcourt of Pages


      }


      /*
      var nextPageToken = response.json.next_page_token;
      getNextPage(nextPageToken, googleMapsClient);
      googleMaps.place({
        placeid: 'ChIJc6EceWquEmsRmBVAjzjXM-g',
        //language: 'fr'
      })
      .asPromise()
      .then(function(res) {
        console.log(res.json);
        console.log(res.json.result.photos);
      }).catch((err) => {
        console.log(err);
      });
*/
      /*
      responseLenght = response.json.results.length;
      //console.log(responseLenght);
      for(i = 0; i < responseLenght; i++){
        var place = response.json.results[i];
        if(place.types[0]!= 'locality');
        var element = {
          "name" : place.name,
          "place_id" : place.place_id,
          "rating" : place.rating,
          "vicinity" : place.vicinity,
          "types" : place.types,
          "location" : place.geometry.location
        }
        console.log(element);
      }

      */

    })
    .catch((err) => {
      console.log(err);
    });



  res.send(returnValue);
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
        "type" : el.properties.type,
        "address" : el.properties.address
      }
      returnValue = activity;
    });

    res.send(returnValue);
  }).catch( error => {
    console.log(error);
  });
});

router.get('/getActivitiesByCountry/:id', function(req, res, next) {
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
