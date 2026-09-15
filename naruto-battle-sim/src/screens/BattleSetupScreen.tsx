import { useEffect, useState } from "react";
import type { Ninja, Team } from "../types/game";
import { TeamSprites } from "../components/NinjaSprite";

function uniqId() {
  return Math.random().toString(36).slice(2, 9);
}

export function BattleSetupScreen({
  ninjas,
  onStart,
}: {
  ninjas: Ninja[];
  onStart: (teams: Team[]) => void;
}) {
  const [teamCount, setTeamCount] = useState<2 | 3>(2);
  const [teams, setTeams] = useState<Team[]>([
    { id: "t1", name: "Team 1", members: [] },
    { id: "t2", name: "Team 2", members: [] },
  ]);

  // ✅ useEffect (not useMemo) for syncing derived state
  useEffect(() => {
    setTeams((prev) => {
      const next = [...prev];
      while (next.length < teamCount) {
        next.push({ id: uniqId(), name: `Team ${next.length + 1}`, members: [] });
      }
      while (next.length > teamCount) next.pop();
      return next;
    });
  }, [teamCount]);

  function toggleMember(teamId: string, ninjaId: string) {
    setTeams((prev) =>
      prev.map((t) => {
        if (t.id !== teamId) return t;
        const has = t.members.includes(ninjaId);
        const members = has ? t.members.filter((x) => x !== ninjaId) : [...t.members, ninjaId];
        return { ...t, members: members.slice(0, 5) };
      })
    );
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div className="card-title">Battle Setup</div>
          <div className="card-sub">Pick 2–3 teams, up to 5 ninjas each.</div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, opacity: 0.9, fontSize: 13 }}>
            Teams:
            <select
              value={teamCount}
              onChange={(e) => setTeamCount(Number(e.target.value) as 2 | 3)}
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "inherit",
                borderRadius: 12,
                padding: "10px 12px",
              }}
            >
              <option value={2}>2</option>
              <option value={3}>3</option>
            </select>
          </label>

          <button className="tab" onClick={() => onStart(teams)}>
            Start
          </button>
        </div>
      </div>

      <div style={{ height: 14 }} />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: teamCount === 3 ? "repeat(3, minmax(260px, 1fr))" : "repeat(2, minmax(260px, 1fr))",
          gap: 14,
        }}
      >
        {teams.map((t) => (
          <div key={t.id} className="card" style={{ padding: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontWeight: 800 }}>{t.name}</div>
              <div style={{ fontSize: 12, opacity: 0.75 }}>{t.members.length}/5</div>
            </div>

            {t.members.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <TeamSprites ninjaIds={t.members} size={44} />
              </div>
            )}

            <div style={{ height: 10 }} />

            <div
              style={{
                display: "grid",
                gap: 8,
                maxHeight: 420,
                overflow: "auto",
                paddingRight: 6,
              }}
            >
              {ninjas.map((n) => {
                const selected = t.members.includes(n.id);
                return (
                  <button
                    key={n.id}
                    onClick={() => toggleMember(t.id, n.id)}
                    style={{
                      textAlign: "left",
                      borderRadius: 12,
                      padding: "10px 12px",
                      border: `1px solid ${selected ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.12)"}`,
                      background: selected ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.06)",
                      color: "inherit",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ fontWeight: 800, fontSize: 14 }}>{n.name}</div>
                    <div style={{ opacity: 0.75, fontSize: 12 }}>{n.category}</div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
