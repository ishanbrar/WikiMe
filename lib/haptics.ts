/** Light tap feedback (Android vibrate; no-op on most iOS Safari). */
export function hapticTap(): void {
  if (typeof navigator === "undefined" || !("vibrate" in navigator)) return;
  try {
    navigator.vibrate(12);
  } catch {
    /* ignore */
  }
}

export function hapticSuccess(): void {
  if (typeof navigator === "undefined" || !("vibrate" in navigator)) return;
  try {
    navigator.vibrate([10, 40, 10]);
  } catch {
    /* ignore */
  }
}

export function hapticError(): void {
  if (typeof navigator === "undefined" || !("vibrate" in navigator)) return;
  try {
    navigator.vibrate([20, 60, 20]);
  } catch {
    /* ignore */
  }
}
