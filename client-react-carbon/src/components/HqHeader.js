import React from "react";
import "./HqHeader.css";
import {
  Header,
  HeaderName,
  HeaderGlobalBar,
  HeaderGlobalAction,
} from "carbon-components-react";
import { Search20 } from "@carbon/icons-react";
import { useHistory } from "react-router"; 

const HqHeader = () => {

  const history = useHistory();
  const clickHandler = () => history.push('/');

  return (
    <Header aria-label="hqTodo" className="hq-header">
      <HeaderName href="#" prefix="hqTodo" onClick={clickHandler}>
        &lt;Your name&gt;
      </HeaderName>
      <HeaderGlobalBar>
        <HeaderGlobalAction>
          <Search20 />
        </HeaderGlobalAction>
      </HeaderGlobalBar>
    </Header>
  );
};

export default HqHeader;
