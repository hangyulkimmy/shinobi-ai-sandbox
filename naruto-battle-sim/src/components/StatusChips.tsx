import type { Status } from "../types/game";

export function StatusChips({ statuses }: { statuses: Status[] }) {
  if (!statuses.length) return <div className="status-none">No status</div>;

  return (
    <div className="status-row">
      {statuses.map((s, i) => (
        <span key={i} className="chip">
          {s.id}
          {s.turns ? `:${s.turns}` : ""}
        </span>
      ))}
    </div>
  );
}
