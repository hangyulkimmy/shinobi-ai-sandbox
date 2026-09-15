import type { Fighter, Ninja } from "../types/game";
import { Bar } from "./Bar";
import { StatusChips } from "./StatusChips";

export function NinjaCard({ ninja, fighter }: { ninja: Ninja; fighter: Fighter }) {
  return (
    <div className="ninja-card">
      <div className="ninja-head">
        <div>
          <div className="ninja-name">{ninja.name}</div>
          <div className="ninja-sub">{ninja.category}</div>
        </div>
        <div className="ninja-state">{fighter.alive ? "Alive" : "KO"}</div>
      </div>

      <div className="ninja-bars">
        <Bar label="HP" value={fighter.hp} max={ninja.hp} />
        <Bar label="CHK" value={fighter.chk} max={ninja.chk} />
        <StatusChips statuses={fighter.statuses} />
      </div>
    </div>
  );
}
