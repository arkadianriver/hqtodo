import "./HqFooter.css";
import { Row, Column, Link } from "carbon-components-react";

const HqFooter = (props) => {

  const makeLink = (href, linktext) => {
    return href.substr(0, 4) === "http" ? (
      <a className="smaller-link" href={href} target="_blank" rel="noopener noreferrer">
        {linktext}
      </a>
    ) : (
      <Link className="smaller-link" to={href} target="_blank" rel="noopener noreferrer">
        {linktext}
      </Link>
    );
  };

  return (
    <Row>
      <Column>
        <hr />
        <div className="hq-footer">
          <p>
            Made with ♥ by{" "}
            {makeLink("https://github.com/arkadianriver/hqtodo", "hqtodo")},
            <br />
            Mermaid, ApexCharts, autoComplete.js, React,
            <br />
            IBM Carbon Design System, and other fine modules.
            <br />
            An {makeLink("/doc", "API")} is also available.
          </p>
          <p>
            Page last updated:
            <br />
            {props.pageUpdated}
            <br />
            Task file last updated:
            <br />
            {props.fileUpdated}
          </p>
        </div>
      </Column>
    </Row>
  );
};

export default HqFooter;
