import { Interval, DateTime } from "luxon";

// https://github.com/moment/luxon/issues/662#issuecomment-584565729
function*_days(interval) {
  let cursor = interval.start.startOf("day");
  while (cursor < interval.end) {
    yield cursor;
    cursor = cursor.plus({ days: 1 });
  }
}

const _chartdataFromTagArchive = (descendingEntries, dayOne) => {
  const chartdata = [];
  if (!Array.isArray(descendingEntries) || !descendingEntries.length) {
    return chartdata;
  }
  const chartobj = {};
  const dayNow = DateTime.local().toISODate();
  chartobj[dayOne] = 0;
  chartobj[dayNow] = 0;
  // gathering entries (and summing on like days)
  descendingEntries.reverse().forEach( e => {
    const newE = Number.parseFloat(e.est);
    const dateVal = e.closed_on.substr(0,10);
    chartobj[dateVal] = chartobj.hasOwnProperty(dateVal)
      ? chartobj[dateVal] + newE : newE;
  });
  // spreading entries per day along the interval
  const interval = Interval.fromISO(`${dayOne}/${dayNow}`);
  for (let m of _days(interval)) {
    const dateKey = m.toISODate();
    const dateValue = chartobj.hasOwnProperty(dateKey)
      ? chartobj[dateKey].toFixed(2) : 0;
    chartdata.push({ x: dateKey, y: dateValue });
  }
  return chartdata;
}


export const getTagData = (data, tagname) => {
  const tagData = {
    open: {
      active: [],
      pending: [],
    },
    milestones: [],
    blockers: [],
    closed: [],
    archive: [],
    chartdata: [],
    opensum: 0,
    archivesum: 0,
  };
  // grab milestone entries that have this tag
  data.issues.milestones.forEach((e) => {
    if (e.tagstring.split(/\s+/).includes(`@${tagname}`)) {
      tagData.milestones.push(e);
    }
  });
  // grab blocker entries that have this tag
  data.issues.blockers.forEach((e) => {
    if (e.tagstring.split(/\s+/).includes(`@${tagname}`)) {
      const newE = {};
      Object.assign(newE, e);
      if (e.hasOwnProperty("est")) {
        const intHrs = parseInt(newE.est.slice(0, -1), 10);
        const spEst = (intHrs * data.spfactor).toFixed(2);
        tagData.opensum += Number.parseFloat(spEst);
        newE.est = spEst;
      }
      tagData.blockers.push(newE);
    }
  });
  // grab active entries that have this tag
  data.issues.open.active.flat().forEach((e) => {
    if (e.tagstring.split(/\s+/).includes(`@${tagname}`)) {
      const newE = {};
      Object.assign(newE, e);
      if (e.hasOwnProperty("est")) {
        const intHrs = parseInt(newE.est.slice(0, -1), 10);
        const spEst = (intHrs * data.spfactor).toFixed(2);
        tagData.opensum += Number.parseFloat(spEst);
        newE.est = spEst;
      }
      tagData.open.active.push(newE);
    }
  });
  // grab pending entries that have this tag
  data.issues.open.pending.flat().forEach((e) => {
    if (e.tagstring.split(/\s+/).includes(`@${tagname}`)) {
      const newE = {};
      Object.assign(newE, e);
      if (e.hasOwnProperty("est")) {
        const intHrs = parseInt(newE.est.slice(0, -1), 10);
        const spEst = (intHrs * data.spfactor).toFixed(2);
        tagData.opensum += Number.parseFloat(spEst);
        newE.est = spEst;
      }
      tagData.open.pending.push(newE);
    }
  });
  // grab closed entries that have this tag
  data.issues.closed.forEach((e) => {
    if (e.tagstring.split(/\s+/).includes(`@${tagname}`)) {
      tagData.closed.push(e);
    }
  });
  // grab archive entries that have this tag
  data.entries.forEach((e) => {
    e.tags.forEach((tag) => {
      const category = tag.slice(1); // remove '@'
      if (category === tagname) {
        tagData.archive.push(e);
        tagData.archivesum += Number.parseFloat(e.est);
      }
    });
  });
  // no leading zero
  tagData.opensum = tagData.opensum.toFixed(2);
  // sort arrays before returning
  if (tagData.closed)
    tagData.closed.sort((a, b) => (a.closed_on < b.closed_on ? -1 : 1));
  if (tagData.archive) {
    tagData.archive.sort((a, b) => (a.closed_on > b.closed_on ? -1 : 1));
    const dayOne = data.entries ? data.entries[0].closed_on.substr(0, 10) : undefined;
    const chartdata = dayOne ? _chartdataFromTagArchive(tagData.archive, dayOne) : [];
    tagData.archivesum = tagData.archivesum.toFixed(2);
    tagData.chartdata = chartdata;
    tagData.archive.sort((a, b) => (a.closed_on > b.closed_on ? -1 : 1));
  }
  return tagData;
};
