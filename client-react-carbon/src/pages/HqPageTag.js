import React from "react";
import "./HqPageTag.css";
import { useParams } from "react-router-dom";
import { Grid, Row, Column, Content, Loading } from "carbon-components-react";
import {
  ApexchartsBar,
  HqEntryOpen,
  HqEntryClosed,
  HqTagList,
  HqFooter,
} from "../components";

const HqPageTag = () => {
  const { tag } = useParams();

  const [isLoading, setIsLoading] = React.useState(true);
  const [data, setData] = React.useState([]);

  React.useEffect(() => {
    fetch(`/api/tags/${tag}`)
      .then((res) => res.json())
      .then((data) => {
        data.tagdata.chartdata = JSON.parse(data.tagdata.chartdata);
        setData(data);
        setIsLoading(false);
      });
  }, [tag]);

  if (isLoading) {
    return <Loading />;
  }

  const setDescription = (taginfo) => {
    return taginfo.link ? (
      <span>
        {taginfo.title}{" "}
        <span className="shortdesc-more">
          (<a href={taginfo.link}>More info</a>)
        </span>
      </span>
    ) : (
      taginfo.title
    );
  };

  return (
    <React.Fragment>
      <HqTagList tags={data.tags} />
      <Grid>
        <Row>
          <Column>
            <Content className="tag-page-content">
              <h1 className="tag-title">
                <div>@{tag}</div>
                <div className="shortdesc">
                  {data.taginfo.hasOwnProperty(tag) &&
                    setDescription(data.taginfo[tag])}
                </div>
              </h1>
              <h2>Todo ({data.tagdata.opensum || 0} pts)</h2>
              {data.tagdata.milestones && data.tagdata.milestones.length !== 0 && (
                <div className="tag-section-milestones">
                  <ul>
                    {data.tagdata.milestones.map((e) => (
                      <HqEntryOpen entry={e} />
                    ))}
                  </ul>
                </div>
              )}
              {data.tagdata.blockers && data.tagdata.blockers.length !== 0 && (
                <div className="tag-section-blockers">
                  <ul>
                    {data.tagdata.blockers.map((e) => (
                      <HqEntryOpen entry={e} />
                    ))}{" "}
                  </ul>
                </div>
              )}
              {data.tagdata.open.active &&
                data.tagdata.open.active.length !== 0 && (
                  <div className="tag-section-progress">
                    <h3>In progress</h3>
                    <ul>
                      {data.tagdata.open.active.map((e) => (
                        <HqEntryOpen entry={e} />
                      ))}
                    </ul>
                  </div>
                )}
              {data.tagdata.open.pending &&
                data.tagdata.open.pending.length !== 0 && (
                  <div className="tag-section-backlog">
                    <h3>Backlog</h3>
                    <ul>
                      {data.tagdata.open.pending.map((e) => (
                        <HqEntryOpen entry={e} />
                      ))}
                    </ul>
                  </div>
                )}
              {data.tagdata.closed && data.tagdata.closed.length !== 0 && (
                <div className="tag-section-recently-closed">
                  <h3>Recently complete</h3>
                  <ul>
                    {data.tagdata.closed.map((e) => (
                      <HqEntryClosed entry={e} />
                    ))}
                  </ul>
                </div>
              )}
              <h2>Done</h2>
              <ApexchartsBar tagName={tag} seriesData={data.tagdata.chartdata} />
              {data.tagdata.archive && data.tagdata.archive.length !== 0 && (
                <div className="tag-section-archive">
                  <h3>Archive</h3>
                  <ul>
                    {data.tagdata.archive.map((e) => (
                      <HqEntryClosed entry={e} />
                    ))}
                  </ul>
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

export default HqPageTag;
