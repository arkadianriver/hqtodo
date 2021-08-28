var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const fs = require('fs');
const config = require('config');

const TODOFILE = config.get('todoFile');

var indexRouter = require('./routes/index');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// merge our original static path with react's for backward compatibility
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.resolve(__dirname, 'client-react-carbon/build')));

/**
 * Sets a variable (timestamp incl. milliseconds) to be used by clients
 * And returns boolean, used to determine whether to reload TODOFILE
 */
const _isFileUpdated = () => {
  const fileStats = fs.statSync(TODOFILE);
  if (app.locals.todoFileUpdated &&
      app.locals.todoFileUpdated.valueOf() == fileStats.mtime.valueOf()) {
    return false;
  } else {
    app.locals.todoFileUpdated = fileStats.mtime;
    return true;
  };
}

app.use((req, res, next) => {
  console.log(`\nFrom address ${req.socket.remoteAddress}`);
  next();
})

/**
 * Want to reload TODOFILE to repopulate the locals vars
 * only if user updated it on disk
 */
app.use((req, res, next) => {

  if ( _isFileUpdated() ) {

    const fileData = fs.readFileSync(TODOFILE, 'utf8');

    if (fileData) {
      const rawTodos = [];
      const rawArchive = [];
      const rawTaginfo = [];
      const fileArray = fileData.split(/\r?\n/);
      let activeSection = '';
      for (i=0; i < fileArray.length; i++) {
        const projHead = fileArray[i].match(/^(\S.+):\s*$/);
        if (projHead && projHead.length > 1) {
          activeSection = projHead[1];
          continue;
        }
        if (activeSection === 'Taginfo') {
          let m = fileArray[i].match(/^\s*([☐✔].*)$/);
          if (m) rawTaginfo.push(m[1].trim());
        }
        if (activeSection === 'Todos') {
          let m = fileArray[i].match(/^\s*([☐✔].*)$/);
          if (m) rawTodos.push(m[1].trim());
        }
        if (activeSection === 'Archive') {
          let m = fileArray[i].match(/^\s*(✔.*)$/);
          if (m) rawArchive.push(m[1].trim());
        }
      }
      app.locals.rawTaginfo = rawTaginfo;
      app.locals.rawTodos = rawTodos;
      app.locals.rawArchive = rawArchive;
    } else {
      next(Error('Server error. Could not retrieve the todo list file.'));
    }
  }

  next();

});

app.use('/', indexRouter);

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
