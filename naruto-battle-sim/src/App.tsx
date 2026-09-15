import { useMemo, useState } from "react";
import type { Ninja, Team } from "./types/game";
import { SAMPLE_NINJAS } from "./data/defaults";
import { NinjaListScreen } from "./screens/NinjaListScreen";
import { BattleSetupScreen } from "./screens/BattleSetupScreen";
import { BattleScreen } from "./screens/BattleScreen";

type Screen = "ninjas" | "setup" | "battle";

// Always use defaults.ts as the source of truth.
// Previously we cached ninjas in localStorage, which caused edits to
// defaults.ts to be ignored.  Clear stale cache on load.
const LS_KEY = "naruto_sim_ninjas_v1";
try { localStorage.removeItem(LS_KEY); } catch { /* noop */ }

function loadNinjas(): Ninja[] {
  return SAMPLE_NINJAS;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("ninjas");
  const [ninjas, setNinjas] = useState<Ninja[]>(() => loadNinjas());
  const [battleTeams, setBattleTeams] = useState<Team[] | null>(null);

  const count = useMemo(() => ninjas.length, [ninjas]);

  function resetSample() {
    setNinjas(SAMPLE_NINJAS);
  }

  function startBattle(teams: Team[]) {
    setBattleTeams(teams);
    setScreen("battle");
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-inner">
          <div>
            <div className="brand-title">NARUTO <span style={{ color: 'var(--accent)' }}>BATTLE SIM</span></div>
            <div className="brand-sub">
              Turn-based shinobi combat simulator
            </div>
          </div>

          <nav className="nav">
            <button
              className={`tab ${screen === "ninjas" ? "active" : ""}`}
              onClick={() => setScreen("ninjas")}
            >
              Ninja List ({count})
            </button>

            <button
              className={`tab ${screen === "setup" ? "active" : ""}`}
              onClick={() => setScreen("setup")}
            >
              Battle Setup
            </button>

            <button
              className={`tab ${screen === "battle" ? "active" : ""}`}
              onClick={() => setScreen("battle")}
              disabled={!battleTeams}
              title={!battleTeams ? "Create teams first" : "Go to battle"}
            >
              Battle
            </button>

            <button className="tab" onClick={resetSample} title="Reset to sample ninjas">
              Reset Sample
            </button>
          </nav>
        </div>
      </header>

      <main className="main">
        {screen === "ninjas" && (
          <div className="card">
            <div className="card-title">Roster</div>
            <div className="card-sub">Manage ninjas (localStorage).</div>
            <div style={{ height: 12 }} />
            <NinjaListScreen ninjas={ninjas} onAddSample={resetSample} />
          </div>
        )}

        {screen === "setup" && (
          <div className="card">
            <div className="card-title">Setup</div>
            <div className="card-sub">Build 2–3 teams (max 5 each).</div>
            <div style={{ height: 12 }} />
            <BattleSetupScreen ninjas={ninjas} onStart={startBattle} />
          </div>
        )}

        {screen === "battle" && battleTeams && (
          <div className="card">
            <div className="card-title">Battle</div>
            <div className="card-sub">AI autobattles and logs every turn.</div>
            <div style={{ height: 12 }} />
            <BattleScreen ninjas={ninjas} teams={battleTeams} onBack={() => setScreen("setup")} />
          </div>
        )}
      </main>
    </div>
  );
}
