/**
 * GTM + Meta Pixel — carregados após consentimento de cookies (enableTags).
 * IDs via import.meta.env (Vite).
 */

let gtmLoaded = false;
let fbLoaded = false;

export function getGtmId() {
  return (import.meta.env.VITE_GTM_ID || 'GTM-KBXVJPV3').trim();
}

export function getFbPixelId() {
  const raw = (import.meta.env.VITE_FB_PIXEL_ID || '1335750178391263').trim();
  return raw || '1335750178391263';
}

/**
 * Snippet oficial GTM (head) — executado uma vez.
 */
export function injectGoogleTagManager(containerId) {
  if (typeof window === 'undefined' || !containerId || gtmLoaded) return;
  gtmLoaded = true;
  const w = window;
  w.dataLayer = w.dataLayer || [];
  // eslint-disable-next-line no-unused-expressions
  w.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
  const f = document.getElementsByTagName('script')[0];
  const j = document.createElement('script');
  j.async = true;
  j.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(containerId)}`;
  f.parentNode.insertBefore(j, f);
}

/**
 * Meta Pixel — snippet oficial (uma vez).
 */
export function injectFacebookPixel(pixelId) {
  if (typeof window === 'undefined' || !pixelId || fbLoaded) return;
  if (window.fbq) {
    fbLoaded = true;
    return;
  }
  fbLoaded = true;
  // eslint-disable-next-line func-names, prefer-rest-params
  (function (f, b, e, v, n, t, s) {
    if (f.fbq) return;
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = !0;
    n.version = '2.0';
    n.queue = [];
    t = b.createElement(e);
    t.async = !0;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
  window.fbq('init', pixelId);
  // PageView: apenas via analytics.trackPageView (SPA + consentimento)
}

export function fbTrack(eventName, params = {}) {
  if (typeof window === 'undefined' || !window.fbq) return;
  try {
    window.fbq('track', eventName, params);
  } catch {
    /* ignore */
  }
}
