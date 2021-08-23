import "./HqEntryClosed.css";

const HqEntryClosed = (props) => {

  const makeLink = (href) => {
    const titleSpan = <span className="ctitle"> {props.entry.title}</span>;
    return href ? (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {titleSpan}
      </a>
    ) : (
      titleSpan
    );
  };

  return (
    <li className="centry">
      <div className="cbullet">✔</div>
      <div className="ctext">
        <span className="cdate">{props.entry.closed_on}</span>
        {makeLink(props.entry.link)}
        {props.entry.tags && (
          <span className="ctagstring"> {props.entry.tags.join(' ')}</span>
        )}
        <span class="cestimate"> ({props.entry.est})</span>
      </div>
    </li>
  );
};

export default HqEntryClosed;
