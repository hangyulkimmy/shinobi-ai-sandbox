import { useMemo, useState } from "react";
import type { BattleState, Ninja, Team } from "../types/game";
import { initBattle, stepTurn } from "../engine/battle";
import { NinjaCard } from "../components/NinjaCard";
import { TeamSprites } from "../components/NinjaSprite";

export function BattleScreen({
  ninjas,
  teams,
  onBack,
}: {
  ninjas: Ninja[];
  teams: Team[];
  onBack: () => void;
}) {
  const [state, setState] = useState<BattleState>(() => initBattle(ninjas, teams));

  const fightersByTeam = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const t of teams) map[t.id] = [];
    for (const f of state.fighters) map[f.teamId].push(f.ninjaId);
    return map;
  }, [state.fighters, teams]);

  function runOneTurn() {
    setState((s) => {
      try {
        return stepTurn({ ...s, fighters: [...s.fighters] }, ninjas);
      } catch (e) {
        console.error("stepTurn error:", e);
        return { ...s, log: [...s.log, `\n⚠️ ERROR: ${e instanceof Error ? e.message : String(e)}`] };
      }
    });
  }

  function runAuto() {
    setState((s0) => {
      let s = { ...s0, fighters: [...s0.fighters] };
      for (let i = 0; i < 50; i++) {
        if (s.winnerTeamId) break;
        try {
          s = stepTurn(s, ninjas);
        } catch (e) {
          console.error("stepTurn error:", e);
          return { ...s, log: [...s.log, `\n⚠️ ERROR: ${e instanceof Error ? e.message : String(e)}`] };
        }
      }
      return s;
    });
  }

  function copyLog() {
    navigator.clipboard.writeText(state.log.join("\n"));
    alert("Copied log!");
  }

  const cols = teams.length === 3 ? "repeat(3, minmax(260px, 1fr))" : "repeat(2, minmax(260px, 1fr))";

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div className="card-title">Battle</div>
          <div className="card-sub">Step turns or auto-run. Copy the log for sharing.</div>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="tab" onClick={onBack}>
            Back
          </button>
          <button className="tab" onClick={runOneTurn}>
            Step Turn
          </button>
          <button className="tab" onClick={runAuto}>
            Auto (50T max)
          </button>
          <button className="tab" onClick={copyLog}>
            Copy Log
          </button>
        </div>
      </div>

      {state.winnerTeamId && (
        <div className="card" style={{ marginTop: 12, background: "var(--accent-faint)", borderColor: "var(--accent)" }}>
          <span style={{ fontFamily: "'Zen Kaku Gothic New', sans-serif", fontWeight: 700, color: "var(--accent)" }}>Winner:</span> {teams.find((t) => t.id === state.winnerTeamId)?.name ?? state.winnerTeamId}
        </div>
      )}

      <div style={{ height: 14 }} />

      <div style={{ display: "grid", gridTemplateColumns: cols, gap: 14 }}>
        {teams.map((t) => (
          <div key={t.id} style={{ display: "grid", gap: 10 }}>
            <div style={{ fontWeight: 800 }}>{t.name}</div>

            <TeamSprites
              ninjaIds={fightersByTeam[t.id]}
              fighters={state.fighters}
              size={48}
            />

            <div style={{ display: "grid", gap: 12 }}>
              {fightersByTeam[t.id].map((nid) => {
                const n = ninjas.find((x) => x.id === nid) ?? ninjas.find((x) => nid.startsWith(x.id));
                const f = state.fighters.find((x) => x.ninjaId === nid);
                if (!n || !f) return null;
                return <NinjaCard key={nid} ninja={n} fighter={f} />;
              })}
            </div>
          </div>
        ))}
      </div>

      <div style={{ height: 16 }} />

      <div className="card" style={{ background: "var(--bg-card-alt)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ fontWeight: 800 }}>Battle Log</div>
          <div style={{ fontSize: 12, opacity: 0.75 }}>{state.log.length} lines</div>
        </div>

        <pre
          style={{
            marginTop: 10,
            fontSize: 12,
            lineHeight: 1.5,
            whiteSpace: "pre-wrap",
            maxHeight: 360,
            overflow: "auto",
            opacity: 0.95,
          }}
        >
          {state.log.join("\n")}
        </pre>
      </div>
    </div>
  );
}
