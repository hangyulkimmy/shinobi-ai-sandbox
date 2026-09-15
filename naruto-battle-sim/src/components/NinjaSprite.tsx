/**
 * Procedural 16x16 pixel sprite renderer for Naruto characters.
 * Renders an SVG grid where each "pixel" is a colored rect.
 * Pokemon-style retro look.
 */

import { useMemo } from "react";
import { SPRITE_CONFIGS, type SpriteConfig } from "../data/spriteConfig";

type Props = {
  ninjaId: string;
  size?: number;    // display size in px (default 48)
  dead?: boolean;   // gray out if KO
};

// 16x16 grid. null = transparent, string = hex color
type Grid = (string | null)[][];

function makeGrid(): Grid {
  return Array.from({ length: 16 }, () => Array(16).fill(null));
}

function set(g: Grid, r: number, c: number, color: string) {
  if (r >= 0 && r < 16 && c >= 0 && c < 16) g[r][c] = color;
}

function fillRect(g: Grid, r: number, c: number, h: number, w: number, color: string) {
  for (let dr = 0; dr < h; dr++)
    for (let dc = 0; dc < w; dc++)
      set(g, r + dr, c + dc, color);
}

// Darken a hex color
function darken(hex: string, amt = 30): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, ((n >> 16) & 0xff) - amt);
  const gr = Math.max(0, ((n >> 8) & 0xff) - amt);
  const b = Math.max(0, (n & 0xff) - amt);
  return `#${((r << 16) | (gr << 8) | b).toString(16).padStart(6, "0")}`;
}

function lighten(hex: string, amt = 30): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, ((n >> 16) & 0xff) + amt);
  const gr = Math.min(255, ((n >> 8) & 0xff) + amt);
  const b = Math.min(255, (n & 0xff) + amt);
  return `#${((r << 16) | (gr << 8) | b).toString(16).padStart(6, "0")}`;
}

function buildSprite(cfg: SpriteConfig): Grid {
  const g = makeGrid();
  const { hair, hairStyle, skin, outfit, outfit2, accent, feature, cloakColor } = cfg;
  const hairDk = darken(hair, 25);
  const skinDk = darken(skin, 20);
  const outfitDk = darken(outfit, 20);

  // ═══ HEAD (rows 1-6) ═══

  // Hair top (row 1-2) - varies by style
  switch (hairStyle) {
    case "spiky":
      set(g, 0, 6, hair); set(g, 0, 9, hair); set(g, 0, 7, hairDk);
      fillRect(g, 1, 5, 1, 6, hair);
      set(g, 1, 5, hairDk);
      break;
    case "long":
      fillRect(g, 1, 5, 1, 6, hair);
      set(g, 2, 4, hair); set(g, 2, 11, hair);
      set(g, 3, 4, hair); set(g, 3, 11, hair);
      set(g, 4, 4, hair); set(g, 4, 11, hair);
      set(g, 5, 4, hairDk); set(g, 5, 11, hairDk);
      break;
    case "short":
      fillRect(g, 1, 5, 1, 6, hair);
      break;
    case "ponytail":
      fillRect(g, 1, 5, 1, 6, hair);
      set(g, 2, 11, hair); set(g, 3, 12, hair); set(g, 4, 12, hairDk);
      break;
    case "wild":
      set(g, 0, 5, hair); set(g, 0, 7, hair); set(g, 0, 9, hair); set(g, 0, 10, hair);
      fillRect(g, 1, 4, 1, 8, hair);
      set(g, 2, 4, hair); set(g, 2, 11, hair);
      set(g, 3, 3, hairDk); set(g, 3, 12, hairDk);
      break;
    case "bowl":
      fillRect(g, 1, 5, 1, 6, hair);
      set(g, 2, 4, hair); set(g, 2, 11, hair);
      fillRect(g, 3, 4, 1, 2, hair); fillRect(g, 3, 10, 1, 2, hair);
      break;
    case "bald":
      fillRect(g, 1, 6, 1, 4, skin);
      break;
    case "buns":
      fillRect(g, 1, 5, 1, 6, hair);
      set(g, 0, 4, hair); set(g, 0, 11, hair);
      set(g, 1, 4, hair); set(g, 1, 11, hair);
      break;
  }

  // Hair band row (row 2)
  fillRect(g, 2, 5, 1, 6, hair);

  // Face (rows 3-5)
  fillRect(g, 3, 5, 3, 6, skin);

  // Eyes (row 3)
  const eyeColor = feature === "sharingan" ? "#c03030" : feature === "byakugan" ? "#d8d0f0" : "#1a1a2a";
  set(g, 3, 6, eyeColor);
  set(g, 3, 9, eyeColor);
  // Eye whites
  set(g, 3, 7, "#e0e0e0");
  set(g, 3, 8, "#e0e0e0");

  // Headband (row 2 accent stripe)
  fillRect(g, 2, 6, 1, 4, accent);

  // Mouth (row 5)
  set(g, 5, 7, skinDk); set(g, 5, 8, skinDk);

  // Mask feature (covers lower face)
  if (feature === "mask") {
    fillRect(g, 4, 5, 2, 6, "#3a3a4a");
  }

  // Face paint
  if (feature === "paint") {
    set(g, 4, 5, "#6a3a8a"); set(g, 4, 10, "#6a3a8a");
  }

  // Glasses
  if (feature === "glasses") {
    set(g, 3, 5, "#3a3a5a"); set(g, 3, 10, "#3a3a5a");
    fillRect(g, 3, 6, 1, 4, lighten(accent, 40));
  }

  // ═══ BODY (rows 6-10) ═══

  // Neck (row 6)
  set(g, 6, 7, skin); set(g, 6, 8, skin);

  // Torso (rows 7-9)
  fillRect(g, 7, 5, 3, 6, outfit);
  // Center stripe
  fillRect(g, 7, 7, 3, 2, outfit2);

  // Cloak overlay (Akatsuki etc)
  if (cloakColor) {
    set(g, 7, 5, cloakColor); set(g, 7, 10, cloakColor);
    set(g, 8, 5, cloakColor); set(g, 8, 10, cloakColor);
    set(g, 9, 5, cloakColor); set(g, 9, 10, cloakColor);
    // Cloud pattern dots
    set(g, 8, 6, cloakColor); set(g, 8, 9, cloakColor);
  }

  // Arms (rows 7-9)
  fillRect(g, 7, 4, 3, 1, outfit);
  fillRect(g, 7, 11, 3, 1, outfit);
  // Hands
  set(g, 10, 4, skin); set(g, 10, 11, skin);

  // Belt
  fillRect(g, 10, 5, 1, 6, outfitDk);

  // ═══ LEGS (rows 11-13) ═══
  fillRect(g, 11, 5, 3, 2, outfit2);
  fillRect(g, 11, 9, 3, 2, outfit2);
  // Gap between legs
  fillRect(g, 11, 7, 3, 2, null as unknown as string);

  // ═══ FEET (rows 14-15) ═══
  fillRect(g, 14, 5, 1, 2, "#2a2a3a");
  fillRect(g, 14, 9, 1, 2, "#2a2a3a");

  // ═══ FEATURES / EQUIPMENT ═══
  if (feature === "sword") {
    fillRect(g, 3, 12, 8, 1, "#a0a8b8");
    set(g, 2, 12, "#c0a050"); // hilt
  }
  if (feature === "gourd") {
    fillRect(g, 5, 12, 4, 2, SAND_GOURD);
    set(g, 4, 12, SAND_GOURD);
  }
  if (feature === "fan") {
    fillRect(g, 5, 12, 3, 2, "#5a5a6a");
    set(g, 4, 13, "#5a5a6a");
  }
  if (feature === "scythe") {
    fillRect(g, 2, 12, 6, 1, "#8a8a9a");
    set(g, 1, 12, "#c04040"); set(g, 1, 13, "#c04040");
  }
  if (feature === "puppet") {
    set(g, 8, 13, "#8a6a4a"); set(g, 9, 13, "#8a6a4a"); set(g, 10, 13, "#6a4a2a");
  }
  if (feature === "dog") {
    // Small companion
    fillRect(g, 12, 12, 2, 2, "#e0d8c8");
    set(g, 11, 12, "#e0d8c8"); // head
    set(g, 11, 13, "#3a2a1a"); // ear
  }

  return g;
}

