var express = require('express');
var router = express.Router();

var session = require('./databaseConnexion.js');

const random128Hex = require('../core/random128').random128Hex;
const jwt = require('jwt-simple');
var sha1 = require('sha1');

var neo4jUser = require('../neo4j_func/user.js');
var neo4jTag = require('../neo4j_func/tag.js');
var neo4jCity = require('../neo4j_func/cities.js');

var multer  = require('multer');
var fs = require('fs');

function userAvatar (id){
  var imgLink = "img/" + id;
  if (fs.existsSync('./img/' + id + '.jpg')) {
    imgLink+= '.jpg';
    return imgLink;
  } else if (fs.existsSync('./img/' + id + '.jpeg')) {
    imgLink+= '.jpeg';
    return imgLink;
  } else if (fs.existsSync('./img/' + id + '.png')) {
    imgLink+= '.png';
    return imgLink;
  } else {
    return undefined;
  }
}

router.post('/', function(req, res, next) {
  var firstname = req.body.firstname;
  var lastname = req.body.lastname;
  var birth = req.body.birth;
  var mail = req.body.mail;
  var country =  req.body.country;
  var password = req.body.password;
  var idCity = req.body.idCity;
  const token = jwt.encode({mail, password}, random128Hex())

  if(firstname && lastname && birth && mail && country && password && idCity){
    neo4jUser.findOne(mail)
    .then(userCreate => {
      if(userCreate){
        res.status(422).send("Email address already used !");
      } else {
        password = sha1(password + "toofarfar");
        const resultPromise = session.run(
          'CREATE (n :User {firstname:"' + firstname + '", ' +
          'lastname:"' + lastname + '", ' +
          'birth: "' + birth + '", ' +
          'mail:"' + mail + '", ' +
          'password:"' + password + '", ' +
          'token:"' + token + '", ' +
          'country:"' + country + '"}) '+
          'RETURN n',
        );

        resultPromise.then(result => {
          const records = result.records;
          var el = records[0].get(0);
          var user = {
            "id" : el.identity.low,
            "firstname" : el.properties.firstname,
            "lastname" : el.properties.lastname,
            "mail" : el.properties.mail,
            "country" : el.properties.country,
            "birth" : el.properties.birth,
            "token" : el.properties.token,
          };

          neo4jCity.createLinkUser(user.id, idCity)
          .then(c => {
            if(c){
              user.at = c;
              var returnValue = {
                "token" : user.token,
              };
              res.send(returnValue);
            } else {
              console.log('Error : Creation Link At City');
              res.status(500).send('Error : Creation Link At City');
            }
          })
          .catch( error => {
            console.log('Error : ' + error);
            res.status(500).send('Error : ' + error);
          });
        })
        .catch( error => {
          console.log('Error : ' + error);
          res.status(500).send('Error : ' + error);
        });
      }
    })
    .catch(err => {
      console.log('Error : ' + error);
      res.status(500).send('Error : ' + error);
    });

  }
  else {
    console.log("Un des champs n'est pas valide !");
    res.status(500).send("Un des champs n'est pas valide !");
  }

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

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './img/')
  },
  filename: function (req, file, cb) {
    var extention = file.originalname.split('.')[1];
    var imgLink = userAvatar(currentUser.id);
    if(imgLink){
      imgLink = './' + imgLink;
      fs.unlinkSync(imgLink);
    }

    cb(null, currentUser.id + "." + extention);
  },
  onError : function(err, next) {
    console.log('error', err);
    next(err);
  }
})
var upload = multer({ storage: storage })

router.get('/userInfo', function(req, res, next) {
  let id = currentUser.id

  if(id){
    const resultPromise = session.run(
      'MATCH (n :User)-[:AT]->(c :City) WHERE ID(n) = ' + id + ' RETURN n,c',
    );

    resultPromise.then(result => {
      const records = result.records;
      var el = records[0].get(0);
      var c = records[0].get(1);
      var countryCode = "https://www.countryflags.io/" + c.properties.countryCode + "/shiny/64.png";
      var city = {
        "id" : c.identity.low,
        "name" : c.properties.name,
        "country" : c.properties.country,
        "place_id" : c.properties.place_id,
        "location" : c.properties.location,
        "countryCode" : countryCode
      }
      var user = {
        "id" : el.identity.low,
        "firstname" : el.properties.firstname,
        "lastname" : el.properties.lastname,
        "mail" : el.properties.mail,
        "country" : el.properties.country,
        "birth" : el.properties.birth,
        "token" :  el.properties.token
      }
      user.at = city;

      var img = "http://51.75.122.187:3000/";
      var imgLink = userAvatar(user.id);
      if(imgLink)
        img += imgLink;
      else
        img += "img/default.png";
      user.avatar = img;

      res.send(user);
    })
    .catch(error => {
      console.log('Error : ' + error);
      res.status(500).send('Error : ' + error);
    });

  } else {
    console.log("Un des champs n'est pas valide !");
    res.status(500).send("Un des champs n'est pas valide !");
  }
});

