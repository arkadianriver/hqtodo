import React from "react";
import "./HqPageDoc.css";
import { Loading, Grid, Row, Column, Content, Tag } from "carbon-components-react";
import { slugify } from "../utils/slugify";
import apiDocData from "../test/mock-doc-data";

const HqPageDoc = () => {
  const [isLoading, setIsLoading] = React.useState(true);
  const [docData, setData] = React.useState(apiDocData);

  React.useEffect(() => {
    if (process.env.REACT_APP_DEMO !== "true") {
      fetch("/api/doc")
        .then((res) => res.json())
        .then((data) => {
          setData(data);
        });
    }
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return <Loading />;
  }

  const colors = [
    {
      color: "red",
      name: "has-blocker",
      desc: "Red contains a blocker. Supersedes blue.",
    },
    {
      color: "blue",
      name: "has-active",
      desc: "Blue contains active items (in progress or milestone ♦). Supersedes teal.",
    },
    {
      color: "teal",
      name: "default",
      desc: "Teal contains items in the backlog (no in progress). Supersedes green.",
    },
    {
      color: "green",
      name: "has-closed",
      desc: "Green contains closed items (nothing currently active).",
    },
  ];

  return (
    <Grid>
      <Row>
        <Column>
          <Content className="doc-page-content">
            <h1>Help</h1>
            <h2 id="doc-legend">Tag color legend</h2>
            <div className="doc-section-legend">
              <ul>
                {colors.map((c) => (
                  <li className="doc-tag" key={c.name}>
                    <div className="doc-tag-item">
                      <Tag type={c.color} id={c.name} title={c.name}>
                        <span>@category</span>
                      </Tag>
                    </div>
                    <div className="doc-tag-description">{c.desc}</div>
                  </li>
                ))}
              </ul>
            </div>
            <h2 id="doc-server">hqTodo server API</h2>
            <h3>Routes</h3>
            {docData.routes && docData.routes.length !== 0 && (
              <div className="doc-section-routes">
                <ul>
                  {docData.routes.map((r) => (
                    <li
                      className="doc-route"
                      key={`${r.method}-${slugify(r.path)}`}
                    >
                      <div className="doc-route-spec">
                        <div className="doc-route-method">{r.method}</div>
                        <div className="doc-route-path">{r.path}</div>
                      </div>
                      <div className="doc-route-description">
                        {r.description}
                      </div>
                    </li>
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

export default HqPageDoc;
