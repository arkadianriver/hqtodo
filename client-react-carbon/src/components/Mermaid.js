import React, { Component } from "react";
import mermaid from "mermaid";
import "./Mermaid.css";

mermaid.initialize({
  startOnLoad: true,
  securityLevel: "loose",
  gantt: {
    axisFormat: "%d %b",
    titleTopMargin: 25,
    topPadding: 60,
    barGap: 4,
    barheight: 75,
    bottomMarginAdjust: 1,
  },
});

class Mermaid extends Component {
  componentDidMount() {
    window.showHover = (id) => {
      const hover = document.querySelector(`#h${id}`);
      hover.classList.toggle("showme");
      hover.classList.toggle("hideme");
    };

    window.linkTo = (url) => window.open(url, "_blank");

    mermaid.contentLoaded();
  }

  render() {
    /* <div id="ourgantt" className="mermaid"> */
    return (
      <div className="gantt-container">
        {this.props.issues.blockers.map((l) => (
          <div id={`hk${l.number}`} className="hover hideme">
            {l.hover.split("<br />").map((h) => (
              <span>
                {h}
                <br />
              </span>
            ))}
            {l.link && (
              <span>
                <a target="_blank" rel="noopener noreferrer" href={l.link}>
                  see link
                </a>
              </span>
            )}
          </div>
        ))}
        <div id="ourgantt" className="mermaid">
          {`  gantt
    excludes weekends
    todayMarker off
    `}{" "}
          {this.props.issues.blockers.length > 0 &&
            `
    section Blockers
    `}
          {this.props.issues.blockers.map(
            (b) =>
              `${b.title.replace(/[:#]/, "-")} ${b["tagstring"]} :${
                b["color"]
              }k${b["number"]}, ${b["startdate"]}, ${b["est"]}
    `
          )}{" "}
          {this.props.issues.milestones.length > 0 &&
            `
    section Milestones
    `}
          {this.props.issues.milestones.map(
            (b) =>
              `${b.title.replace(/[:#]/, "-")} ${b["tagstring"]} :${
                b["color"]
              }k${b["number"]}, ${b["startdate"]}, ${b["est"]}
    `
          )}{" "}
          {this.props.issues.open.active.length > 0 &&
            `
    section In progress
    `}
          {this.props.issues.open.active.map(
            (b) =>
              `${b.title.replace(/[:#]/, "-")} ${b["tagstring"]} :${
                b["color"]
              }k${b["number"]}, ${b["startdate"]}, ${b["est"]}
    `
          )}{" "}
          {this.props.issues.open.pending.length > 0 &&
            `
    section Backlog
    `}
          {this.props.issues.open.pending.map(
            (b) =>
              `${b.title.replace(/[:#]/, "-")} ${b["tagstring"]} :${
                b["color"]
              }k${b["number"]}, ${b["startdate"]}, ${b["est"]}
    `
          )}{" "}
          {this.props.issues.links.map(
            (l) => `
    click ${l.id} call linkTo("${l.url}")`
          )}{" "}
          {this.props.issues.blockers.map(
            (l) => `
    click k${l.number} call showHover("k${l.number}")`
          )}
        </div>
      </div>
    );
  }
}

export default Mermaid;
