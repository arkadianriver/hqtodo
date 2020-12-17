const moment = require('moment-business-days');

const config = require('config');

const WHOAMI = config.get('yourName');
const LINKPATTERNS = config.get('linkmeLinks');
const WH = config.get('workHoursPerDay');
const HOURADJUST = 24 / WH; // 24hr day / 8hr workday
const STORYPOINTFACTOR = config.get('storyPointsPerDay') / 24;

const A_DAY = moment.duration(1, 'd');

// debug helpers
const lg = data => console.log(data);
const pp = data => lg('<pre>'+JSON.stringify(data, null, 2)+'</pre>');


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
      milestones: [],
      interrupts: [],
      links: []
    }
    // parse each line and push the data record to the right place in the structure
    for (let i = 0, j = 1; i < req.app.locals.rawTodos.length; i++) {
      // breaking up regex into 3 passes:
      // 1. get open/closed state, optional pipeline, and title
      let m = req.app.locals.rawTodos[i].match(/\s*([☐✔])\s(@low|@today|@high)?([^\@]+)@?/);
      let m1 = [...req.app.locals.rawTodos[i].matchAll(/@\w+/g)];                  // 2. get tags
      let m2 = req.app.locals.rawTodos[i].match(/@done\s*\((\d\d\d\d-\d\d-\d\d)/); // 3. get done date
      if (m) {
        // skip Frozens
        if (m[2] && m[2] == '@low') continue;
        // quickly grab linkUrl if any
        let linkUrl = m[3] ? _getLinkUrl(m[3]) : null;
        if (linkUrl) issues.links.push({ id: `k${j.toString()}`, url: linkUrl });
        // quickly add milestones and interrupts
        if (m[3].match(/^\[/)) {
          const m4 = m[3].match(/^\[(\d+d) starting (\d\d\d\d-\d\d-\d\d)\]: (.*)$/);
          if (m4) {
            const numdays = parseInt(m4[1].slice(0, -1), 10);
            if (numdays === 0) {           // milestone
              issues['milestones'].push({
                number: j,
                startdate: m4[2] + 'T00:00:00',
                enddate: m4[2],
                title: m4[3],
                color: 'milestone, ',
                est: m4[1]
              });
            } else {                       // interrupt
              const enddate = moment(m4[2])
                .businessAdd(numdays - 1, 'days')
                .format('YYYY-MM-DD');
              issues['interrupts'].push({
                number: j,
                startdate: m4[2],
                enddate: enddate,
                title: m4[3],
                est: m4[1]
              });
            }
            j++;
            continue;
          }
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
    // sort milestones, interrupts, and closed before returning
    if (issues.milestones) issues.milestones.sort((a, b) => a.startdate < b.startdate ? -1 : 1);
    if (issues.interrupts) issues.interrupts.sort((a, b) => a.startdate < b.startdate ? -1 : 1);
    if (issues.closed) issues.closed.sort((a, b) => a.closed_on > b.closed_on ? -1 : 1);
    res.locals.issues = issues;
    next();
  }
}

/**
 * Return provided moment in the format needed, either now or the next business day
 * as either a moment or as a string
 *
 * @param { Moment } myMoment - Actual date to convert to biz date
 * @param { Boolean } asString - Whether to return as string (default undefined 'falsey')
 */
const _getBizStart = (myMoment, asString) => {
  //initialize to today (or first avail biz day)
  if (!myMoment.isBusinessDay()) myMoment.startOf('day').nextBusinessDay();
  return asString ? myMoment.format('YYYY-MM-DD') : myMoment;
}

/**
 * We gotta account for the weekends in our range of time. So, with our known total
 * numBizDays, I see three scenarios:
 * 
 * 0: The range all happens before Saturday, push the start and stop time, no problem
 * 1: The range contains only one weekend, calculate this week's days, next week's days,
 *    and push each of 'em.
 * 2: The range contains 2+ weekends, push the first week's days, loop through and push
 *    the solid 5-day weeks in-between, push the last week's days.
 */
const _chunkRange = (rangeStart, rangeEnd, numBizDays, todoRangeArray) => {
  let scenario = 0;
  let startDay = moment(rangeStart).isoWeekday();
  // Normalize rangeEnd to itself or if a weekend or Monday to a Saturday.
  rangeEnd = moment(rangeEnd).startOf('day').prevBusinessDay().add(1,'d').format('YYYY-MM-DD');
  // Initialize a few things we might need later, depending on the scenario:
  let endDay = moment(rangeEnd).startOf('day').isoWeekday();
  // - last day of the first week (when needed) is Friday
  const firstEnd = moment(rangeStart).isoWeekday(6).format('YYYY-MM-DD');
  // - start day of last week (when needed) is the monday before
  const finalStart = moment(rangeEnd).isoWeekday(1).format('YYYY-MM-DD');
  // Better 'splain this dense switch..
  // It determines the type of scenario based on how many days there are in the
  // range, testing where weekends fall based on the start day M-F (ISO 1-5)
  // For example: case 1 (Monday) is scenario 0 (one week) if the range is <= 5 days,
  //   scenario 1 (two weeks) if <= 10 days, and scenario 2 (two weeks plus) otherwise.
  //   Tue - Fri follow the same pattern but with different day offsets.
  switch (startDay) {
    case 1: scenario = numBizDays <= 5 ? 0 : numBizDays <= 10 ? 1 : 2; break;
    case 2: scenario = numBizDays <= 4 ? 0 : numBizDays <=  9 ? 1 : 2; break;
    case 3: scenario = numBizDays <= 3 ? 0 : numBizDays <=  8 ? 1 : 2; break;
    case 4: scenario = numBizDays <= 2 ? 0 : numBizDays <=  7 ? 1 : 2; break;
    case 5: scenario = numBizDays <= 1 ? 0 : numBizDays <=  6 ? 1 : 2; break;
    // if a weekend, assume next business day (Monday)
    default: scenario = numBizDays <= 5 ? 0 : numBizDays <= 10 ? 1 : 2; break;
  }
  // Handle our scenario
  switch (scenario) {
    case 0: // a week or less
      todoRangeArray.push({ start: rangeStart, end: rangeEnd });
      break;
    case 1: // between a week and two weeks
      todoRangeArray.push({ start: rangeStart, end: firstEnd });
      todoRangeArray.push({ start: finalStart, end: rangeEnd });
      break;
    case 2: // more than two weeks
      // find num days in first week
      const wFirst = Math.round(moment.duration(
        moment(firstEnd).startOf('day').diff(moment(rangeStart).startOf('day'))
      ).days());
      // find num days in last week
      const wLast = Math.round(moment.duration(
        moment(rangeEnd).startOf('day').diff(moment(finalStart).startOf('day'))
      ).days());
      // find number of weeks in-between
      const numWeeks = Math.floor( ( numBizDays - (wFirst + wLast) ) / 5 );
      // push them to the array of ranges:
      // - the first weeks' days
      todoRangeArray.push({ start: rangeStart, end: firstEnd });
      // - each of the weeks in between
      let istart = moment(rangeStart).isoWeekday(8); // the next monday
      let iend = moment(firstEnd).isoWeekday(13); // the next saturday
      for (i=0;i < numWeeks;i++) {
        todoRangeArray.push({ start: istart.format('YYYY-MM-DD'), end: iend.format('YYYY-MM-DD') });
        istart.add(7);
        iend.add(7);
      }
      // - the last weeks' days
      todoRangeArray.push({ start: finalStart, end: rangeEnd });
      break;
  }
}


/**
 * Go through interrupts and return an array of ranges where todos can be filled.
 * Already factor in business days and leave an open-ended range afterward.
 * Remember: assigned moments are mutated by the moment methods!!!
 * Also: Assumes interrupts do not start on weekends.
 */
const _getRangeArray = (interruptArray) => {
  let endOfLast = moment().startOf('day');
  const todoRangeArray = [];
  interruptArray.forEach( event => {
    // if the start date comes after the endOfLast event, we have some time to fill;
    // that is.. if there are business days between.
    const numBizDays = moment(event.startdate).businessDiff(_getBizStart(endOfLast), true);
    if (numBizDays > 0) {
      _chunkRange(endOfLast.format('YYYY-MM-DD'), event.startdate, numBizDays, todoRangeArray);
    }
    // regardless, check if we've extended our endOfLast date (that we use to compare to above)
    if (moment(event.enddate).isAfter(endOfLast)) {
      endOfLast = moment(event.enddate);
    }
  });
  // leave the end open-ended (pretty much) (add 12 more biz weeks)
  // hard-coded and not locale-specific, but meh.
  let newCursor = endOfLast.nextBusinessDay();
  todoRangeArray.push({
    start: newCursor.format('YYYY-MM-DD'),
    end: newCursor.isoWeekday(6).format('YYYY-MM-DD')
  });
  todoRangeArray.push({
    start: newCursor.isoWeekday(6).add(2,'d').format('YYYY-MM-DD'),
    end: newCursor.add(5,'d').format('YYYY-MM-DD')
  });
  for (i=0; i<12; i++) {
    todoRangeArray.push({
      start: newCursor.add(2,'d').format('YYYY-MM-DD'),
      end: newCursor.add(5,'d').format('YYYY-MM-DD')
    });
  }
  return todoRangeArray;
}

/**
 * Takes open active and pending arrays and returns a single array with `active` and
 * `pending` pipeline values assigned to each todo item.
 *
 * @param {Array} todosOpen - input Array (of two arrays)
 * @returns {Array} - single array with both active and pending items with a new `pipeline` property.
 */
const _copyTodos = (todosOpen) => {
  const newTodos = [];
  todosOpen.active.forEach( t => { t.pipeline = 'active'; newTodos.push(t); });
  todosOpen.pending.forEach( t => { t.pipeline = 'pending'; newTodos.push(t); });
  return newTodos;
}

/**
 * Fill available space with todos
 * (available business days space already calculated and provided by _getRangeArray())
 * TODO: todos that don't fit should be chunked into pieces that do fit. (maybe)
 *
 * @param {Array} rangeArray - List of spans that can be filled
 * @param {Array} todoArray - List of todos to fill those spans (mutates to nothing)
 * @returns {Array} - List of todos with startdates added
 */
const _fillRanges = (rangeArray, todoArray) => {
  const startDatedTodos = [];
  rangeArray.forEach( r => {
    // initialize start time
    const deltaCursor = moment(r.start + 'T00:00:00');
    // capture the range as a duration (to chip away at as todos are added)
    const biz_duration = moment.duration(moment(r.end+'T00:00:00').diff(deltaCursor));
    // note: moment.subract() (and .add()) mutate in place
    // as long as there are todos, and the next todo still fits (the biz_duration calc), use it.
    while (todoArray.length > 0 &&
      biz_duration.subtract(parseInt(todoArray[0].est.slice(0,-1), 10), 'hours') >= 0
    ) {
      const thisTodo = todoArray.shift();                              // take it..
      thisTodo.startdate = deltaCursor.toISOString(true).slice(0,-10); //   ..assign its start date..
      startDatedTodos.push(thisTodo);                                  //     ..and hang onto it.
      // calculate delta for next todo (if any)
      const estAsInt = parseInt(thisTodo.est.slice(0,-1), 10);
      const delta = moment.duration(estAsInt, 'hours');
      deltaCursor.add(delta);
      startHere = deltaCursor.toISOString(true);
    }
  });
  return startDatedTodos;
}

/**
 * Process in the pipeline that takes the existing issues data structure
 * and inserts the interrupts. And more...
 *
 * (See private functions above)
 *
 * 1. _getRangeArray(): Using interrupt start and ends, find space in between.
 * 2. _copyTodos(): Add pipeline property to each todo and merge into one array,
 *                  to make it easy to...
 * 3. _fillRanges(): ...fill ranges with todos.
 * 4. Lastly, in here, recreate open/pending array of combined interrupts and todos,
 *    sorted by startdates (while you're at it, add colors based on type)
 */
exports.injectInterrupts = () => {
  return (req, res, next) => {
    // make sure we have an array, even if empty, because the rest depends on its presence
    if (!res.locals.issues['interrupts']) res.locals.issues.interrupts = [];
    const todoRangeArray = _getRangeArray(res.locals.issues.interrupts);
    const todoArray = _copyTodos(res.locals.issues.open);
    const startDatedTodos = _fillRanges(todoRangeArray, todoArray);
    const sortedMix = startDatedTodos
      .concat(res.locals.issues.interrupts)
      .sort( (a,b) => a.startdate < b.startdate ? -1 : 1);
    delete res.locals.issues.interrupts;
    res.locals.issues.open.active = [];
    res.locals.issues.open.pending = [];
    let active = true;
    sortedMix.forEach( t => {
      if (!t.hasOwnProperty('pipeline')) t.color = 'done, ';              // interrupts get done color
      if (!t.hasOwnProperty('color')) t.color = t.link ? 'active, ' : ''; // non-crit GH links get active color
      if (t.hasOwnProperty('pipeline')) { // it's a todo item
        if (t.pipeline === 'active') {
          active = true;
          res.locals.issues.open.active.push(t);
        } else {
          active = false;
          res.locals.issues.open.pending.push(t);
        }
      } else {                            // it's an interrupt
        if (active) {
          res.locals.issues.open.active.push(t);
        } else {
          res.locals.issues.open.pending.push(t);
        }
      }
    });
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
    for (let i = 0; i < req.app.locals.rawArchive.length; i++) {
      let mTitle = req.app.locals.rawArchive[i].match(/\s*✔\s+(?:@today\s|@high\s|@low\s)?([^\@]+)@?/);
      let mTags = [...req.app.locals.rawArchive[i].matchAll(/@\w+/g)];
      let mDone = req.app.locals.rawArchive[i].match(/@done\s*\((\d\d\d\d-\d\d-\d\d(\s*\d\d:\d\d)?)\)(?:\s+@project\(Todos)/);
      if (!mDone) continue;
      const taggy = _handleTags(mTags.flat());
      const doneStr = mDone[2] ? mDone[1] : `${mDone[1]} 17:00`;
      let title = mTitle[1].trim();
      let tags = taggy[1] ? taggy[1].split(' ') : [];
      entries.push({
        closed_on: doneStr,
        title: title,
        tags: tags,
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
 * take sorted JSON archive and swizzle it by tag
 */
exports.getArchiveByTag = () => {
  return (req, res, next) => {
    if (!Array.isArray(res.locals.entries) || !res.locals.entries.length) {
      res.locals.archivebytag = [];
      next();
      return;
    }
    const bytag = {};
    res.locals.entries.forEach( e => {
      e.tags.forEach( tag => {
        const category = tag.slice(1);
        bytag.hasOwnProperty(category) || ( bytag[category] = { points: 0, items: [] } );
        bytag[category].points += Number(e.est);
        bytag[category].items.push({
          closed_on: e.closed_on,
          title: e.title,
          tags: e.tags,
          est: e.est
        });
      });
    });
    res.locals.archivebytag = [];
    for (const [k, v] of Object.entries(bytag)) {
      v.tag = k;
      res.locals.archivebytag.push(v);
    }
    res.locals.archivebytag.sort((a, b) => a.tag < b.tag ? -1 : 1);
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
      bytag: res.locals.archivebytag,
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
  exports._getBizStart = _getBizStart;
  exports._chunkRange = _chunkRange;
  exports._copyTodos = _copyTodos;
  exports._fillRanges = _fillRanges;
  exports._getRangeArray = _getRangeArray;
}
