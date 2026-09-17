// Web Audio API Synthesized Audio Engine for PustakaScan
// Compliant with PRD §9.2 (Feedback Audio):
// - Item Scan Success: Beep tinggi 80ms (920Hz)
// - Member Scan Success: Dua beep pendek 2x60ms (587Hz -> 880Hz)
// - Scan Error: Beep rendah panjang 500ms (220Hz saw/square wave)
// - Transaction Success: Akor nada naik 3 tingkat 400ms (523Hz -> 659Hz -> 784Hz)

let audioCtx: AudioContext | null = null;
let soundEnabled = true;

// Initialize or resume AudioContext safely on user interaction
function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  } catch (err) {
    console.warn('Web Audio API not supported or blocked:', err);
    return null;
  }
}

export function isAudioMuted(): boolean {
  if (typeof window === 'undefined') return false;
  const saved = localStorage.getItem('pustakascan_sound_muted');
  return saved === 'true';
}

export function setAudioMuted(muted: boolean): void {
  soundEnabled = !muted;
  if (typeof window !== 'undefined') {
    localStorage.setItem('pustakascan_sound_muted', muted ? 'true' : 'false');
  }
}

export function toggleAudioMute(): boolean {
  const current = isAudioMuted();
  setAudioMuted(!current);
  return !current;
}

/**
 * Item Scan Success (Beep tinggi 80 ms, 920 Hz)
 */
export function playItemScanBeep(): void {
  if (isAudioMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(920, now);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  } catch (e) {
    console.warn('Audio play error:', e);
  }
}

/**
 * Member Scan Success (Dua beep pendek 2x 60 ms: 587 Hz -> 880 Hz)
 */
export function playMemberScanBeep(): void {
  if (isAudioMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // Beep 1 (587 Hz, D5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.22, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.06);

    // Beep 2 (880 Hz, A5) after 75ms
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.075);
    gain2.gain.setValueAtTime(0.25, now + 0.075);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.135);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.075);
    osc2.stop(now + 0.135);
  } catch (e) {
    console.warn('Audio play error:', e);
  }
}

/**
 * Scan Error (Beep rendah panjang 500 ms, 220 Hz sawtooth/square)
 */
export function playScanErrorSound(): void {
  if (isAudioMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.setValueAtTime(180, now + 0.25); // turun sedikit untuk kesan error

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.5);
  } catch (e) {
    console.warn('Audio play error:', e);
  }
}

/**
 * Transaction Complete Success (Akor nada naik 3 tingkat 400 ms: C5 -> E5 -> G5)
 */
export function playTransactionSuccessSound(): void {
  if (isAudioMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    const durations = [0.1, 0.1, 0.2];
    const delays = [0, 0.1, 0.2];

    notes.forEach((freq, i) => {
      const startTime = now + delays[i];
      const dur = durations[i];
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.24, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + dur);
    });
  } catch (e) {
    console.warn('Audio play error:', e);
  }
}
