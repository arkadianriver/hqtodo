export const makeMermaidText = (issues) => {

  let text = `gantt
  excludes weekends
  todayMarker off
  `;
  
  if (issues.blockers.length) {
    text += `
  section Blockers
  `;
    text += issues.blockers.map(
        (b) =>
          `${b.title.replace(/[:#]/, "-")} ${b["tagstring"]} :${b["color"]}k${
            b["number"]
          }, ${b["startdate"]}, ${b["est"]}
  ` ).join('');
  }
  
  if (issues.milestones.length > 0) {
    text += `
  section Milestones
  `;
    text += issues.milestones.map(
        (b) =>
          `${b.title.replace(/[:#]/, "-")} ${b["tagstring"]} :${b["color"]}k${
            b["number"]
          }, ${b["startdate"]}, ${b["est"]}
  ` ).join('');
  }

  if (issues.open.active.flat().length > 0) {
    text += `
  section In progress
  `;
    text += issues.open.active.flat().map(
        (b) =>
          `${b.title.replace(/[:#]/, "-")} ${b["tagstring"]} :${b["color"]}k${
            b["number"]
          }, ${b["startdate"]}, ${b["est"]}
  ` ).join('');
  }
  
  if (issues.open.pending.flat().length > 0) {
    text += `
  section Backlog
  `;
    text += issues.open.pending.flat().map(
        (b) =>
          `${b.title.replace(/[:#]/, "-")} ${b["tagstring"]} :${b["color"]}k${
            b["number"]
          }, ${b["startdate"]}, ${b["est"]}
  ` ).join('');
  }

  text += issues.links.map(
        (l) => `
  click ${l.id} call linkTo("${l.url}")`
      ).join('');

  text += issues.blockers.map(
        (l) => `
  click k${l.number} call showHover("k${l.number}")`
      ).join('');

  return text;
};