import React from "react";
import { Grid, Column, Content, Tag, Theme } from "@carbon/react";
import SwaggerUI from "swagger-ui-react";
import swaggerData from "/src/utils/swaggerData";
import "swagger-ui-react/swagger-ui.css";
import "./HqPageSwagger.css";

const HqPageSwagger = () => {
  const colors = [
    {
      color: "red",
      name: "has-blocker",
      desc: "Red contains a blocker. Supersedes active.",
    },
    {
      color: "blue",
      name: "has-active",
      desc: "Blue contains open active items (in progress or milestone ♦). Supersedes pending.",
    },
    {
      color: "teal",
      name: "has-pending",
      desc: "Teal contains open pending items (backlog, none in progress). Supersedes green.",
    },
    {
      color: "green",
      name: "has-closed",
      desc: "Green contains closed items (nothing currently open).",
    },
  ];

  return (
    <Theme theme="g10">
      <Grid>
        <Column lg={16} md={8} sm={4}>
          <Content className="doc-page-content">
            <h1>Help</h1>
            <ul>
              <li>
                To scroll through the tag list when viewed from a desktop
                browser, use the arrow buttons or hold down Shift while
                scrolling the mouse wheel.
              </li>
            </ul>
            <h2 id="doc-legend">Tag color legend</h2>
            <div className="doc-section-legend">
              <ul>
                {colors.map((c) => (
                  <li className="doc-tag" key={c.name}>
                    <div className="doc-tag-item">
                      <Theme theme="g90">
                        <Tag type={c.color} id={c.name}>
                          <span>{c.name.replace("-", " ")}</span>
                        </Tag>
                      </Theme>
                    </div>
                    <div className="doc-tag-description">{c.desc}</div>
                  </li>
                ))}
              </ul>
            </div>
            <SwaggerUI spec={swaggerData} />
          </Content>
        </Column>
      </Grid>
    </Theme>
  );
};

export default HqPageSwagger;
