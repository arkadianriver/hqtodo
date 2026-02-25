import React, { useEffect } from "react";
import { Route, Routes } from "react-router";
import "./App.scss";
import { Loading } from "@carbon/react";
import { HqPageAll, HqPageTag, HqPageSwagger } from "/src/pages";
import { HqFooter, HqHeader, HqTagList } from "/src/components";
import { useInterval } from "/src/utils/useInterval";
import Headroom from "react-headroom";
import apiData from "/src/test/mock-api-data";

function App() {
  
  const [isLoading, setIsLoading] = React.useState(true);
  const [data, setData] = React.useState({});

  const [savedSourceTimestamp, setSavedSourceTimestamp] =
    React.useState("1970-01-01");

  const makeRequest = () => {
    if (import.meta.env.VITE_DEMO !== "true") {
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
    if (import.meta.env.VITE_DEMO === "true") {
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
      <Routes>
        <Route path="/" exact element={<HqPageAll data={data} />} />
        <Route path="/tags/:tag" element={<HqPageTag data={data} />} />
        <Route path="/doc" element={<HqPageSwagger />} />
      </Routes>
      <HqFooter
        pageUpdated={
          import.meta.env.VITE_DEMO !== "true" ? data.pageupdated : new Date().toISOString()
        }
        fileUpdated={data.fileupdated}
      />
    </div>
  );
}

export default App;
