// A tiny buzz on phones that support it (Android). iPhones do not let web apps vibrate, so this is silent there.
export function haptic(kind = 'tap') {
  try {
    const pattern = kind === 'success' ? [12, 40, 18] : kind === 'remove' ? 22 : kind === 'error' ? [30, 40, 30] : 10;
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') navigator.vibrate(pattern);
  } catch { /* ignore */ }
}