router.get('/recherche/:name', function(req, res, next) {
  let name = req.params.name

  const resultPromise = session.run(
    'MATCH (n :User)-[:AT]->(c :City) Where toLower(n.firstname) CONTAINS toLower("' +  name + '") or toLower(n.lastname) CONTAINS toLower("' + name + '") RETURN n,c Order By n.firstname',
  );

  resultPromise.then(result => {
    const records = result.records;
    var returnValue = [];
    records.forEach(function(element){
      var el = element.get(0);
      var c = element.get(1);
      var countryCode = "https://www.countryflags.io/" + el.properties.countryCode + "/shiny/64.png";
      var city = {
        "id" : c.identity.low,
        "name" : c.properties.name,
        "country" : c.properties.country,
        "place_id" : c.properties.place_id,
        "location" : c.properties.location,
        "countryCode" : countryCode
      }
      var user = {
        "id" : el.identity.low,
        "firstname" : el.properties.firstname,
        "lastname" : el.properties.lastname,
        "mail" : el.properties.mail,
        "country" : el.properties.country,
        "birth" : el.properties.birth,
        "token" :  el.properties.token
      }
      user.at = city;

      var img = "http://51.75.122.187:3000/";
      var imgLink = userAvatar(user.id);
      if(imgLink)
        img += imgLink;
      else
        img += "img/default.png";
      user.avatar = img;

      returnValue.push(user);
    })

    res.send(returnValue);
  })
  .catch(error => {
    console.log('Error : ' + error);
    res.status(500).send('Error : ' + error);
  });

});
// A Delete
router.get('/', function(req, res, next) {
  const resultPromise = session.run(
    'MATCH (n :User)-[:AT]->(c :City) RETURN n,c',
  );

  resultPromise.then(result => {
    const records = result.records;
    var returnValue = [];
    records.forEach(function(element){
      var el = element.get(0);
      var user = {
        "id" : el.identity.low,
        "firstname" : el.properties.firstname,
        "lastname" : el.properties.lastname,
        "mail" : el.properties.mail,
        "country" : el.properties.country,
        "birth" : el.properties.birth,
        "token" :  el.properties.token
      }
      var img = "http://51.75.122.187:3000/";
      var imgLink = userAvatar(user.id);
      if(imgLink)
        img += imgLink;
      else
        img += "img/default.png";
      user.avatar = img;

      returnValue.push(user);

    })

    res.send(returnValue);
  })
  .catch(error => {
    console.log('Error : ' + error);
    res.status(500).send('Error : ' + error);
  });

});

router.get('/:id', function(req, res, next) {
  let id = req.params.id

  if(id){
    const resultPromise = session.run(
      'MATCH (n :User)-[:AT]->(c :City) WHERE ID(n) = ' + id + ' RETURN n,c',
    );

    resultPromise.then(result => {
      const records = result.records;
      var el = records[0].get(0);
      var c = records[0].get(1);
      var countryCode = "https://www.countryflags.io/" + c.properties.countryCode + "/shiny/64.png";
      var city = {
        "id" : c.identity.low,
        "name" : c.properties.name,
        "country" : c.properties.country,
        "place_id" : c.properties.place_id,
        "location" : c.properties.location,
        "countryCode" : countryCode
      }
      var user = {
        "id" : el.identity.low,
        "firstname" : el.properties.firstname,
        "lastname" : el.properties.lastname,
        "country" : el.properties.country,
        "birth" : el.properties.birth
      }
      user.at = city;

      var img = "http://51.75.122.187:3000/";
      var imgLink = userAvatar(user.id);
      if(imgLink)
        img += imgLink;
      else
        img += "img/default.png";
      user.avatar = img;

      res.send(user);
    })
    .catch(error => {
      console.log('Error : ' + error);
      res.status(500).send('Error : ' + error);
    });

  } else {
    console.log("Un des champs n'est pas valide !");
    res.status(500).send("Un des champs n'est pas valide !");
  }
});

