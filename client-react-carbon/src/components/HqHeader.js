import React from "react";
import "./HqHeader.css";
import {
  Header,
  HeaderName,
  HeaderGlobalBar,
  HeaderGlobalAction,
  Search,
  HeaderPanel,
  Switcher,
  SwitcherItem,
} from "@carbon/react";
import { useNavigate } from "react-router-dom";
import { AppSwitcher, Book } from "@carbon/icons-react";
import { slugify } from "../utils/slugify";

const HqHeader = (props) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const navigate = useNavigate();

  const linkHandler = (path) => {
    if (path.substring(0, 4) === "http") {
      window.open(path);
    } else {
      navigate(path);
    }
    setIsExpanded(false);
  };

  return (
    <Header aria-label="hqTodo" className="hq-header">
      <HeaderName
        className="hq-header-name"
        prefix="hqTodo"
        onClick={() => linkHandler("/")}
      >
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
          <Book size={20} />
        </HeaderGlobalAction>
        {props.menuLinks && props.menuLinks.length > 0 && (
          <HeaderGlobalAction
            aria-label="Links"
            onClick={() => setIsExpanded(!isExpanded)}
            isActive={isExpanded}
          >
            <AppSwitcher size={20} />
          </HeaderGlobalAction>
        )}
      </HeaderGlobalBar>
      {props.menuLinks && props.menuLinks.length > 0 && (
        <HeaderPanel
          className="switcher-panel"
          aria-label="Header Panel"
          expanded={isExpanded}
        >
          <Switcher aria-label="Switcher Container">
            {props.menuLinks.map((it) => (
              <SwitcherItem
                className="switcher-link"
                key={slugify(it.title)}
                onClick={() => linkHandler(it.link)}
                target="_blank"
                aria-label={it.title}
              >
                {it.title}
              </SwitcherItem>
            ))}
          </Switcher>
        </HeaderPanel>
      )}
    </Header>
  );
};

export default HqHeader;
