const express = require("express");
const path = require("path");
const router = express.Router();

const mw = require("../middleware/index");

// init doc object for custom doc
const expressDoc = require("../utils/expressDoc");
const doc = new expressDoc();

// debug helpers
const pp = (data) => "<pre>" + JSON.stringify(data, null, 2) + "</pre>";

/**
 * All the routes, which are currently for debugging purposes except the default
 * '/', which renders the view. The JSON might be useful to other views, such as
 * a burndown chart, which I want to provide eventually
 */

doc.setRoute(
  router,
  "get",
  "/todos/filelastupdated",
  `Timestamp in milliseconds when the TODO file was last modified.
  For client polling to check if the file data needs to be reloaded.`,
  (req, res, next) => {
    res.json(req.app.locals.todoFileUpdated);
  }
);

doc.setRoute(
  router,
  "get",
  "/todos/raw",
  `Entries from TODO file (or cache), filtered to only archived, open,
  and taginfo.`,
  (req, res, next) => {
    res.json({
      filelastupdated: req.app.locals.todoFileUpdated,
      rawTaginfo: req.app.locals.rawTaginfo,
      rawTodos: req.app.locals.rawTodos,
      rawArchive: req.app.locals.rawArchive,
    });
  }
);

doc.setRoute(
  router,
  "get",
  "/todos/unordered",
  "Open items, with all metadata except gantt ordering info.",
  mw.parseRawTodos(),
  (req, res, next) => {
    res.json(res.locals.issues);
  }
);

doc.setRoute(
  router,
  "get",
  "/todos",
  "Open items, with interrupt and ordering for mermaid.",
  mw.parseRawTodos(),
  mw.injectInterrupts(),
  (req, res, next) => {
    res.json(res.locals.issues);
  }
);

doc.setRoute(
  router,
  "get",
  "/todos/archived",
  "Archived items, with metadata extracted",
  mw.getArchive(),
  (req, res, next) => {
    res.json(res.locals.entries);
  }
);

doc.setRoute(
  router,
  "get",
  "/todos/tags",
  `(1) title and link for tags in Taginfo section of TODO file.
  (2) list of all tags, with classs and counts.`,
  mw.parseRawTodos(),
  mw.getArchive(),
  mw.getTags(),
  (req, res, next) => {
    res.json({
      taginfo: res.locals.taginfo,
      tags: res.locals.tags,
    });
  }
);

doc.setRoute(
  router,
  "get",
  "/todos/tags/:tagname",
  "The active, done, and archived entries and chart data for the specifiec tag.",
  mw.parseRawTodos(),
  mw.getArchive(),
  mw.getTagData(),
  (req, res, next) => {
    res.json(res.locals.tagdata);
  }
);

doc.setRoute(
  router,
  "get",
  "/todos/searchdata",
  "All the things, with tag array and which state it's in.",
  mw.parseRawTodos(),
  mw.getArchive(),
  mw.getSearchData(),
  (req, res, next) => {
    res.json(res.locals.searchData);
  }
);

doc.setRoute(
  router,
  "get",
  "/todos/supportdata",
  "All support entries, with time in minutes.",
  mw.getArchive(),
  mw.getSupport(),
  (req, res, next) => {
    res.json(res.locals.supportentries);
  }
);

doc.setRoute(
  router,
  "get",
  "/todos/supportondate/:ondate",
  "Support item list and total time string for a given date.",
  mw.getSupport(),
  (req, res, next) => {
    res.json(res.locals.supportondate);
  }
);

doc.setRoute(
  router,
  "get",
  "/todos/archivedbytag",
  "Archived items, grouped by tag with group est totals.",
  mw.getArchive(),
  mw.getArchiveByTag(),
  (req, res, next) => {
    res.json(res.locals.archivebytag);
  }
);

doc.setRoute(
  router,
  "get",
  "/todos/archivedbyweek",
  "Archived items, grouped by week (ending Sunday)",
  mw.getArchive(),
  mw.getArchiveByWeek(),
  (req, res, next) => {
    res.json(res.locals.archivebyweek);
  }
);

doc.setRoute(
  router,
  "get",
  "/ejs/tags/:tagname",
  `All active, done, archived, and chartdata for given tag.
  (server-side view rendering)`,
  mw.parseRawTodos(),
  mw.getArchive(),
  mw.getTags(),
  mw.getTagData(),
  mw.getSearchData(),
  mw.renderTagPage()
);

doc.setRoute(
  router,
  "get",
  "/ejs",
  "Classic server-rendered view of all the things",
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

doc.setRoute(
  router,
  "get",
  "/webc",
  `Half-started Web component rendering of all the stuff.
  Project stopped in favor of React.`,
  mw.parseRawTodos(),
  mw.injectInterrupts(),
  mw.getArchive(),
  mw.getTags(),
  mw.getSearchData(),
  mw.getSupport(),
  mw.getArchiveByTag(),
  mw.getArchiveByWeek(),
  mw.renderIt("webc")
);

doc.setRoute(
  router,
  "get",
  "/api",
  `All the things, and I mean _all_, for consumption by React client.
  TODO: Determine where you want what for optimum client-server efficiency,
  pushing some of the swizzling to the client, and prune this data accordingly.`,
  mw.parseRawTodos(),
  mw.injectInterrupts(),
  mw.getArchive(),
  mw.getTags(),
  mw.getSearchData(),
  mw.getSupport(),
  mw.getArchiveByTag(),
  mw.getArchiveByWeek(),
  mw.renderIt("api")
);

doc.setRoute(
  router,
  "get",
  "/api/tags/:tagname",
  `All active, done, archived, and chartdata for given tag.
  (server-side swizzling for client rendering)
  (deprecated - swizzling done on client now)`,
  mw.parseRawTodos(),
  mw.getArchive(),
  mw.getTags(),
  mw.getTagData(),
  mw.getSearchData(),
  mw.renderTagPage("api")
);

doc.setRoute(
  router,
  "get",
  "/api/doc",
  "Documentation data for the Express server portion of hqTodo.",
  (req, res) => {
    //console.log(indexRouter.stack);
    res.json(doc.contents);
  }
);

doc.setRoute(
  router,
  "get",
  "*",
  "All other routes handled by the client application.",
  (req, res) => {
    res.sendFile(
      path.resolve(__dirname, "../client-react-carbon/build", "index.html")
    );
  }
);

exports.doc = doc;
exports.indexRouter = router;
