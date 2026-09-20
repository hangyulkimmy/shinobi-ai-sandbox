# Shinobi AI Sandbox

**[Play it](https://hangyulkimmy.github.io/shinobi-ai-sandbox/)**

A turn-based Naruto battle simulator. Pick teams from 48 ninjas, then watch (or play) a fight where every AI opponent has its own fighting style.

<!-- screenshot: docs/battle.png -->

## What's in it

- **Battle Sim**, team builder → battle screen. Turn order, ATK/DEF/CTR stats, damage formula, status effects, clone mechanics, passives.
- **Shinobi Codex**, a browsable roster of every character and their moves.
- **AI with personalities**, each ninja's AI scores its available moves (damage, kill-secure, healing, buffs, targeting) and weights those categories differently by style, e.g. aggressive vs. supportive. Same roster, different fights.
- **Move parser**, move effects are written as text in the data file and parsed into typed effects at runtime, so adding a character is a data change, not a code change.

## Structure

```
index.html / codex.html      landing + codex (static, Tailwind)
naruto-battle-sim/           React app
  src/engine/                battle loop, AI, status effects, clones, stat system, move parser
  src/data/defaults.ts       all 48 ninjas + moves (source of truth)
  src/screens/               NinjaList → BattleSetup → Battle
  src/components/            cards, sprites, bars, status chips
```

## Run locally

```bash
cd naruto-battle-sim
npm install
npm run dev
```

## Stack

React 19 · TypeScript · Vite · Tailwind CSS · deployed on GitHub Pages
