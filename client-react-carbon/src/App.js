import React from "react";
import { Route, Switch } from "react-router-dom"; 
import "carbon-components/css/carbon-components.min.css";
import "./App.css";
import { HqPageAll, HqPageTag } from "./pages";
import { HqHeader } from "./components";

function App() {
  return (
    <div>
      {/* <div className="app-head-spacer"></div> */}
      <HqHeader />
        <Switch>
          <Route path="/" exact>
            <HqPageAll />
          </Route>
          <Route path="/tags/:tag">
            <HqPageTag />
          </Route>
        </Switch>
    </div>
  );
}

export default App;
