export function Bar(props: { label: string; value: number; max: number }) {
    const pct =
      props.max <= 0 ? 0 : Math.max(0, Math.min(100, (props.value / props.max) * 100));
  
    return (
      <div className="bar">
        <div className="bar-top">
          <span>{props.label}</span>
          <span>
            {props.value}/{props.max}
          </span>
        </div>
  
        <div className="bar-track">
          <div className="bar-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>
    );
  }
  