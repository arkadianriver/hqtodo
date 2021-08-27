import React from "react";
import "./HqHeader.css";
import {
  Header,
  HeaderName,
  HeaderGlobalBar,
  Search,
} from "carbon-components-react";
import { useHistory } from "react-router";

const HqHeader = (props) => {
  const history = useHistory();
  const clickHandler = () => history.push("/");

  return (
    <Header aria-label="hqTodo" className="hq-header">
      <HeaderName href="#" prefix="hqTodo" onClick={clickHandler}>
        {props.userName}
      </HeaderName>
      <HeaderGlobalBar>
        <Search placeholder="Search all todos" className="hq-search" />
      </HeaderGlobalBar>
    </Header>
  );
};

export default HqHeader;
