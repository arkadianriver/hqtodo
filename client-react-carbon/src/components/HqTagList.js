import React from "react";
import "./HqTagList.css";
import { useHistory } from "react-router-dom";
import { Tile, Tag } from "carbon-components-react";
import { NextOutline24, PreviousOutline24 } from "@carbon/icons-react";

const HqTagList = (props) => {
  const prevClickHandler = () => {
    slide("left");
  };

  const nextClickHandler = () => {
    slide("right");
  };

  const slide = (direction) => {
    const container = document.querySelector(".hq-tag-box");
    let scrollCompleted = 0;
    let slideVar = setInterval(() => {
      if (direction === "left") {
        container.scrollLeft -= 30;
      } else {
        container.scrollLeft += 30;
      }
      scrollCompleted += 10;
      if (scrollCompleted >= 100) {
        window.clearInterval(slideVar);
      }
    }, 60);
  }

  const history = useHistory();
  const clickHandler = (tag) => {
    history.push(`/tags/${tag}`);
  };

  const getColor = (tagClass) => {
    return tagClass.includes("hasblocker")
      ? "red"
      : tagClass.includes("hasactive")
      ? "blue"
      : tagClass.includes("hasclosed")
      ? "green"
      : "teal";
  };

  const milestoneClass = (tagClass) => {
    return tagClass.includes("hasmilestone") ? "has-milestone" : "";
  };

  return (
    <Tile className="hq-tag-tile">
      <div className="hq-tag-row">
        <div className="hq-tag-leftbttn" onClick={prevClickHandler}>
          <PreviousOutline24 />
        </div>
        <div className="hq-tag-box">
          {props.tags &&
            props.tags.map((t) => (
              <Tag
                type={getColor(t.class)}
                title={t.tag}
                onClick={() => clickHandler(t.tag)}
                className="hq-tag-entry"
              >
                <span className={milestoneClass(t.class)}>@{t.tag}</span>
              </Tag>
            ))}
        </div>
        <div className="hq-tag-rightbttn" onClick={nextClickHandler}>
          <NextOutline24 />
        </div>
      </div>
    </Tile>
  );
};

export default HqTagList;
