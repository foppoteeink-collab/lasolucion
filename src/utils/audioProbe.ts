// Shared non-blocking AudioService availability probe to prevent synchronous
// main-thread IPC stalls (~20s freeze) when constructing a cold AudioContext.

const PROBE_TIMEOUT_MS = 300;
const SYNC_CREATE_HANG_MS = 1500;

let audioIpcDisabled = false;
let probeSettled = false;
let probePromise: Promise<boolean> | null = null;

export function isAudioIpcDisabled(): boolean {
  return audioIpcDisabled;
}

export function markAudioIpcDisabled(): void {
  audioIpcDisabled = true;
  probeSettled = true;
  probePromise = null;
}

export function probeAudioServiceAvailability(): Promise<boolean> {
  if (audioIpcDisabled) return Promise.resolve(false);
  if (probeSettled) return Promise.resolve(true);
  if (typeof window === 'undefined') return Promise.resolve(false);

  if (probePromise) return probePromise;

  const mediaDevices =
    typeof navigator !== 'undefined' ? navigator.mediaDevices : undefined;

  if (!mediaDevices || typeof mediaDevices.enumerateDevices !== 'function') {
    probeSettled = true;
    return Promise.resolve(true);
  }

  probePromise = new Promise<boolean>((resolve) => {
    let finished = false;
    const finish = (ok: boolean) => {
      if (finished) return;
      finished = true;
      probePromise = null;
      if (!ok) {
        audioIpcDisabled = true;
      }
      probeSettled = true;
      resolve(ok);
    };

    const timer = window.setTimeout(() => {
      finish(false);
    }, PROBE_TIMEOUT_MS);

    try {
      Promise.resolve(mediaDevices.enumerateDevices())
        .then(() => {
          window.clearTimeout(timer);
          finish(true);
        })
        .catch(() => {
          window.clearTimeout(timer);
          finish(true);
        });
    } catch {
      window.clearTimeout(timer);
      finish(true);
    }
  });

  return probePromise;
}

export function createGuardedAudioContext(
  AudioCtx: typeof AudioContext
): AudioContext | null {
  if (audioIpcDisabled) return null;
  const now = () =>
    typeof performance !== 'undefined' && typeof performance.now === 'function'
      ? performance.now()
      : Date.now();
  const start = now();
  try {
    const ctx = new AudioCtx();
    const elapsed = now() - start;
    if (elapsed > SYNC_CREATE_HANG_MS) {
      audioIpcDisabled = true;
      try {
        ctx.close?.().catch(() => {});
      } catch {}
      return null;
    }
    return ctx;
  } catch {
    audioIpcDisabled = true;
    return null;
  }
}
