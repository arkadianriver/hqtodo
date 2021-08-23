import React from "react";
import { Grid, Row, Column, Content, Loading } from "carbon-components-react";
import { HqTagList, HqFooter } from "../components";

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
              <h1>All</h1>
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
