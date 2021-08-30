import "./HqFooter.css";
import { Row, Column, Grid } from "carbon-components-react";
import { HashLink as Link } from "react-router-hash-link";

const HqFooter = (props) => {
  const makeLink = (href, linktext) => {
    return href.substr(0, 4) === "http" ? (
      <a
        className="smaller-link"
        href={href}
        target="_blank"
        rel="noopener noreferrer"
      >
        {linktext}
      </a>
    ) : (
      <Link
        className="smaller-link"
        to={href}
      >
        {linktext}
      </Link>
    );
  };

  return (
    <Grid>
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
              An {makeLink("/doc#doc-server", "API")} is also available.
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
    </Grid>
  );
};

export default HqFooter;
