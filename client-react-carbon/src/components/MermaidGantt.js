import React, { useEffect } from "react";
import mermaid from "mermaid";
import { makeMermaidText } from "../utils/makeMermaidText";
import "./MermaidGantt.css";

const MermaidGantt = (props) => {

  useEffect(() => {
    window.showHover = (id) => {
      const hover = document.querySelector(`#h${id}`);
      hover.classList.toggle("showme");
      hover.classList.toggle("hideme");
    };  
    window.linkTo = (url) => window.open(url, "_blank");
    mermaid.mermaidAPI.initialize({
      startOnLoad: true,
      securityLevel: "loose",
      gantt: {
        axisFormat: "%d %b",
        titleTopMargin: 25,
        topPadding: 60,
        barGap: 4,
        barheight: 75,
        bottomMarginAdjust: 1,
      },
    });
  }, []);

  useEffect(() => {
    const mermaidText = makeMermaidText(props.issues);
    const gantt = document.getElementById('ourgantt');
    mermaid.mermaidAPI.render("mermaid-svg", mermaidText, (svgraph, bindFunctions) => {
      gantt.innerHTML = svgraph;
      bindFunctions(gantt);
    }, gantt);
    const chart = document.querySelector('#mermaid-svg');
    const vbox = chart.getAttribute('viewBox').split(' ');
    const hAdj = vbox[3] - 80;
    const ticks = document.querySelectorAll('#mermaid-svg .tick');
    ticks.forEach((elem) => {
      const theLine = elem.firstElementChild;
      const bottomText = elem.lastElementChild;
      const topText = bottomText.cloneNode(true);
      elem.insertBefore(topText, theLine);
      topText.setAttribute('y', -hAdj);
    });
  }, [props]);

  return <div id="ourgantt"></div>

};

export default MermaidGantt;
