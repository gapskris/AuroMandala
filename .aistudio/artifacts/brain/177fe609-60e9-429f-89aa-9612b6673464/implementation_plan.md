# Implementation Plan: 5 Thematic Folk Mandala Stages & Drawing Mechanics

A comprehensive architectural blueprint to incorporate the design cues, folk jewel color palette, and botanical motifs from the reference mandala artwork into **PranaMandala**. Users will be able to draw, weave, and master **5 distinct progressive thematic stages** corresponding to the concentric patterns of the reference artwork using freehand touch/pointer drawing with snapped radial symmetry and one-touch harmonic ring weaving.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> Based on your answers during Phase 1:
> - **Pattern Architecture**: Confirmed **5 separate thematic stages** (Option 2), allowing users to focus on and master each concentric pattern tier individually before advancing.
> - **Drawing Interaction**: Confirmed **Interactive "Weave Sacred Ring" button + Freehand drawing with snapped symmetry** (Option 1). Users can effortlessly generate geometrically perfect folk motifs or draw custom flourishes with pointer/touch that automatically reflect across the stage's 8-fold symmetry axes in real time.

---

## 1. Overview & Core Concept

### What It Delivers
The reference artwork showcases a classic **8-fold (Octagram) Folk-Art Mandala** with distinct concentric motifs and a traditional jewel-toned terracotta/turquoise/marigold palette on velvet obsidian. This update introduces:

1. **5 Thematic Folk Stages**:
   - **Theme 1: Central Rosette (*Padma Bindu*)** — 8-fold lotus blossom core encircled by a double boundary ring ($r \approx 0.18$).
   - **Theme 2: Royal Tulip Arches (*Kalashesha*)** — Stylized tulip bells and goblet arches alternating with golden droplets ($r \approx 0.38$).
   - **Theme 3: Paisley Whispers & Seed Pods (*Kalka & Bija*)** — Flowing paisley swirls and striped pomegranate teardrops ($r \approx 0.58$).
   - **Theme 4: Marigold Daisy Crown (*Suryamukhi*)** — Radiant 8-fold daisy corollas with decorative finial buds ($r \approx 0.78$).
   - **Theme 5: Royal Folk Masterpiece (*Maha Rajasthani*)** — The complete integrated 5-layer grand composition uniting all concentric tiers ($r \approx 0.92$).

2. **Folk Terracotta Jewel Color Palette**:
   - Primary: Paprika Terracotta (`#D35933`), Marigold Saffron (`#F4B341`), Seafoam Turquoise (`#45A59E`), Peacock Cerulean (`#226888`), Midnight Indigo (`#13384D`), and Warm Cream Ivory (`#FDF2D6`).

3. **2 New Dedicated Folk Brushes**:
   - **`folk-petal` (Teardrop Petal Stamp)**: Dynamic stroke that expands into a full teardrop bulb and tapers to a fine tip based on stroke speed and breath cadence.
   - **`paisley-swirl` (Calligraphic Paisley Rib)**: Angular tapering ribbon designed for flourishing leaves, stems, and goblet urns.

4. **Authentic Theme Weaving**:
   - Clicking `"Weave Sacred Ring"` while in any of the 5 folk stages computes and renders the exact mathematical curves for that specific theme (rosette petals, tulip arches, paisleys, daisy corollas, or full masterwork).

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Theme Selection**:
   - In the **3D Studio** side pod (or mobile popover), the Stage selector displays the 5 new Folk Mandala stages alongside existing sacred geometry stages with distinct badges.
   - Selecting a Folk stage automatically defaults to the **"Rajasthani Folk Jewel"** palette, 8-fold symmetry, and appropriate guide rings.

2. **Drawing & Weaving**:
   - **Freehand Drawing**: When the user drags their finger or stylus, their stroke is projected across 8 radial petals with real-time 3D elevation, depth shadow, and specular ridge lighting.
   - **One-Touch "Weave Sacred Ring"**: Tapping `"Weave"` generates the next harmonic layer specific to that theme (e.g., clicking Weave in Theme 2 produces tulip goblet arches with golden droplets).
   - **Pranayama Breath Alignment**: Inhaling prompts expansive outer petals; exhaling prompts inner core seed dots, granting score multipliers and combo streaks.

3. **Stage Completion & Blessings**:
   - Hitting the target stroke threshold triggers the stage blessing dialog showing the unlocked folkloric motif, spiritual contemplation insight, and mastery rating.

### Visual Identity & Theme Tokens

