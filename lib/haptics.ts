let audioCtx: AudioContext | null = null;

/** Very short tick via Web Audio (works after a user gesture on iOS Safari). */
function iosAudioTick(): void {
  if (typeof window === "undefined") return;
  try {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) return;
    audioCtx ??= new Ctx();
    if (audioCtx.state === "suspended") void audioCtx.resume();

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.value = 220;
    gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.04, audioCtx.currentTime + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.04);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.045);
  } catch {
    /* ignore */
  }
}

function vibrate(pattern: number | number[]): void {
  if (typeof navigator === "undefined" || !("vibrate" in navigator)) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    /* ignore */
  }
}

/** Light tap feedback (Android vibrate; subtle audio tick on iOS). */
export function hapticTap(): void {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    vibrate(12);
    return;
  }
  iosAudioTick();
}

export function hapticSuccess(): void {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    vibrate([10, 40, 10]);
    return;
  }
  iosAudioTick();
}

export function hapticError(): void {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    vibrate([20, 60, 20]);
    return;
  }
  iosAudioTick();
}

/** Stronger feedback when starting article generation. */
export function hapticGenerate(): void {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    vibrate([12, 35, 18]);
    return;
  }
  iosAudioTick();
}
