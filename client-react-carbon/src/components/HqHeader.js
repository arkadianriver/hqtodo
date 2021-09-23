import React from "react";
import "./HqHeader.css";
import {
  Header,
  HeaderName,
  HeaderGlobalBar,
  HeaderGlobalAction,
  Search,
} from "carbon-components-react";
import { useHistory } from "react-router";
import { Book20 } from "@carbon/icons-react";

const HqHeader = (props) => {
  const history = useHistory();
  const linkHandler = (path) => history.push(path);

  return (
    <Header aria-label="hqTodo" className="hq-header">
      <HeaderName className="hq-header-name" prefix="hqTodo" onClick={() => linkHandler("/")}>
        {props.userName}
      </HeaderName>
      <HeaderGlobalBar>
        <Search
          labelText="Search"
          placeholder="Search all todos (TBD)" // TODO: search implementation
          className="hq-search"
        />
        <HeaderGlobalAction
          aria-label="Documentation"
          tooltipAlignment="end"
          onClick={() => linkHandler("/doc")}
        >
          <Book20 />
        </HeaderGlobalAction>
      </HeaderGlobalBar>
    </Header>
  );
};

export default HqHeader;
