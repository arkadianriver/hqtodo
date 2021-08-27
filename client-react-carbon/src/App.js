import React from "react";
import { Route, Switch } from "react-router-dom";
import "carbon-components/css/carbon-components.min.css";
import "./App.css";
import { Loading } from "carbon-components-react";
import { HqPageAll, HqPageTag } from "./pages";
import { HqFooter, HqHeader, HqTagList } from "./components";
import { useInterval } from "./utils/useInterval";
import Headroom from "react-headroom";

function App() {
  const [isLoading, setIsLoading] = React.useState(true);
  const [data, setData] = React.useState([]);
  const [savedSourceTimestamp, setSavedSourceTimestamp] =
    React.useState("1970-01-01");

  const makeRequest = () => {
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
              console.log(currentSourceTimestamp);
              setIsLoading(false);
            });
        }
      });
  };

  useInterval(async () => {
    console.log("polling hqtodo server");
    makeRequest();
  }, 40000);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div>
      <Headroom>
        <HqHeader userName={data.whoami} />
        <HqTagList tags={data.tags} />
      </Headroom>
      <Switch>
        <Route path="/" exact>
          <HqPageAll data={data} />
        </Route>
        <Route path="/tags/:tag">
          <HqPageTag data={data} />
        </Route>
      </Switch>
      <HqFooter pageUpdated={data.pageupdated} fileUpdated={data.fileupdated} />
    </div>
  );
}

export default App;
