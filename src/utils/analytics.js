/**
 * Analytics — dataLayer (GTM) + Meta Pixel opcional.
 * Só envia após consentimento (enableAnalytics).
 * Variáveis úteis no GTM: eventos custom + user_* / marketing_*.
 */

import {
  injectGoogleTagManager,
  getGtmId,
  injectFacebookPixel,
  getFbPixelId,
  fbTrack,
} from './tagManager';

let analyticsEnabled = false;
let currentUser = null;
let autoTrackingBound = false;
let removeAutoTrackingHandlers = null;

function ensureDataLayer() {
  if (typeof window === 'undefined') return null;
  window.dataLayer = window.dataLayer || [];
  return window.dataLayer;
}

function pushDataLayer(obj) {
  const dl = ensureDataLayer();
  if (dl) dl.push(obj);
}

function withUser(params = {}) {
  if (!currentUser) return params;
  const {
    steamId,
    displayName,
    isVip,
    level,
    marketingEmail,
    marketingFullName,
    marketingPhone,
  } = currentUser;
  return {
    ...params,
    user_steam_id: steamId || null,
    user_name: displayName || null,
    user_is_vip: typeof isVip === 'boolean' ? isVip : null,
    user_level: typeof level === 'number' || typeof level === 'string' ? Number(level) || null : null,
    marketing_email: marketingEmail || null,
    marketing_full_name: marketingFullName || null,
    marketing_phone: marketingPhone || null,
  };
}

/**
 * @param {object | null} user — campos extras: marketingEmail, marketingFullName, marketingPhone
 */
export function setAnalyticsUser(user) {
  if (!user) {
    currentUser = null;
    pushDataLayer({ event: 'snaptap_user_clear' });
    return;
  }
  currentUser = {
    steamId: user.steamId,
    displayName: user.displayName,
    isVip: user.isVip,
    level: user.level,
    marketingEmail: user.marketingEmail || null,
    marketingFullName: user.marketingFullName || null,
    marketingPhone: user.marketingPhone || null,
  };
  if (analyticsEnabled) {
    pushDataLayer({
      event: 'snaptap_user_context',
      ...withUser({}),
    });
  }
}

export function enableAnalytics() {
  if (analyticsEnabled) return;
  analyticsEnabled = true;
  ensureDataLayer();
  injectGoogleTagManager(getGtmId());
  const fbId = getFbPixelId();
  if (fbId) injectFacebookPixel(fbId);
  if (currentUser) {
    pushDataLayer({
      event: 'snaptap_user_context',
      ...withUser({}),
    });
  }
  bindAutoInteractionTracking();
  trackPageView();
}

export function disableAnalytics() {
  analyticsEnabled = false;
  if (removeAutoTrackingHandlers) {
    removeAutoTrackingHandlers();
    removeAutoTrackingHandlers = null;
    autoTrackingBound = false;
  }
}

export function trackPageView(path, title) {
  if (!analyticsEnabled) return;
  const pagePath =
    path
    || (typeof window !== 'undefined'
      ? window.location.pathname + window.location.search
      : undefined);
  const pageTitle = title || (typeof document !== 'undefined' ? document.title : undefined);
  pushDataLayer(
    withUser({
      event: 'page_view',
      page_path: pagePath,
      page_title: pageTitle,
    })
  );
  try {
    fbTrack('PageView');
  } catch {
    /* ignore */
  }
  if (typeof window !== 'undefined' && window.gtag) {
    try {
      window.gtag('event', 'page_view', {
        page_path: pagePath,
        page_title: pageTitle,
      });
    } catch {
      /* ignore */
    }
  }
}

export function trackEvent(eventName, params = {}) {
  if (!analyticsEnabled) return;
  pushDataLayer({
    event: eventName,
    ...withUser(params),
  });
}

function getElementLabel(el) {
  if (!el) return '';
  const explicit =
    el.getAttribute?.('data-analytics-label')
    || el.getAttribute?.('aria-label')
    || el.getAttribute?.('title')
    || '';
  if (explicit) return String(explicit).trim().slice(0, 120);
  const txt = (el.textContent || '').replace(/\s+/g, ' ').trim();
  return txt.slice(0, 120);
}

