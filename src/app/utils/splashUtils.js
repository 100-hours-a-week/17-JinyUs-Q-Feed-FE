const SPLASH_SHOWN_KEY = 'qfeed_splash_shown';

export function markSplashShown() {
    try {
        sessionStorage.setItem(SPLASH_SHOWN_KEY, '1');
    } catch {
        // ignore
    }
}

export function clearSplashShown() {
    try {
        sessionStorage.removeItem(SPLASH_SHOWN_KEY);
    } catch {
        // ignore
    }
}
