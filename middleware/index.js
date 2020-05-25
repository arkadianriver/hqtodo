//const express = require('express');
const moment = require('moment');
const business = require('moment-business');
const config = require('config');

const WHOAMI = config.get('yourName');
const LINKPATTERNS = config.get('linkmeLinks');
const WH = config.get('workHoursPerDay');
const HOURADJUST = 24 / WH; // 24hr day / 8hr workday
const STORYPOINTFACTOR = config.get('storyPointsPerDay') / 24;

const A_DAY = moment.duration(1, 'd');

// debug helpers
const lg = data => console.log(data);
const pp = data => '<pre>' + JSON.stringify(data, null, 2) + '</pre>';


/**
 * returns all tags in a tag array as a string, except "time estimate tags,"
 * which it normalizes into hours adjusted according to the HOURADJUST
 * configuration constant.
 * 
 * @param {Object[]} tags - list of \@tags
 */
const _handleTags = (tags) => {
  if (!tags || tags.length == 0) return [2 * HOURADJUST, ''];
  let est = 2;
  let tagstring = '';
  for (let i = 0; i < tags.length; i++) {
    if (tags[i].match(/(?:@low|@today|@high|@done|@project)/)) {
      continue;
    } else if (tags[i].match(/@\d/)) {
      est = parseInt(tags[i].slice(1, -1), 10);
      if (tags[i].slice(-1) === 'd') est = WH * est; // conv days to hours
    } else {
      tagstring += `${tags[i]} `;
    }
  }
  const estimate = est * HOURADJUST;
  return [estimate, tagstring.trimRight()];
}


/**
 * Take the first link-search-pattern in the todo (assumes only one per todo)
 * and return the defined URL pattern.
 */
const _getLinkUrl = (str) => {
  for (pat of LINKPATTERNS) {
    // assist https://stackoverflow.com/a/494046
    const searchpat = new RegExp(`\\b${pat.pattern}\\b`);
    const matched = str.match(searchpat);
    if (matched) {
      return matched[0].replace(searchpat, pat.url);
    }
  }
  return null;
}


/**
 * A process in the pipeline that takes an array of todo strings and
 * breaks it up into the initial `issues` data structure.
 */
