import React from "react";
import "./HqPageDoc.css";
import { Loading, Grid, Row, Column, Content } from "carbon-components-react";
import { slugify } from "../utils/slugify";

const HqPageDoc = () => {
  const [isLoading, setIsLoading] = React.useState(true);
  const [docData, setData] = React.useState([]);

  React.useEffect(() => {
    fetch("/api/doc")
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <Grid>
      <Row>
        <Column>
          <Content className="doc-page-content">
            <h1>Doc</h1>
            <h2 id="doc-server">{docData.title}</h2>
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
