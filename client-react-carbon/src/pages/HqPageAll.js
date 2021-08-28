import React from "react";
import { Grid, Row, Column, Content } from "carbon-components-react";
import { HqEntryClosed, ApexchartsLine } from "../components";
import { slugify } from "../utils/slugify";
import MermaidGantt from "../components/MermaidGantt";
import "./HqPageAll.css";

const HqPageAll = (props) => {
  return (
    <Grid>
      <Row>
        <Column>
          <Content className="all-page-content">
            <h1 className="all-title">
              <div>All activity</div>
              <div className="shortdesc">
                {props.data.startdate && (
                  <span>From {props.data.startdate} to ...</span>
                )}
              </div>
            </h1>
            <div className="gantt-container">
              {props.data.issues.blockers.map((l) => (
                <div
                  key={`${l.number}-${slugify(l.title)}`}
                  id={`hk${l.number}`}
                  className="hover hideme"
                >
                  {l.hover.split("<br />").map((h, i) => (
                    <span key={`${i}-${slugify(h)}`}>
                      {h}
                      <br />
                    </span>
                  ))}
                  {l.link && (
                    <span>
                      <a
                        target="_blank"
                        rel="noopener noreferrer"
                        href={l.link}
                      >
                        see link
                      </a>
                    </span>
                  )}
                </div>
              ))}
              {/* <div dangerouslySetInnerHTML={{ __html: svg }} /> */}
              <MermaidGantt issues={props.data.issues} />
            </div>
            <div className="all-gantt-footnote">
              <p>Todos with issue numbers link to GitHub.</p>
            </div>
            {props.data.issues.closed && (
              <div className="all-closed-section">
                <h2>Recently closed todos</h2>
                <ul id="closed" className="all-closed-list">
                  {props.data.issues.closed.map((t, i) => (
                    <HqEntryClosed key={`${i}-${slugify(t.title)}`} entry={t} />
                  ))}
                </ul>
              </div>
            )}
            {props.data.byweek && (
              <div className="top-archive-section">
                <h2 className="archivetitle">
                  <div>Archived todos</div>
                  <div className="pointscale">
                    <span>
                      {props.data.spperday} point(s) per {props.data.hrsperday}
                      hr day
                    </span>
                  </div>
                </h2>
                <ApexchartsLine
                  jsonchartdata={props.data.jsonchartdata}
                  hassupportdata={props.data.hassupportdata}
                  jsonsupportdata={props.data.jsonsupportdata}
                />
                {props.data.byweek && props.data.byweek.length !== 0 && (
                  <div className="all-section-archive">
                    <ul>
                      {props.data.byweek.map((w) => (
                        <li key={w.weekEnding}>
                          <h4 className="all-week-heading">
                            Week ending {w.weekEnding}
                          </h4>
                          {w.entries && w.entries.length !== 0 && (
                            <ul>
                              {w.entries.map((e, i) => (
                                <HqEntryClosed
                                  key={`${i}-${slugify(e.title)}`}
                                  entry={e}
                                />
                              ))}
                            </ul>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </Content>
        </Column>
      </Row>
    </Grid>
  );
};

export default HqPageAll;
