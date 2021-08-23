import "./HqEntryOpen.css";

const HqEntryOpen = (props) => {
  const isMilestone =
    props.entry.enddate &&
    props.entry.enddate === props.entry.startdate.substr(0, 10);

  const liBullet = props.entry.hover ? "!" : isMilestone ? "♦" : "☐";

  const makeLink = (href) => {
    const titleSpan = <span className="otitle"> {props.entry.title}</span>;
    return href ? (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {titleSpan}
      </a>
    ) : (
      titleSpan
    );
  };

  return (
    <li className="oentry">
      <div className="obullet">{liBullet}</div>
      <div className="otext">
        {isMilestone && <span>{props.entry.enddate}</span>}
        {makeLink(props.entry.link)}
        {props.entry.tagstring && (
          <span className="tagstring"> {props.entry.tagstring}</span>
        )}
        {!isMilestone && <span class="estimate"> ({props.entry.est})</span>}
        {props.entry.hover &&
          props.entry.hover.split("<br />").map((h) => (
            <div className="blocker-line">
              <br />
              <span class="blockers">{h}</span>
            </div>
          ))}
      </div>
    </li>
  );
};

export default HqEntryOpen;