const SAND_GOURD = "#c4a060";

function gridToPixels(grid: Grid): { r: number; c: number; color: string }[] {
  const pixels: { r: number; c: number; color: string }[] = [];
  for (let r = 0; r < 16; r++) {
    for (let c = 0; c < 16; c++) {
      if (grid[r][c]) pixels.push({ r, c, color: grid[r][c]! });
    }
  }
  return pixels;
}

// Fallback config for unknown ninjas
const FALLBACK: SpriteConfig = {
  hair: "#5a5a5a", hairStyle: "short", skin: "#f5d0a9",
  outfit: "#4a4a5a", outfit2: "#3a3a4a", accent: "#4a90d9",
};

export function NinjaSprite({ ninjaId, size = 48, dead = false }: Props) {
  const pixels = useMemo(() => {
    // Handle zetsu-b split
    const lookupId = ninjaId.endsWith("-b") ? ninjaId.replace(/-b$/, "") : ninjaId;
    const cfg = SPRITE_CONFIGS[lookupId] ?? FALLBACK;
    return gridToPixels(buildSprite(cfg));
  }, [ninjaId]);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      style={{
        imageRendering: "pixelated",
        opacity: dead ? 0.3 : 1,
        filter: dead ? "grayscale(1)" : undefined,
        display: "block",
      }}
    >
      {pixels.map((p, i) => (
        <rect key={i} x={p.c} y={p.r} width={1} height={1} fill={p.color} />
      ))}
    </svg>
  );
}

/** Row of sprites for a team */
export function TeamSprites({
  ninjaIds,
  fighters,
  size = 48,
}: {
  ninjaIds: string[];
  fighters?: { ninjaId: string; alive: boolean }[];
  size?: number;
}) {
  return (
    <div className="sprite-row">
      {ninjaIds.map((nid) => {
        const dead = fighters ? !fighters.find((f) => f.ninjaId === nid)?.alive : false;
        return <NinjaSprite key={nid} ninjaId={nid} size={size} dead={dead} />;
      })}
    </div>
  );
}
