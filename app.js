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
var auth = require('./auth');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type , Authorization');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

app.use('/', indexRouter);
app.use('/cities', citiesRouter);
app.use('/users', usersRouter);
app.use('/activities', activitiesRouter);
app.use('/tags', tagsRouter);
app.use('/follow', followRouter);
app.use('/events', eventsRouter);
app.use('/auth', auth);
/*

app.use(session({
  cookieName: 'session',
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: false
}));


app.use(passport.initialize());
app.use(passport.session());
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
