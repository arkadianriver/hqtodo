import React from "react";
import "./HqPageTag.css";
import { useParams } from "react-router-dom";
import { Loading, Grid, Row, Column, Content } from "carbon-components-react";
import {
  ApexchartsBar,
  HqEntryOpen,
  HqEntryClosed,
} from "../components";
import { getTagData } from "../utils/getTagData";

const HqPageTag = (props) => {
  const { tag } = useParams();

  const [isLoading, setIsLoading] = React.useState(true);
  const [tagData, setData] = React.useState([]);

  React.useEffect(() => {
    const td = getTagData(props.data, tag);
    setData(td);
    console.log(td);
    setIsLoading(false);
  }, [props, tag]);

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
    <Grid>
      <Row>
        <Column>
          <Content className="tag-page-content">
            <h1 className="tag-title">
              <div>@{tag}</div>
              <div className="shortdesc">
                {props.data.taginfo.hasOwnProperty(tag) &&
                  setDescription(props.data.taginfo[tag])}
              </div>
            </h1>
            <h2>Todo ({tagData.opensum || 0} pts)</h2>
            {tagData.milestones && tagData.milestones.length !== 0 && (
              <div className="tag-section-milestones">
                <ul>
                  {tagData.milestones.map((e) => (
                    <HqEntryOpen entry={e} />
                  ))}
                </ul>
              </div>
            )}
            {tagData.blockers && tagData.blockers.length !== 0 && (
              <div className="tag-section-blockers">
                <ul>
                  {tagData.blockers.map((e) => (
                    <HqEntryOpen entry={e} />
                  ))}{" "}
                </ul>
              </div>
            )}
            {tagData.open.active && tagData.open.active.length !== 0 && (
              <div className="tag-section-progress">
                <h3>In progress</h3>
                <ul>
                  {tagData.open.active.map((e) => (
                    <HqEntryOpen entry={e} />
                  ))}
                </ul>
              </div>
            )}
            {tagData.open.pending && tagData.open.pending.length !== 0 && (
              <div className="tag-section-backlog">
                <h3>Backlog</h3>
                <ul>
                  {tagData.open.pending.map((e) => (
                    <HqEntryOpen entry={e} />
                  ))}
                </ul>
              </div>
            )}
            {tagData.closed && tagData.closed.length !== 0 && (
              <div className="tag-section-recently-closed">
                <h3>Recently complete</h3>
                <ul>
                  {tagData.closed.map((e) => (
                    <HqEntryClosed entry={e} />
                  ))}
                </ul>
              </div>
            )}
            <h2>Done</h2>
            <ApexchartsBar tagName={tag} seriesData={tagData.chartdata} />
            {tagData.archive && tagData.archive.length !== 0 && (
              <div className="tag-section-archive">
                <h3>Archive</h3>
                <ul>
                  {tagData.archive.map((e) => (
                    <HqEntryClosed entry={e} />
                  ))}
                </ul>
              </div>
            )}
          </Content>
        </Column>
      </Row>
    </Grid>
  );
};

export default HqPageTag;
