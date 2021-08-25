import React from "react";
import { Grid, Row, Column, Content, Loading } from "carbon-components-react";
import {
  HqTagList,
  HqEntryClosed,
  HqFooter,
  Mermaid,
  ApexchartsLine,
} from "../components";
import "./HqPageAll.css";

const HqPageAll = () => {
  const [isLoading, setIsLoading] = React.useState(true);
  const [data, setData] = React.useState([]);

  React.useEffect(() => {
    fetch(`/api`)
      .then((res) => res.json())
      .then((data) => {
        data.jsonchartdata = JSON.parse(data.jsonchartdata);
        data.jsonsupportdata = JSON.parse(data.jsonsupportdata);
        setData(data);
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <React.Fragment>
      <HqTagList tags={data.tags} />
      <Grid>
        <Row>
          <Column>
            <Content className="all-page-content">
              <h1 className="all-title">
                <div>All activity</div>
                <div className="shortdesc">
                  {data.startdate && <span>From {data.startdate} to ...</span>}
                </div>
              </h1>
              <Mermaid issues={data.issues} />

              <div className="all-gantt-footnote">
                <p>
                  Todos with issue numbers link to GitHub.
                </p>
              </div>
              {data.issues.closed && (
                <div className="all-closed-section">
                  <h2>Recently closed todos</h2>
                  <ul id="closed" className="all-closed-list">
                    {data.issues.closed.map((t) => (
                      <HqEntryClosed entry={t} />
                    ))}
                  </ul>
                </div>
              )}
              {data.byweek && (
                <div className="top-archive-section">
                  <h2 className="archivetitle">
                    <div>Archived todos</div>
                    <div className="pointscale">
                      <span>
                        {data.spperday} point(s) per {data.hrsperday}hr day
                      </span>
                    </div>
                  </h2>
                  <ApexchartsLine
                    jsonchartdata={data.jsonchartdata}
                    hassupportdata={data.hassupportdata}
                    jsonsupportdata={data.jsonsupportdata}
                  />
                  {data.byweek && data.byweek.length !== 0 && (
                    <div className="all-section-archive">
                      <ul>
                        {data.byweek.map((w) => (
                          <li>
                            <h4 className="all-week-heading">
                              Week ending {w.weekEnding}
                            </h4>
                            {w.entries && w.entries.length !== 0 && (
                              <ul>
                                {w.entries.map((e) => (
                                  <HqEntryClosed entry={e} />
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
        <HqFooter
          pageUpdated={data.pageupdated}
          fileUpdated={data.fileupdated}
        />
      </Grid>
    </React.Fragment>
  );
};

export default HqPageAll;