exports.parseRawTodos = () => {
  return (req, res, next) => {
    // define the desired structure
    const issues = {
      open: {
        active: [],
        pending: []
      },
      closed: [],
      interrupts: [],
      links: []
    }
    // parse each line and push the data record to the right place in the structure
    for (let i = 0, j = 1; i < res.locals.rawTodos.length; i++) {
      // breaking up regex into 3 passes:
      // 1. get open/closed state, optional pipeline, and title
      let m = res.locals.rawTodos[i].match(/\s*([☐✔])\s(@low|@today|@high)?([^\@]+)@?/);
      let m1 = [...res.locals.rawTodos[i].matchAll(/@\w+/g)];                  // 2. get tags
      let m2 = res.locals.rawTodos[i].match(/@done\s*\((\d\d\d\d-\d\d-\d\d)/); // 3. get done date
      if (m) {
        // skip Frozens
        if (m[2] && m[2] == '@low') continue;
        // quickly grab linkUrl if any
        let linkUrl = m[3] ? _getLinkUrl(m[3]) : null;
        if (linkUrl) issues.links.push({ id: `k${j.toString()}`, url: linkUrl });
        // quickly add interrupts
        if (m[3].match(/^\[/)) {
          const m4 = m[3].match(/^\[(\d+d) starting (\d\d\d\d-\d\d-\d\d)\]: (.*)$/);
          if (m4) {
            issues['interrupts'].push({
              number: j,
              startdate: m4[2],
              title: m4[3],
              est: m4[1]
            });
          }
          j++;
          continue;
        }
        // handle the rest
        const taggy = _handleTags(m1.flat());
        let title = m[3].trim();
        let tagstring = taggy[1];
        let est = Math.ceil(taggy[0]).toString() + 'h';
        if (m[1] === '✔') {  // the Dones
          issues['closed'].push({
            closed_on: m2[1],
            title: title,
            tagstring: tagstring,
            est: (taggy[0] * STORYPOINTFACTOR).toFixed(2)
          });
        } else {            // the Opens
          switch (m[2]) {
            case '@today':              // the actives
              issues['open']['active'].push({
                number: j,
                title: title,
                tagstring: tagstring,
                link: linkUrl,
                est: est
              });
              break;
            case '@high':               // the active criticals
              issues['open']['active'].push({
                number: j,
                title: title,
                tagstring: tagstring,
                est: est,
                link: linkUrl,
                color: "crit, "
              })
              break;
            default:                    // the Pendings
              issues['open']['pending'].push({
                number: j,
                title: title,
                tagstring: tagstring,
                link: linkUrl,
                est: est
              });
          }
        }
        j++;
      }
    }
    // sort interrupts and closed before returning
    if (issues.interrupts) issues.interrupts.sort((a, b) => a.startdate < b.startdate ? -1 : 1);
    if (issues.closed) issues.closed.sort((a, b) => a.closed_on > b.closed_on ? -1 : 1);
    res.locals.issues = issues;
    next();
  }
}


/**
 * Process in the pipeline that takes the existing issues data structure
 * and inserts the interrupts into their date-specific location in the
 * correct order, according to the durations of the time between today's
 * date and their start dates.
 * 
 * Using `moment-business` to capture the interval between last interrupt
 * end date and start of next interrupt, in weekdays only. Using `moment`
 * itself to subtract time for each iterated todo and to add time to
 * capture the duration of each interrupt when determining end date
 */
exports.injectInterrupts = () => {
  return (req, res, next) => {
    if (!res.locals.issues['interrupts']) {
      next();
    } else {
      let endoflastinterrupt = moment(); // initialize
      // foreach interrupt loop through all todos (in each pipeline)
      for (let i = 0; i < res.locals.issues['interrupts'].length; i++) {
        const interruptstart = moment(res.locals.issues['interrupts'][i]['startdate'], 'YYYY-MM-DD');
        const biz_duration = moment.duration(business.weekDays(endoflastinterrupt, interruptstart), 'days');
        openpipes: for (const pipeidx of ['active', 'pending']) {
          pipetodos: for (let tidx = 0; tidx < res.locals.issues['open'][pipeidx].length; tidx++) {
            if (!res.locals.issues['open'][pipeidx][tidx]['startdate']) {
              const estStr = res.locals.issues['open'][pipeidx][tidx]['est'].slice(0, -1);
              const est = parseInt(estStr, 10);
              if (biz_duration.subtract(est, 'hours') < A_DAY) {
                // found the insert spot!
                res.locals.issues['open'][pipeidx].splice(tidx, 0, res.locals.issues['interrupts'][i]);
                break openpipes; // next interrupt
              }
            }
          }
        }
        // calculate new endoflastinterrupt
        const estStr = res.locals.issues['interrupts'][i]['est'].slice(0, -1);
        const est = parseInt(estStr, 10);
        endoflastinterrupt = business.addWeekDays(interruptstart, est);
      }
    }
    delete res.locals.issues.interrupts;
    next();
  }
}


/**
 * Process in the pipeline that assigns each open todo a previous todo number
 * for the gantt stagger, except interrupts, which start on exact dates.
 * Also adds "color" strings.
 */
exports.prevnumsForGantt = () => {
  return (req, res, next) => {
    const prevnum = {};
    for (const s of ['active', 'pending']) {
      res.locals.issues.open[s].forEach((todo, i) => {
        if (todo.startdate) { // interrupt found
          todo.prevtask = todo.startdate;
          delete todo.startdate;
          todo.color = 'done, ';
        } else {
          todo.prevtask = prevnum[s] ? 'after k' + prevnum[s] : moment().format('YYYY-MM-DD');
          if (!todo.color) todo.color = todo.link ? 'active, ' : '';
        }
        prevnum[s] = todo.number.toString();
      });
    }
    if (res.locals.issues.open.pending[0].color !== 'done, ') {
      res.locals.issues.open.pending[0].prevtask = `after k${prevnum.active}`;
    }
    next();
  }
}


/**
 * Put rawArchive into usable JSON and sort it
 */
exports.getArchive = () => {
  return (req, res, next) => {
    // define the desired structure
    const entries = [];
    // go through each rawArchive entry and add to entries entry
    for (let i = 0; i < res.locals.rawArchive.length; i++) {
      let mTitle = res.locals.rawArchive[i].match(/\s*✔\s([^\@]+)@?/);
      let mTags = [...res.locals.rawArchive[i].matchAll(/@\w+/g)];
      let mDone = res.locals.rawArchive[i].match(/@done\s*\((\d\d\d\d-\d\d-\d\d(\s*\d\d:\d\d)?)\)(?:\s+@project\(Todos\))?\s*$/);
      if (!mDone) continue;
      const taggy = _handleTags(mTags.flat());
      const doneStr = mDone[2] ? mDone[1] : `${mDone[1]} 17:00`;
      let title = mTitle[1].trim();
      let tagstring = taggy[1];
      entries.push({
        closed_on: doneStr,
        title: title,
        tagstring: tagstring,
        est: (taggy[0] * STORYPOINTFACTOR).toFixed(2)
      });
    }
    // sort entries, descending for archive
    entries.sort((a, b) => a.closed_on > b.closed_on ? -1 : 1);
    res.locals.entries = entries;
    // prepare data, ascending for cumulative flow chart
    const chartdata = [];
    let spTotal = 0;
    Array.from(entries).reverse().forEach( t => {
      spTotal += Number.parseFloat(t.est);
      chartdata.push({
        x: t.closed_on,
        y: (spTotal).toFixed(2)
      });
    });
    res.locals.chartdata = chartdata;
    next();
  }
}


/**
 * take sorted JSON archive and swizzle it into weekly chunks
 */
exports.getArchiveByWeek = () => {
  return (req, res, next) => {
    // 0. If empty provided, return empty - assist https://stackoverflow.com/a/24403771/5360420
    if (!Array.isArray(res.locals.entries) || !res.locals.entries.length) {
      res.locals.archive = [];
      next();
      return;
    }
    // 1. initialize things
    const archive = [];
    const entries = res.locals.entries;
    const firstDate = entries[0].closed_on.slice(0, 10);
    // 2. init weekN and weekN-1, where weekN is the most recent Sunday before the first entry
    let weekN = moment(firstDate).isoWeekday() === 7
      ? firstDate
      : moment(firstDate).isoWeekday(7).format('YYYY-MM-DD');
    let weekNminusOne = moment(weekN).subtract(7, 'd').format('YYYY-MM-DD');
    // 3. cycle through weeks, adding entries for each.
    //    Note: ends in the middle while iterating through entries, so the for loop's while condition
    //          must include the _last case_ where entries.length == 0
    weekIterations:
    for (let e = entries.shift(), w = 0; entries.length >= 0; w++) {
      archive[w] = { weekEnding: weekN, entries: [] };
      entriesPerWeek:
      while (e.closed_on.slice(0, 10) > weekNminusOne) {
        archive[w].entries.push(e);
        if (entries.length !== 0) {
          e = entries.shift();
        } else {
          break weekIterations;
        }
      }
      weekN = weekNminusOne;
      weekNminusOne = moment(weekNminusOne).subtract(7, 'days').format('YYYY-MM-DD');
    }
    // 4. Return the results
    res.locals.archive = archive;
    next();
  }
}


/**
 * Takes resulting data structure from all the things and renders it to the page view
 */
exports.renderIt = () => {
  return (req, res, next) => {
    let fileupdated = moment(res.locals.todoFileUpdated).utc().format();
    let pageupdated = moment().utc().format();
    res.render('index', {
      issues: res.locals.issues,
      archive: res.locals.archive,
      jsonchartdata: JSON.stringify(res.locals.chartdata),
      fileupdated: fileupdated,
      pageupdated: pageupdated,
      whoami: WHOAMI
    });
  }
}


// Expose "private" methods for testing
// assist https://stackoverflow.com/a/57212354/5360420
if (process.env.NODE_ENV === 'test') {
  exports._handleTags = _handleTags;
  exports._getLinkUrl = _getLinkUrl;
}
