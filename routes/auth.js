var express = require('express');
var passport = require('passport');
var neo4jUser = require('../neo4j_func/user.js');

var router = express.Router();

router.post('/login', function(req, res) {
  var mail = req.body.mail;
  var password = req.body.password;

  if(mail && password)
    neo4jUser.findOne(mail)
    .then(result => {
      if(result){
        password = sha1(password + "toofarfar");
        if(password == result.password){
          var returnValue = {
            "token" : result.token
          }

          res.send(returnValue);
        }
        else
          res.status(500).send("Mail and password not valid");

      }
      else
        res.status(500).send("User not found");
    })
    .catch(error => {
      console.log(error);
      res.status(500).send(error);
    });
  else
    res.status(500).send("Mail or password empty");
});


/*
router.get('/', function (req, res) {
  res.render('index', { user : req.user });
});

router.get('/register', function(req, res) {
  if ( req.session.passport.user != null ) {
    res.redirect('/');
  } else {
    res.render('register', {
      title : 'Sign-up'
    });
  }
});

router.post('/register', function(req, res, next) {
  Account.register(new Account({ username : req.body.username }), req.body.password, function(err, account) {
    if (err) {
      return res.render('register', { error : err.message });
    }

    passport.authenticate('local')(req, res, function () {
      req.session.save(function (err) {
        if (err) {
          return next(err);
        }
        res.redirect('/');
      });
    });
  });
});

router.get('/login', function(req, res) {
  if ( req.session.passport.user != null ) {
    res.redirect('/');
  } else {
    res.render('login', {
      user : req.user,
      title : 'Sign-in',
      subTitle : 'Come back please !'
    });
  }
});

router.post('/login', passport.authenticate('local'), function(req, res) {
  if ( req.session.passport.user != null ) {
    res.redirect('/');
  } else {
    res.redirect('/register');
  }
});

router.get('/logout', function(req, res) {
  if ( req.session.passport.user != null ) {
    req.logout();
    res.redirect('/');
  }
  else {
    res.redirect('/')
  }
});
*/

module.exports = router;
