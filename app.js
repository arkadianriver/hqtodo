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
app.use(express.static(path.join(__dirname, 'public')));

const _isFileUpdated = () => {
  const fileStats = fs.statSync(TODOFILE);
  // TODO: filelastupdated shows same tstamp as displaypage - console.log(fileStats.mtime.valueOf())
  if (app.locals.todoFileUpdated &&
      app.locals.todoFileUpdated.valueOf() == fileStats.mtime.valueOf()) {
    return false;
  } else {
    app.locals.todoFileUpdated = fileStats.mtime;
    return true;
  };
}

/**
 * After testing, put this in a configurable module that returns the file
 * regardless of if it's stored locally, in Box, Dropbox, Google Docs, whatever.
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
