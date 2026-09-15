import type { Ninja } from "../types/game";

export function NinjaListScreen({
  ninjas,
  onAddSample,
}: {
  ninjas: Ninja[];
  onAddSample: () => void;
}) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div className="card-title">Ninjas</div>
          <div className="card-sub">Roster size: {ninjas.length}</div>
        </div>

        <button className="tab" onClick={onAddSample}>
          Reset to sample
        </button>
      </div>

      <div style={{ height: 12 }} />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 12,
        }}
      >
        {ninjas.map((n) => (
          <div key={n.id} className="card">
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
              <div>
                <div style={{ fontFamily: "'Zen Kaku Gothic New', sans-serif", fontWeight: 700, fontSize: 14 }}>{n.name}</div>
                <div style={{ color: "var(--text-faint)", fontSize: 12, fontWeight: 500, letterSpacing: "0.03em", textTransform: "uppercase" as const }}>{n.category}</div>
              </div>
              <div style={{ color: "var(--text-muted)", fontSize: 12, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                HP {n.hp} <br />
                CHK {n.chk}
              </div>
            </div>

            <div style={{ marginTop: 10, color: "var(--text-muted)", fontSize: 12, fontVariantNumeric: "tabular-nums" }}>
              ATK {n.atk} | CTR {n.ctr} | DEF {n.def} | SPD {n.spd}
            </div>

            <div style={{ marginTop: 10, color: "var(--text-faint)", fontSize: 12, lineHeight: 1.5 }}>
              {"abilityText" in n ? (n as any).abilityText : (n as any).ability ?? ""}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
