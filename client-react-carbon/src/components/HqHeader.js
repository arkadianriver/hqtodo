import React from "react";
import "./HqHeader.css";
import {
  Header,
  HeaderName,
  HeaderGlobalBar,
  Search,
} from "carbon-components-react";
import { useHistory } from "react-router";

const HqHeader = () => {
  const history = useHistory();
  const clickHandler = () => history.push("/");

  return (
    <Header aria-label="hqTodo" className="hq-header">
      <HeaderName href="#" prefix="hqTodo" onClick={clickHandler}>
        &lt;Your name&gt;
      </HeaderName>
      <HeaderGlobalBar>
        <Search placeholder="Search all todos" />
      </HeaderGlobalBar>
    </Header>
  );
};

export default HqHeader;
