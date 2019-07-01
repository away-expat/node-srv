var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var citiesRouter = require('./routes/cities');
var usersRouter = require('./routes/users');
var activitiesRouter = require('./routes/activities');
var tagsRouter = require('./routes/tags');
var followRouter = require('./routes/follow');
var eventsRouter = require('./routes/events');
var auth = require('./routes/auth');
var infos = require('./routes/infos');
var cors = require('cors')

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(cors())

app.use('/', indexRouter);
app.use('/cities', citiesRouter);
app.use('/users', usersRouter);
app.use('/activities', activitiesRouter);
app.use('/tags', tagsRouter);
app.use('/follow', followRouter);
app.use('/events', eventsRouter);
app.use('/auth', auth);
app.use('/infos', infos);
app.use('/img', express.static('img'));



/*
var passport = require('passport');
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var config = require('./oAuth.js');
var neo4jUser = require('./neo4j_func/user.js');

// ICI
var authentification = require('./routes/authentification');
app.use('/authentification/', authentification);

var session = require('express-session');
app.use(session({
  cookieName: 'session',
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: false
}));



//ICI
passport.use('google', new GoogleStrategy({
      clientID        : config.google.clientID,
      clientSecret    : config.google.clientSecret,
      callbackURL     : config.google.callbackURL,
      profileFields: ['id', 'emails', 'name']
    },
    function(access_token, refresh_token, profile, done) {
      process.nextTick(function() {
        var mail = profile.emails[0].value;
        var lastname = profile.name.familyName;
        var firstname = profile.name.givenName;

        neo4jUser.findOne(mail)
        .then(user => {
          if (user)
            return done(null, user);
          else {
            neo4jUser.createGoogleConnexion(firstname, lastname, mail)
            .then(result => {
              return done(null, result);
            })
            .catch(error => {
              console.log(error);
              return done(error);
            });
          }

        })
        .catch(error => {
          console.log(error);
          return done(error);
        });
      });
    }
));
*/


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
