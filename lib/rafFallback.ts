/**
 * Some embedded/background rendering contexts never deliver
 * requestAnimationFrame, which would freeze the loader, GSAP and the R3F
 * frame loop forever. Each scheduled frame races the native rAF against a
 * 50ms timeout; the first to fire wins, the loser is cancelled. As soon as
 * one native rAF is observed the shim steps aside entirely, so visible
 * foreground tabs run on the untouched native path.
 *
 * This module must be imported BEFORE gsap / three / framer-motion so they
 * pick up the patched function.
 */
if (typeof window !== "undefined") {
  const nativeRaf = window.requestAnimationFrame.bind(window);
  const nativeCancel = window.cancelAnimationFrame.bind(window);
  let healthy = false;
  nativeRaf(() => {
    healthy = true;
  });

  const timers = new Map<number, ReturnType<typeof setTimeout>>();

  window.requestAnimationFrame = ((cb: FrameRequestCallback): number => {
    if (healthy) return nativeRaf(cb);
    const id = nativeRaf((t) => {
      healthy = true;
      const timer = timers.get(id);
      if (timer === undefined) return; // the timeout already ran cb
      clearTimeout(timer);
      timers.delete(id);
      cb(t);
    });
    timers.set(
      id,
      setTimeout(() => {
        if (!timers.has(id)) return;
        timers.delete(id);
        cb(performance.now());
      }, 50),
    );
    return id;
  }) as typeof window.requestAnimationFrame;

  window.cancelAnimationFrame = ((id: number) => {
    const timer = timers.get(id);
    if (timer !== undefined) {
      clearTimeout(timer);
      timers.delete(id);
    }
    nativeCancel(id);
  }) as typeof window.cancelAnimationFrame;
}

export {};
