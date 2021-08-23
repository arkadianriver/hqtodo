const express = require('express');
const path = require('path');
const router = express.Router();

const mw = require('../middleware/index');

// debug helpers
const pp = data => '<pre>' + JSON.stringify(data, null, 2) + '</pre>';

/**
 * All the routes, which are currently for debugging purposes except the default
 * '/', which renders the view. The JSON might be useful to other views, such as
 * a burndown chart, which I want to provide eventually
 */

router.get('/todos/filelastupdated', (req, res, next) => {
  res.json(req.app.locals.todoFileUpdated);
})

router.get('/todos/raw', (req, res, next) => {
  res.json({
    filelastupdated: req.app.locals.todoFileUpdated,
    rawTaginfo: req.app.locals.rawTaginfo,
    rawTodos: req.app.locals.rawTodos,
    rawArchive: req.app.locals.rawArchive
  });
});

router.get('/todos/unordered', mw.parseRawTodos(), (req, res, next) => {
  res.json(res.locals.issues);
});

router.get('/todos', mw.parseRawTodos(), mw.injectInterrupts(), (req, res, next) => {
  res.json(res.locals.issues);
});

router.get('/todos/archived', mw.getArchive(), (req, res, next) => {
  res.json(res.locals.entries);
});

router.get('/todos/tags', mw.parseRawTodos(), mw.getArchive(), mw.getTags(), (req, res, next) => {
  res.json({
    taginfo: res.locals.taginfo,
    tags: res.locals.tags
  });
});

router.get('/todos/tags/:tagname', mw.parseRawTodos(), mw.getArchive(), mw.getTagData(), (req, res, next) => {
  res.json(res.locals.tagdata);
});

router.get('/todos/searchdata', mw.parseRawTodos(), mw.getArchive(), mw.getSearchData(), (req, res, next) => {
  res.json(res.locals.searchData);
});

router.get('/todos/supportdata', mw.getArchive(), mw.getSupport(), (req, res, next) => {
  res.json(res.locals.supportentries);
});
  
router.get('/todos/supportondate/:ondate', mw.getSupport(), (req, res, next) => {
  res.json(res.locals.supportondate);
});

router.get('/todos/archivedbytag', mw.getArchive(), mw.getArchiveByTag(), (req, res, next) => {
  res.json(res.locals.archivebytag);
});

router.get('/todos/archivedbyweek', mw.getArchive(), mw.getArchiveByWeek(), (req, res, next) => {
  res.json(res.locals.archivebyweek);
});

router.get('/doc', (req, res, next) => {
  res.render('apidoc');
});

router.get('/ejs/tags/:tagname',
  mw.parseRawTodos(),
  mw.getArchive(),
  mw.getTags(),
  mw.getTagData(),
  mw.getSearchData(),
  mw.renderTagPage()
);

router.get('/api/tags/:tagname',
  mw.parseRawTodos(),
  mw.getArchive(),
  mw.getTags(),
  mw.getTagData(),
  mw.getSearchData(),
  mw.renderTagPage('api')
);

router.get('/ejs',
  mw.parseRawTodos(),
  mw.injectInterrupts(),
  mw.getArchive(),
  mw.getTags(),
  mw.getSearchData(),
  mw.getSupport(),
  mw.getArchiveByTag(),
  mw.getArchiveByWeek(),
  mw.renderIt()
);

router.get('/webc',
  mw.parseRawTodos(),
  mw.injectInterrupts(),
  mw.getArchive(),
  mw.getTags(),
  mw.getSearchData(),
  mw.getSupport(),
  mw.getArchiveByTag(),
  mw.getArchiveByWeek(),
  mw.renderIt('webc')
);

router.get('/api',
  mw.parseRawTodos(),
  mw.injectInterrupts(),
  mw.getArchive(),
  mw.getTags(),
  mw.getSearchData(),
  mw.getSupport(),
  mw.getArchiveByTag(),
  mw.getArchiveByWeek(),
  mw.renderIt('api')
);

router.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../client-react-carbon/build', 'index.html'));
})


module.exports = router;
