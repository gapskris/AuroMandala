# PranaMandala: Sacred Geometry & Mindful Breath Sanctuary

An interactive mandala art and sacred geometry learning game that synchronizes rhythmic breathing (`Pranayama`), haptic vibration pulses, and chakric color patterns for mindful human transformation.

## Core Transformative Game Mechanics

1. **Prana-Synced Brush Dynamics**: Drawing strokes modulate their luminance and filament width in real time with the user's breathing cycle (`Sama Vritti 4-4-4-4`, `Prana Shanti 4-7-8`, `Hridayam Coherence 5-0-5-0`).
2. **Chakric Color Pattern Awakening**: Maintaining high breath-stroke harmony unlocks progressive color states (*Saffron Bindu*, *Emerald Lotus*, *Pranic Ether*, *Solar Tapas*, *Sahasrara Violet*) and Tibetan singing bowl overtones (432Hz to 852Hz).
3. **Sacred Geometry Curriculum**: 5 progressive stages advancing from 6-fold *Bindu & Vesica Piscis*, 8-fold *Seed of Life*, 12-fold *Anahata Lotus*, 16-fold *Flower of Life*, to 24-fold *Sri Yantra & Metatron Star*.
4. **Haptic Pranayama Cadence**: Tactile pulse rhythms (`navigator.vibrate` + visual/audio cues) guide inhalation, retention, and exhalation so users can soften their gaze.
5. **Tibetan Sand Mandala Dissolution**: Teaches non-attachment (*Anicca*) by dissolving completed mandalas into a zero-GC particle ring buffer of ascending light motes.
6. **Zero-Knowledge E2EE Sankalpa Vault**: Protects personal intentions, streaks, and mindfulness logs locally using Web Crypto API `AES-GCM` (256-bit) with `PBKDF2-SHA256` key derivation.

## Developer Onboarding & Architecture

- `src/game/rules.ts` & `src/game/rules.test.ts`: Pure mathematical sacred geometry symmetry, breath phase engine, resonance scoring, and streak calculation.
- `src/components/MandalaCanvas.tsx`: Decoupled 60 FPS Canvas2D renderer with zero-GC `Float32Array` pooled particle buffer and low-power device mode.
- `src/utils/crypto.ts` & `src/utils/crypto.test.ts`: Web Crypto API AES-GCM 256-bit end-to-end encryption.
- `src/i18n/translations.ts`: Multilingual localization (`English`, `Español`, `हिन्दी`, `日本語`, `Français`).

## Verification & CI/CD Commands

```bash
# Run deterministic unit tests
npx --yes tsx --test src/game/rules.test.ts src/utils/crypto.test.ts

# Typecheck and build production PWA bundle
npm run lint
npm run build
```
