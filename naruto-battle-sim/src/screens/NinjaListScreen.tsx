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
                <div style={{ fontWeight: 800 }}>{n.name}</div>
                <div style={{ opacity: 0.8, fontSize: 12 }}>{n.category}</div>
              </div>
              <div style={{ opacity: 0.7, fontSize: 12, textAlign: "right" }}>
                HP {n.hp} <br />
                CHK {n.chk}
              </div>
            </div>

            <div style={{ marginTop: 10, opacity: 0.9, fontSize: 12 }}>
              ATK {n.atk} | CTR {n.ctr} | DEF {n.def} | SPD {n.spd}
            </div>

            <div style={{ marginTop: 10, opacity: 0.8, fontSize: 12 }}>
              {/* pick the correct field name */}
              {"abilityText" in n ? (n as any).abilityText : (n as any).ability ?? ""}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
