const express = require('express');
const moment = require('moment');
const business = require('moment-business');
const config = require('config');

const router = express.Router();

const WHOAMI = config.get('yourName');
const HOURADJUST = (24 / config.get('workHoursPerDay')).toFixed(); // 24hr day / 8hr workday

const A_DAY = moment.duration(1, 'd');

// debug helpers
const lg = data => console.log(data);
const pp = data => '<pre>'+JSON.stringify(data, null, 2)+'</pre>';

/**
 * returns all tags in a tag array as a string, except "time estimate tags,"
 * which it normalizes into hours adjusted according to the HOURADJUST
 * configuration constant.
 * 
 * @param {Object[]} tags - list of \@tags
 */
const _handleTags = (tags) => {
  if (!tags || tags.length == 0) return [Math.round(2 * HOURADJUST).toString() + 'h', ''];
  let est = 2;
  let tagstring = '';
  for (let i = 0; i < tags.length; i++) {
    if (tags[i].match(/(?:@low|@today|@high|@done)/)) {
      continue;
    } else if (tags[i].match(/@\d/)) {
      est = parseInt(tags[i].slice(1, -1), 10);
      if (tags[i].slice(-1) === 'd') est = 8 * est; // conv days to hours
    } else {
      tagstring += `${tags[i]} `;
    }
  }
  const estimate = Math.round(est * HOURADJUST).toString() + 'h';
  return [estimate, tagstring.trimRight()];
}

/**
 * A process in the pipeline that takes an array of todo strings and
 * breaks it up into the initial `issues` data structure.
 */
const parseRawTodos = () => {
  return (req, res, next) => {
    // define the desired structure
    const issues = {
      open: {
        active: [],
        pending: []
      },
      closed: [],
      interrupts: []
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
        let est = taggy[0];
        if (m[1] === '✔') {  // the Dones
          issues['closed'].push({
            closed_on: m2[1],
            title: title,
            tagstring: tagstring,
            est: est
          });
        } else {            // the Opens
          switch (m[2]) {
            case '@today':              // the actives
              issues['open']['active'].push({
                number: j,
                title: title,
                tagstring: tagstring,
                est: est
              });
              break;
            case '@high':               // the active criticals
              issues['open']['active'].push({
                number: j,
                title: title,
                tagstring: tagstring,
                est: est,
                color: "crit, "
              })
              break;
            default:                    // the Pendings
              issues['open']['pending'].push({
                number: j,
                title: title,
                tagstring: tagstring,
                est: est
              });
          }
        }
        j++;
      }
    }
    // sort interrupts before returning
    if (issues.interrupts) issues.interrupts.sort( (a,b) => a.startdate < b.startdate ? -1 : 1 );
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
const injectInterrupts = () => {
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
          pipetodos: for (let tidx=0; tidx < res.locals.issues['open'][pipeidx].length; tidx++) {
            if (!res.locals.issues['open'][pipeidx][tidx]['startdate']) {
              const estStr = res.locals.issues['open'][pipeidx][tidx]['est'].slice(0,-1);
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
        const estStr = res.locals.issues['interrupts'][i]['est'].slice(0,-1);
        const est = parseInt(estStr, 10);
        endoflastinterrupt = interruptstart.add(moment.duration(est, 'days'));
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
const prevnumsForGantt = () => {
  return (req, res, next) => {
    const prevnum = {};
    for (const s of ['active', 'pending']) {
      res.locals.issues.open[s].forEach( (todo, i) => {
        if (todo.startdate) { // interrupt found
          todo.prevtask = todo.startdate;
          delete todo.startdate;
          todo.color = 'active, ';
        } else {
          todo.prevtask = prevnum[s] ? 'after k'+prevnum[s] : moment().format('YYYY-MM-DD');
          if (!todo.color) todo.color = '';
        }
        prevnum[s] = todo.number.toString();
      });
    }
    if (res.locals.issues.open.pending[0].color == '') {
      res.locals.issues.open.pending[0].prevtask = `after k${prevnum.active}`;
    }
    next();
  }
}

const renderIt = () => {
  return (req, res, next) => {
    let fileupdated = moment(res.locals.todoFileUpdated).utc().format();
    let pageupdated = moment().utc().format();
    res.render('index', {
      issues: res.locals.issues,
      fileupdated: fileupdated,
      pageupdated: pageupdated,
      whoami: WHOAMI
    });
  }
}

router.get('/rawtodos', (req, res, next) => {
  res.json(res.locals.rawTodos);
});

router.get('/unordered', parseRawTodos(), (req, res, next) => {
  res.send(pp(res.locals.issues));
});

router.get('/interruptsadded', parseRawTodos(), injectInterrupts(), (req, res, next) => {
  res.send(pp(res.locals.issues));
});

router.get('/issues', parseRawTodos(), injectInterrupts(), prevnumsForGantt(),
(req, res, next) => {
  res.send(pp(res.locals.issues));
});

router.get('/', parseRawTodos(), injectInterrupts(), prevnumsForGantt(), renderIt());


module.exports = router;
