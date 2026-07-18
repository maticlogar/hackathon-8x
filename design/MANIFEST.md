# Design Manifest

This file tells Claude where each design/image goes in the app. Drop your files
in the folders described below, then add a row to the matching table. The more
specific the "Target" and "Notes", the more accurately I can implement it.

Screens that exist in the app (use these exact names as targets):
`LanguagesScreen` · `LevelsScreen` · `LessonScreen` · `SurvivalScreen`
`ShopScreen` · `CrateScreen` · `CollectionScreen`
Components: `BottomTabBar` · `CoinBar` · `Mascot` · `SettingsModal` · `TactileButton`

---

## 1. Stitch mockups (reference only — NOT shipped)

Put screenshots/exports in `design/screens/` (full screens) or
`design/components/` (single UI pieces). Name each file after its target,
e.g. `LessonScreen.png`, `LessonScreen--correct-state.png`, `CoinBar.png`.

| File | Target screen/component | What's new / what to change | Priority |
|------|-------------------------|-----------------------------|----------|
| _e.g. LessonScreen--v2.png_ | LessonScreen | New answer-button layout + progress bar on top | high |
|  |  |  |  |

## 2. Higgsfield images (SHIPPED — the app renders these)

Put the actual image files in `assets/mascots/` (or `assets/images/` for
non-mascot art). Use kebab-case names. List them here so I know where each is used.

| File (in assets/) | Used where | Notes (size, transparent bg?, animated?) |
|-------------------|-----------|------------------------------------------|
| _e.g. assets/mascots/owl-wave.png_ | LessonScreen intro | transparent bg, ~512px |
|  |  |  |

## Applied Stitch mockups (log)

| Stitch mockup | Mapped to | Notes |
|---------------|-----------|-------|
| "Pick Your Poison" language picker | `LanguagesScreen` | select-then-confirm flow with "LET'S SWEAR" CTA; chilli heat + tagline added to `content/languages.js`; back-arrow slot reused for the settings gear (root screen has no back); progress bar shows levels unlocked across all languages |
| "Swear like a Local" journey map | `LevelsScreen` | v2 applied: dotted paper bg (`assets/patterns/dot-grid.png` tile), sticky bordered app bar, section card with 8px red shadow slab, dotted node-to-node connectors, yellow/orange completed nodes, 4px node borders, scroll-to-current FAB |
| "Scenario Challenge" mic/ring | `LessonScreen` word+record phase | scenario/hint-chips dropped (no fit); kept red word card + tactile mic + recording pulse bars |
| Score result "87/100" chili slap | `LessonScreen` result phase | pass→`lvl-completion-mascot`, fail→`app-mascot`; roast in speech bubble; "hear your attempt" replays recording |
| "LOCAL TIER COMPLETE" | `LessonScreen` levelComplete phase | stat tiles ⚡`currency`/🏆`trophy`/🔥`streak-fire-mascot`, progress bar, hero `lvl-completion-mascot` |

Stitch `brand-*` colors were NOT imported — mapped to existing `lib/theme.js` tokens
(brand-chili→primaryContainer, charcoal→border, cream→card, orange→secondaryContainer).

## 3. Anything unclear / not-yet-sorted

Dump it in `design/_incoming/` and describe it here — I'll sort it.

| File | What it is | Where you think it goes |
|------|-----------|-------------------------|
|  |  |  |
