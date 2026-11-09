import { BreathPhase } from '../game/rules';

/**
 * Synthesizes gentle Tibetan singing bowl harmonics using Web Audio API
 * and triggers rhythmic haptic feedback pulses via `navigator.vibrate`.
 */
class SoundAndHapticsEngine {
  private ctx: AudioContext | null = null;
  public isMuted: boolean = false;
  public hapticsEnabled: boolean = true;

  private ensureContext(): AudioContext | null {
    if (
      this.isMuted ||
      typeof window === 'undefined' ||
      window.navigator?.webdriver
    ) {
      return null;
    }
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /**
   * Triggers a rhythmic haptic pulse on mobile devices (`navigator.vibrate`)
   * and invokes an optional visual pulse callback for desktop/iOS parity.
   */
  public triggerHapticPulse(pattern: number[], onVisualPulse?: () => void): void {
    if (!this.hapticsEnabled) return;
    if (onVisualPulse) onVisualPulse();
    try {
      if (
        typeof navigator !== 'undefined' &&
        typeof navigator.vibrate === 'function' &&
        pattern.length > 0
      ) {
        navigator.vibrate(pattern);
      }
    } catch {
      // Ignore if vibration permission is blocked by browser
    }
  }

  /**
   * Plays a soft harmonic singing bowl tone when breath phase shifts.
   */
  public playBreathPhaseChime(phase: BreathPhase, baseFreqHz: number = 432): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    const multiplier =
      phase === 'inhale'
        ? 1.0
        : phase === 'holdIn'
        ? 1.25 // Major third harmonic
        : phase === 'exhale'
        ? 0.75 // Perfect fourth lower
        : 0.5;

    const freq = baseFreqHz * multiplier;
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, now);

    // Subtle binaural beat overtone (+4Hz theta relaxation wave)
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 1.5 + 4, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.065, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 1.45);
    osc2.stop(now + 1.45);
  }

  /**
   * Light pitch-varied chime when completing a breath-synced mandala stroke.
   */
  public playStrokeResonanceChime(harmonyAccuracy: number, stageId: number): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    const pentatonicRatios = [1, 1.125, 1.25, 1.5, 1.667, 2.0];
    const ratio =
      pentatonicRatios[(stageId + Math.floor(harmonyAccuracy / 15)) % pentatonicRatios.length];
    const pitchJitter = 1 + (Math.random() - 0.5) * 0.04;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(432 * ratio * pitchJitter, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.045, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.6);
  }

  /**
   * Plays a rich multi-harmonic chord when a Mandala stage is awakened or dissolved.
   */
  public playAwakeningChord(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const freqs = [432, 540, 648, 864];
    freqs.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + idx * 0.06);

      gain.gain.setValueAtTime(0.0001, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.04, now + idx * 0.06 + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.06);
      osc.stop(now + 2.25);
    });
  }
}

export const soundAndHaptics = new SoundAndHapticsEngine();