router.put('/', function(req, res, next) {
  var firstname = req.body.firstname;
  var lastname = req.body.lastname;
  var birth = req.body.birth;
  var mail = req.body.mail;
  var country = req.body.country;
  var password = req.body.password;

  console.log("firstname " + firstname);
  console.log("lastname " + lastname);
  console.log("birth " + birth);
  console.log("mail " + mail);
  console.log("country " + country);
  console.log("password " + password);


  if(firstname && lastname && birth && mail && country && password){
    password = sha1(password + "toofarfar");
    const resultPromise = session.run(
      'MATCH (n :User)' +
      'WHERE ID(n) = ' + currentUser.id + ' ' +
      'SET n.firstname = "' + firstname + '", ' +
      'n.lastname = "' + lastname + '", ' +
      'n.birth = "' + birth + '", ' +
      'n.country = "' + country + '", ' +
      'n.password = "' + password + '", ' +
      'n.mail = "' + mail +  '"' +
      'RETURN n',
    );

    resultPromise.then(result => {
      const records = result.records;
      var el = records[0].get(0);
      var user = {
        "id" : el.identity.low,
        "firstname" : el.properties.firstname,
        "lastname" : el.properties.lastname,
        "mail" : el.properties.mail,
        "country" : el.properties.country,
        "birth" : el.properties.birth,
        "token" : el.properties.token,
      }
      res.send(user);
    })
    .catch(error => {
      console.log('Error : ' + error);
      res.status(500).send('Error : ' + error);
    });

  } else {
    console.log("Un des champs n'est pas valide !");
    res.status(500).send("Un des champs n'est pas valide !");
  }
});

router.delete('/', function(req, res, next) {
  var id = currentUser.id;
  const resultPromise = session.run(
    'MATCH (n :User) WHERE ID(n) = ' + id +
    ' SET n.firstname = "", n.lastname = "", n.birth = "", n.country = "", n.mail = "", n.token = "", n.password = "" RETURN n'
  );

  resultPromise.then(result => {
    const records = result.records;
    var el = records[0].get(0);
    var user = {
      "id" : el.identity.low,
      "firstname" : el.properties.firstname,
      "lastname" : el.properties.lastname,
      "mail" : el.properties.mail,
      "country" : el.properties.country,
      "birth" : el.properties.birth,
      "token" : el.properties.token,
    }

    var imgLink = userAvatar(user.id);
    if(imgLink){
      imgLink = './' + imgLink;
      fs.unlinkSync(imgLink);
    }

    res.send(user);
  })
  .catch(error => {
    console.log('Error : ' + error);
    res.status(500).send('Error : ' + error);
  });
});

router.put('/updateUserCity/:idCity', function(req, res, next) {
  var idCity = req.params.idCity;
  var id = currentUser.id;

  if(idCity){
    const resultPromise = session.run(
      'MATCH (n :User)-[l:AT]->(c),(newCity:City) WHERE ID(n) = ' + id + ' AND ID(newCity) = ' + idCity + ' DELETE l '+
      'CREATE (n)-[:AT]->(newCity) ' +
      'RETURN newCity',
    );

    resultPromise.then(result => {
      const records = result.records;
      var el = records[0].get(0);
      var countryCode = "https://www.countryflags.io/" + el.properties.countryCode + "/shiny/64.png";
      var city = {
        "id" : el.identity.low,
        "name" : el.properties.name,
        "country" : el.properties.country,
        "place_id" : el.properties.place_id,
        "location" : el.properties.location,
        "countryCode" : countryCode
      }
      res.send(city);
    })
    .catch(error => {
      console.log('Error : ' + error);
      res.status(500).send('Error : ' + error);
    });
  } else {
    console.log("Un des champs n'est pas valide !");
    res.status(500).send("Un des champs n'est pas valide !");
  }
});

router.put('/upload', upload.single('file'), function (req,res) {
  console.log(res);
  /*var tmp_path = req.file.path;
  var target_path = './img/' + req.file.originalname;

  var src = fs.createReadStream(tmp_path);
  var dest = fs.createWriteStream(target_path);
  src.pipe(dest);
  src.on('end', function() { res.send('complete'); });
  src.on('error', function(err) { res.send('error'); });*/
  res.send('ok');
});


// route recherche user sur nom et prenom




module.exports = router;