function collectElementMeta(target) {
  const clickable = target?.closest?.('a,button,[role="button"],[data-analytics-event]');
  if (!clickable) return null;
  const tag = (clickable.tagName || '').toLowerCase();
  const hrefRaw = clickable.getAttribute?.('href') || '';
  const href = hrefRaw.startsWith('javascript:') ? '' : hrefRaw;
  const id = clickable.id || '';
  const classes = typeof clickable.className === 'string'
    ? clickable.className.split(/\s+/).filter(Boolean).slice(0, 5).join(' ')
    : '';
  const label = getElementLabel(clickable);
  const analyticsEvent = clickable.getAttribute?.('data-analytics-event') || '';
  return { clickable, tag, href, id, classes, label, analyticsEvent };
}

function bindAutoInteractionTracking() {
  if (typeof window === 'undefined' || autoTrackingBound) return;
  autoTrackingBound = true;

  const onClick = (ev) => {
    if (!analyticsEnabled) return;
    const meta = collectElementMeta(ev.target);
    if (!meta) return;

    const {
      tag, href, id, classes, label, analyticsEvent,
    } = meta;

    const eventName = analyticsEvent || 'ui_click';
    trackEvent(eventName, {
      page_path: window.location.pathname + window.location.search,
      element_tag: tag || null,
      element_id: id || null,
      element_classes: classes || null,
      element_label: label || null,
      destination: href || null,
    });
  };

  const onSubmit = (ev) => {
    if (!analyticsEnabled) return;
    const form = ev.target;
    if (!form || form.tagName !== 'FORM') return;
    const id = form.id || '';
    const classes = typeof form.className === 'string'
      ? form.className.split(/\s+/).filter(Boolean).slice(0, 5).join(' ')
      : '';
    const action = form.getAttribute?.('action') || '';
    trackEvent('form_submit', {
      page_path: window.location.pathname + window.location.search,
      form_id: id || null,
      form_classes: classes || null,
      form_action: action || null,
    });
  };

  document.addEventListener('click', onClick, true);
  document.addEventListener('submit', onSubmit, true);

  removeAutoTrackingHandlers = () => {
    document.removeEventListener('click', onClick, true);
    document.removeEventListener('submit', onSubmit, true);
  };
}

/** Funil VIP — use no GTM: Custom Event = vip_page_view, vip_click_assinar, etc. */
export function trackVipPageView() {
  trackEvent('vip_page_view', { page: 'vip' });
}

export function trackVipClickAssinar() {
  trackEvent('vip_click_assinar', { cta: 'hero', funnel_step: 'checkout_intent' });
  try {
    fbTrack('InitiateCheckout', { content_name: 'VIP Assinatura', content_category: 'vip' });
  } catch {
    /* ignore */
  }
}

export function trackVipClickBeneficios() {
  trackEvent('vip_click_beneficios', { link: 'menu' });
}

export function trackVipClickPerformance() {
  trackEvent('vip_click_performance', { link: 'menu' });
}

export function trackVipClickCriarWarmup() {
  trackEvent('vip_click_criar_warmup', { link: 'menu' });
}

export function trackVipClickGiveaway() {
  trackEvent('vip_click_giveaway', { link: 'menu' });
}

export function trackNavClick(destination, label) {
  trackEvent('nav_click', { destination, link_text: label });
}

export function trackLoginClick(fromPage) {
  trackEvent('login_click', { from_page: fromPage });
}

export function trackProfileView() {
  trackEvent('profile_page_view', { page: 'profile' });
}

export function trackRankingView(tab) {
  trackEvent('ranking_page_view', { page: 'ranking', tab: tab || 'solo' });
}

export function trackPugListView(lobbyType) {
  trackEvent('pug_list_view', { page: 'pug', lobby_type: lobbyType || 'pug' });
}

export function trackServersView() {
  trackEvent('servers_page_view', { page: 'servers' });
}

export function trackPerformanceView() {
  trackEvent('performance_page_view', { page: 'performance' });
}

export function trackSquadView() {
  trackEvent('squad_page_view', { page: 'squad' });
}
