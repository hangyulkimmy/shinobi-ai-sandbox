/**
 * Pixel sprite configuration for all 48 ninjas.
 * Each config defines colors and features used by the procedural sprite renderer.
 *
 * The sprite is a 16x16 pixel grid rendered as SVG rects.
 * Body template: head (rows 0-5), torso (rows 6-9), legs (rows 10-13), feet (rows 14-15)
 */

export type SpriteConfig = {
  hair: string;       // Hair color
  hairStyle: "spiky" | "long" | "short" | "ponytail" | "bald" | "wild" | "bowl" | "buns";
  skin: string;       // Skin color
  outfit: string;     // Primary outfit color
  outfit2: string;    // Secondary outfit/trim color
  accent: string;     // Headband or accent color
  feature?: "mask" | "sharingan" | "byakugan" | "gourd" | "sword" | "fan" | "puppet" | "scythe" | "cloak" | "glasses" | "bandages" | "hood" | "paint" | "dog";
  cloakColor?: string; // Akatsuki cloak or special overlay
};

function nid(name: string): string {
  return name.toLowerCase().replace(/[()]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

// Village palette shortcuts
const LEAF_GREEN = "#3a7d44";
const LEAF_VEST = "#5a8a5e";
const CLOUD_WHITE = "#c8cdd4";
const MIST_BLUE = "#5b8fa8";
const SAND_TAN = "#c4a95a";
const SAND_BROWN = "#8b6f3a";
const AKATSUKI_BLACK = "#1a1a2e";
const AKATSUKI_RED = "#c0392b";
const STONE_BROWN = "#8b7355";

const SKIN_LIGHT = "#f5d0a9";
const SKIN_MED = "#d4a574";
const SKIN_DARK = "#8b6f47";
const SKIN_PALE = "#f0e6d3";
const SKIN_GREEN = "#b8c9a3"; // Zetsu

export const SPRITE_CONFIGS: Record<string, SpriteConfig> = {
  // 1. Tsunade
  [nid("Tsunade")]: { hair: "#f5e6a0", hairStyle: "ponytail", skin: SKIN_LIGHT, outfit: "#8a8a8a", outfit2: LEAF_GREEN, accent: "#4a90d9" },
  // 2. Killer B
  [nid("Killer B")]: { hair: "#f5f5f5", hairStyle: "short", skin: SKIN_DARK, outfit: CLOUD_WHITE, outfit2: "#4a4a5a", accent: "#4a90d9", feature: "sword" },
  // 3. Orochimaru
  [nid("Orochimaru")]: { hair: "#1a1a2a", hairStyle: "long", skin: SKIN_PALE, outfit: "#4a4a5a", outfit2: "#8a6ab0", accent: "#8a6ab0" },
  // 4. Kisame
  [nid("Kisame Hoshigaki")]: { hair: "#3a5a8a", hairStyle: "spiky", skin: "#7a9aba", outfit: AKATSUKI_BLACK, outfit2: AKATSUKI_RED, accent: MIST_BLUE, feature: "sword", cloakColor: AKATSUKI_RED },
  // 5. Minato
  [nid("Minato Namikaze")]: { hair: "#f0d060", hairStyle: "spiky", skin: SKIN_LIGHT, outfit: "#4a90d9", outfit2: "#f0d060", accent: "#4a90d9", feature: "cloak" },
  // 6. Pain
  [nid("Pain")]: { hair: "#d06030", hairStyle: "spiky", skin: SKIN_PALE, outfit: AKATSUKI_BLACK, outfit2: AKATSUKI_RED, accent: "#8a6ab0", cloakColor: AKATSUKI_RED },
  // 7. A (4th Raikage)
  [nid("A (4th Raikage)")]: { hair: "#f5f5f5", hairStyle: "short", skin: SKIN_DARK, outfit: CLOUD_WHITE, outfit2: "#f0d060", accent: "#f0d060" },
  // 8. Kakashi
  [nid("Kakashi Hatake")]: { hair: "#c0c8d4", hairStyle: "spiky", skin: SKIN_LIGHT, outfit: LEAF_VEST, outfit2: "#2a2a3a", accent: "#4a90d9", feature: "mask" },
  // 9. Jiraiya
  [nid("Jiraiya")]: { hair: "#f5f5f5", hairStyle: "wild", skin: SKIN_LIGHT, outfit: "#c0392b", outfit2: LEAF_GREEN, accent: "#c0392b" },
  // 10. Naruto
  [nid("Naruto Uzumaki")]: { hair: "#f0a030", hairStyle: "spiky", skin: SKIN_LIGHT, outfit: "#f08020", outfit2: "#2a2a3a", accent: "#4a90d9" },
  // 11. Gaara
  [nid("Gaara")]: { hair: "#c04030", hairStyle: "short", skin: SKIN_PALE, outfit: SAND_TAN, outfit2: "#6a3a2a", accent: SAND_TAN, feature: "gourd" },
  // 12. Sasuke
  [nid("Sasuke Uchiha")]: { hair: "#1a1a2e", hairStyle: "spiky", skin: SKIN_LIGHT, outfit: "#2a2a3a", outfit2: "#4a4a6a", accent: "#4a90d9", feature: "sharingan" },
  // 13. Itachi
  [nid("Itachi Uchiha")]: { hair: "#1a1a2e", hairStyle: "ponytail", skin: SKIN_LIGHT, outfit: AKATSUKI_BLACK, outfit2: AKATSUKI_RED, accent: "#c0392b", feature: "sharingan", cloakColor: AKATSUKI_RED },
  // 14. Might Guy
  [nid("Might Guy")]: { hair: "#1a1a2e", hairStyle: "bowl", skin: SKIN_MED, outfit: LEAF_GREEN, outfit2: "#f08020", accent: "#4a90d9" },
  // 15. Kakuzu
  [nid("Kakuzu")]: { hair: "#3a3a3a", hairStyle: "long", skin: SKIN_DARK, outfit: AKATSUKI_BLACK, outfit2: AKATSUKI_RED, accent: "#8a8a8a", feature: "mask", cloakColor: AKATSUKI_RED },
  // 16. Yamato
  [nid("Yamato")]: { hair: "#5a3a2a", hairStyle: "short", skin: SKIN_LIGHT, outfit: LEAF_VEST, outfit2: "#2a2a3a", accent: "#4a90d9" },
  // 17. Sakura
  [nid("Sakura Haruno")]: { hair: "#f0a0b0", hairStyle: "short", skin: SKIN_LIGHT, outfit: "#c04060", outfit2: LEAF_GREEN, accent: "#4a90d9" },
  // 18. Kabuto
  [nid("Kabuto Yakushi")]: { hair: "#a0a0b0", hairStyle: "ponytail", skin: SKIN_LIGHT, outfit: "#6a5a8a", outfit2: "#3a3a4a", accent: "#8a8a8a", feature: "glasses" },
  // 19. Obito
  [nid("Obito Uchiha")]: { hair: "#1a1a2e", hairStyle: "spiky", skin: SKIN_LIGHT, outfit: AKATSUKI_BLACK, outfit2: AKATSUKI_RED, accent: "#f05020", feature: "mask", cloakColor: AKATSUKI_RED },
  // 20. Rock Lee
  [nid("Rock Lee")]: { hair: "#1a1a2e", hairStyle: "bowl", skin: SKIN_LIGHT, outfit: LEAF_GREEN, outfit2: "#f08020", accent: "#4a90d9", feature: "bandages" },
  // 21. Neji
  [nid("Neji Hyuga")]: { hair: "#5a3a2a", hairStyle: "long", skin: SKIN_LIGHT, outfit: "#d4ceb8", outfit2: LEAF_GREEN, accent: "#4a90d9", feature: "byakugan" },
  // 22. Hinata
  [nid("Hinata Hyuga")]: { hair: "#2a2a5a", hairStyle: "long", skin: SKIN_PALE, outfit: "#b0a0d0", outfit2: LEAF_GREEN, accent: "#4a90d9", feature: "byakugan" },
  // 23. Suigetsu
  [nid("Suigetsu Hozuki")]: { hair: "#d0d8e0", hairStyle: "spiky", skin: SKIN_PALE, outfit: "#6a5a8a", outfit2: MIST_BLUE, accent: MIST_BLUE, feature: "sword" },
  // 24. Choji
  [nid("Choji Akimichi")]: { hair: "#7a4a2a", hairStyle: "wild", skin: SKIN_MED, outfit: "#c04040", outfit2: LEAF_VEST, accent: "#4a90d9" },
  // 25. Hiruzen
  [nid("Hiruzen Sarutobi")]: { hair: "#8a8a8a", hairStyle: "short", skin: SKIN_MED, outfit: LEAF_VEST, outfit2: "#2a2a3a", accent: "#4a90d9" },
  // 26. Mei
  [nid("Mei Terumi")]: { hair: "#8a3a2a", hairStyle: "long", skin: SKIN_LIGHT, outfit: "#3a7acc", outfit2: MIST_BLUE, accent: MIST_BLUE },
  // 27. Sasori
  [nid("Sasori")]: { hair: "#c04030", hairStyle: "short", skin: SKIN_PALE, outfit: AKATSUKI_BLACK, outfit2: AKATSUKI_RED, accent: "#c04030", feature: "puppet", cloakColor: AKATSUKI_RED },
  // 28. Utakata
  [nid("Utakata")]: { hair: "#2a2a4a", hairStyle: "ponytail", skin: SKIN_LIGHT, outfit: MIST_BLUE, outfit2: "#4a4a5a", accent: MIST_BLUE },
  // 29. Jugo
  [nid("Jugo")]: { hair: "#d08040", hairStyle: "spiky", skin: SKIN_MED, outfit: "#6a5a3a", outfit2: "#4a3a2a", accent: "#d08040" },
  // 30. Onoki
  [nid("Onoki")]: { hair: "#f5f5f5", hairStyle: "bald", skin: SKIN_MED, outfit: STONE_BROWN, outfit2: "#c04040", accent: STONE_BROWN },
  // 31. Asuma
  [nid("Asuma Sarutobi")]: { hair: "#1a1a2e", hairStyle: "short", skin: SKIN_MED, outfit: LEAF_VEST, outfit2: "#2a2a3a", accent: "#4a90d9" },
  // 32. Konan
  [nid("Konan")]: { hair: "#5a6abc", hairStyle: "short", skin: SKIN_PALE, outfit: AKATSUKI_BLACK, outfit2: AKATSUKI_RED, accent: "#f0d060", cloakColor: AKATSUKI_RED },
  // 33. Sai
  [nid("Sai")]: { hair: "#1a1a2e", hairStyle: "short", skin: SKIN_PALE, outfit: "#1a1a2e", outfit2: "#4a4a5a", accent: "#4a90d9" },
  // 34. Shizune
  [nid("Shizune")]: { hair: "#1a1a2e", hairStyle: "short", skin: SKIN_LIGHT, outfit: "#2a2a3a", outfit2: LEAF_GREEN, accent: "#4a90d9" },
  // 35. Shino
  [nid("Shino Aburame")]: { hair: "#3a2a1a", hairStyle: "spiky", skin: SKIN_LIGHT, outfit: "#4a4a4a", outfit2: LEAF_GREEN, accent: "#4a90d9", feature: "glasses" },
  // 36. Temari
  [nid("Temari")]: { hair: "#e0c860", hairStyle: "ponytail", skin: SKIN_LIGHT, outfit: SAND_TAN, outfit2: "#6a3a5a", accent: SAND_TAN, feature: "fan" },
  // 37. Karin
  [nid("Karin Uzumaki")]: { hair: "#c04040", hairStyle: "long", skin: SKIN_LIGHT, outfit: "#6a3a5a", outfit2: "#3a3a4a", accent: "#c04040", feature: "glasses" },
  // 38. Shikamaru
  [nid("Shikamaru Nara")]: { hair: "#1a1a2e", hairStyle: "ponytail", skin: SKIN_MED, outfit: LEAF_VEST, outfit2: "#2a2a3a", accent: "#4a90d9" },
  // 39. Ino
  [nid("Ino Yamanaka")]: { hair: "#e0c860", hairStyle: "ponytail", skin: SKIN_LIGHT, outfit: "#6a3aaa", outfit2: LEAF_GREEN, accent: "#4a90d9" },
  // 40. Kankuro
  [nid("Kankuro")]: { hair: "#3a2a1a", hairStyle: "short", skin: SKIN_MED, outfit: "#1a1a2e", outfit2: SAND_TAN, accent: SAND_TAN, feature: "paint" },
  // 41. Zetsu
  [nid("Zetsu")]: { hair: "#3a6a3a", hairStyle: "short", skin: SKIN_GREEN, outfit: AKATSUKI_BLACK, outfit2: "#3a6a3a", accent: "#f0d060", cloakColor: AKATSUKI_RED },
  // 42. Kurenai
  [nid("Kurenai Yuhi")]: { hair: "#1a1a2e", hairStyle: "wild", skin: SKIN_LIGHT, outfit: "#c04060", outfit2: "#e0e0e0", accent: "#4a90d9" },
  // 43. Baki
  [nid("Baki")]: { hair: "#3a2a1a", hairStyle: "short", skin: SKIN_MED, outfit: SAND_BROWN, outfit2: SAND_TAN, accent: SAND_TAN, feature: "bandages" },
  // 44. Kiba
  [nid("Kiba Inuzuka")]: { hair: "#3a2a1a", hairStyle: "wild", skin: SKIN_MED, outfit: "#5a5a5a", outfit2: LEAF_GREEN, accent: "#4a90d9", feature: "dog" },
  // 45. Deidara
  [nid("Deidara")]: { hair: "#e0c860", hairStyle: "ponytail", skin: SKIN_LIGHT, outfit: AKATSUKI_BLACK, outfit2: AKATSUKI_RED, accent: STONE_BROWN, cloakColor: AKATSUKI_RED },
  // 46. Lady Chiyo
  [nid("Lady Chiyo")]: { hair: "#c0b0a0", hairStyle: "buns", skin: SKIN_MED, outfit: SAND_TAN, outfit2: SAND_BROWN, accent: SAND_TAN, feature: "puppet" },
  // 47. Hidan
  [nid("Hidan")]: { hair: "#c0c8d4", hairStyle: "short", skin: SKIN_PALE, outfit: AKATSUKI_BLACK, outfit2: AKATSUKI_RED, accent: "#c0392b", feature: "scythe", cloakColor: AKATSUKI_RED },
  // 48. Tenten
  [nid("Tenten")]: { hair: "#5a3a2a", hairStyle: "buns", skin: SKIN_LIGHT, outfit: "#d07a8a", outfit2: LEAF_GREEN, accent: "#4a90d9" },
};