```
Canvas Backdrop:        Velvet Obsidian       #070A12 (Dark) / Crisp Alabaster #F8F5EE (Light)
Primary Folk Warm:      Paprika Terracotta    #D35933
Secondary Solar Warm:   Marigold Saffron      #F4B341
Primary Cool Accent:    Seafoam Turquoise     #45A59E
Deep Foundation:        Peacock Cerulean      #226888
Shadow Layer:           Midnight Indigo       #13384D
Highlight Dot Accent:   Warm Cream Ivory      #FDF2D6
Symmetry Fold:          8-Fold Radial Symmetry (Cardinal + Diagonal axes)
```

---

## 3. Technical Architecture & System Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             src/App.tsx                                     │
│  - Stage & Palette State (5 Folk Themes + Rajasthani Folk Jewel Palette)    │
│  - Active Brush Style ('folk-petal', 'paisley-swirl', etc.)                 │
│  - Responsive 3D Studio Pod & Compact Bottom Action Dock                    │
└───────────────────┬─────────────────────────────────────┬───────────────────┘
                    │                                     │
                    ▼                                     ▼
┌──────────────────────────────────────┐  ┌───────────────────────────────────┐
│           src/game/rules.ts          │  │  src/components/MandalaCanvas.tsx │
│  - 5 Folk Stages Definitions         │  │  - Theme-specific Weave Curves    │
│  - FOLK_JEWEL Palette Spec           │  │  - 'folk-petal' & 'paisley-swirl' │
│  - 'folk-petal' & 'paisley-swirl'    │  │    Shader Path Generators         │
│  - 8-Fold Octagonal Radial Symmetry  │  │  - 3D Multi-Layer Perspective     │
│  - Score & Combo Metric Evaluator    │  │  - High-precision Pointer Capture │
└───────────────────┬──────────────────┘  └───────────────────┬───────────────┘
                    │                                         │
                    ▼                                         ▼
┌──────────────────────────────────────┐  ┌───────────────────────────────────┐
│     src/i18n/translations.ts         │  │       src/utils/storage.ts        │
│  - 5 Folk Stage names & teachings    │  │  - Cache persistence for folk    │
│    across en, es, hi, ja, fr         │  │    stages, custom strokes, and    │
│  - Brush & palette localization      │  │    mastery scores                 │
└──────────────────────────────────────┘  └───────────────────────────────────┘
```

---

## 4. Planned Changes & Step-by-Step Execution

### Step 1: Stage & Palette Domain Expansion (`src/game/rules.ts`)
- Add **`FOLK_TERRACOTTA_JEWEL`** to `COLOR_PALETTES` with the 6 authentic folk colors.
- Add **2 new brush specs**:
  - `folk-petal`: 3D teardrop petal stamp with velocity-sensitive contouring.
  - `paisley-swirl`: Angular calligraphic tapering brush.
- Register the **5 progressive Folk Stages** in `SACRED_STAGES`:
  1. `Stage 11`: *Central Rosette (Padma Bindu)* — 8-fold, 3 guide rings (`0.12`, `0.18`, `0.24`).
  2. `Stage 12`: *Royal Tulip Arches (Kalashesha)* — 8-fold, 3 guide rings (`0.28`, `0.38`, `0.46`).
  3. `Stage 13`: *Paisley Whispers (Kalka & Bija)* — 8-fold, 4 guide rings (`0.48`, `0.58`, `0.66`, `0.72`).
  4. `Stage 14`: *Daisy Crown (Suryamukhi)* — 8-fold, 3 guide rings (`0.74`, `0.82`, `0.88`).
  5. `Stage 15`: *Folk Masterpiece (Maha Rajasthani)* — 8-fold, 6 guide rings encompassing all tiers.
- Update unit tests in `src/game/rules.test.ts` to assert validity and unlock thresholds of the 5 new stages.

### Step 2: Canvas Shaders & Motif Weaving (`src/components/MandalaCanvas.tsx`)
- Enhance `seedMultiLayer3DMandala` and `weaveHarmoniousRing` to generate theme-specific curves:
  - For Rosette: Concentric 8-lobed flower arcs with inner dot ring.
  - For Tulip Arches: Goblet bell arches with alternating finials.
  - For Paisley Whispers: Bezier teardrop curls with inner seed stripes.
  - For Daisy Crown: Multi-point daisy corollas with perimeter bud caps.
  - For Masterpiece: Full harmonic multi-layer synthesis.
- Implement specialized rendering for `folk-petal` and `paisley-swirl` in the Canvas2D drawing loop.

### Step 3: Localization (`src/i18n/translations.ts`)
- Add translation keys for all 5 stages, teachings, and new brushes across all 5 supported languages (`en`, `es`, `hi`, `ja`, `fr`).

### Step 4: Verification & Browser Testing
- Run test suites: `rules.test.ts`, `crypto.test.ts`, `storage.test.ts`.
- Run `compile_applet` and `lint_applet`.
- Perform browser verification with `playwright-cli` ensuring clean rendering, stage switching, and interactive drawing.
