import React, { useEffect } from "react";
import { Route, Switch } from "react-router-dom";
import "carbon-components/css/carbon-components.min.css";
import "./App.css";
import { Loading } from "carbon-components-react";
import { HqPageAll, HqPageTag, HqPageSwagger } from "./pages";
import { HqFooter, HqHeader, HqTagList } from "./components";
import { useInterval } from "./utils/useInterval";
import Headroom from "react-headroom";
import apiData from "./test/mock-api-data";

function App() {
  
  const [isLoading, setIsLoading] = React.useState(true);
  const [data, setData] = React.useState({});

  const [savedSourceTimestamp, setSavedSourceTimestamp] =
    React.useState("1970-01-01");

  const makeRequest = () => {
    if (process.env.REACT_APP_DEMO !== "true") {
      fetch("/todos/filelastupdated")
        .then((res) => res.json())
        .then((currentSourceTimestamp) => {
          if (savedSourceTimestamp < currentSourceTimestamp) {
            fetch("/api")
              .then((res) => res.json())
              .then((data) => {
                data.jsonchartdata = JSON.parse(data.jsonchartdata);
                data.jsonsupportdata = JSON.parse(data.jsonsupportdata);
                setData(data);
                setSavedSourceTimestamp(currentSourceTimestamp);
                setIsLoading(false);
              });
          }
        });
    }
  };

  useEffect(() => {
    if (process.env.REACT_APP_DEMO === "true") {
      setData(apiData);
      setIsLoading(false);
    }
  }, []);
  
  useInterval(async () => {
    makeRequest();
  }, 40000);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div>
      <Headroom>
        <HqHeader userName={data.whoami} menuLinks={data.menuLinks} />
        <HqTagList tags={data.tags} />
      </Headroom>
      <Switch>
        <Route path="/" exact>
          <HqPageAll data={data} />
        </Route>
        <Route path="/tags/:tag">
          <HqPageTag data={data} />
        </Route>
        <Route path="/doc">
          <HqPageSwagger />
        </Route>
      </Switch>
      <HqFooter
        pageUpdated={
          process.env.REACT_APP_DEMO !== "true" ? data.pageupdated : new Date().toISOString()
        }
        fileUpdated={data.fileupdated}
      />
    </div>
  );
}

export default App;
