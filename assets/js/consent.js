/* BRS Consent v1: first-party preferences, Google Consent Mode v2, basic loading. */
(() => {
  'use strict';
  if (window.BRSConsent) return;
  const key = 'brs-consent-v1', lifetime = 180 * 86400000;
  const config = window.BRSConsentConfig || {};
  const ids = [...new Set((Array.isArray(config.googleIds) ? config.googleIds : []).filter(id => typeof id === 'string' && /^(G-[A-Z0-9]+|AW-\d+)$/.test(id)))];
  let choice = null;
  const valid = value => value && value.version === 1 && typeof value.analytics === 'boolean' && typeof value.marketing === 'boolean' && Number.isFinite(value.time) && value.time <= Date.now() && Date.now() - value.time < lifetime;
  try { const saved = JSON.parse(localStorage.getItem(key)); if (valid(saved)) choice = saved; } catch { /* Denied if storage is unavailable. */ }
  const state = value => ({ analytics_storage: value?.analytics ? 'granted' : 'denied', ad_storage: value?.marketing ? 'granted' : 'denied', ad_user_data: value?.marketing ? 'granted' : 'denied', ad_personalization: value?.marketing ? 'granted' : 'denied' });
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  window.gtag('consent', 'default', { ...state(null), wait_for_update: 500 });
  if (choice) window.gtag('consent', 'update', state(choice));
  const loaded = new Set(); let library = false;
  const load = () => {
    const permitted = ids.filter(id => id.startsWith('G-') ? choice?.analytics : choice?.marketing);
    if (!permitted.length) return;
    if (!library) {
      library = true;
      window.gtag('js', new Date());
      const script = document.createElement('script'); script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(permitted[0])}`;
      document.head.append(script);
    }
    permitted.forEach(id => { if (!loaded.has(id)) { loaded.add(id); window.gtag('config', id); } });
  };
  // Only known Google cookies are removed, never unrelated site/session cookies.
  const clean = value => {
    const names = document.cookie.split(';').map(item => item.split('=')[0].trim()).filter(name => (!value.analytics && /^(_ga(?:_|$)|_gid$|_gat(?:_|$))/.test(name)) || (!value.marketing && /^(_gcl_|_gac_)/.test(name)));
    const parts = location.hostname.split('.');
    const domains = ['', ...parts.map((_, index) => parts.slice(index).join('.'))];
    const paths = ['/', ...location.pathname.split('/').filter(Boolean).map((_, index, all) => '/' + all.slice(0, index + 1).join('/') + '/')];
    names.forEach(name => domains.forEach(domain => paths.forEach(path => { document.cookie = `${name}=; Max-Age=0; Path=${path};${domain ? ` Domain=${domain};` : ''} SameSite=Lax`; })));
  };
  const save = (analytics, marketing) => {
    const revoked = [...loaded].some(id => id.startsWith('G-') ? !analytics : !marketing);
    choice = { version: 1, analytics, marketing, time: Date.now() };
    window.gtag('consent', 'update', state(choice));
    try { localStorage.setItem(key, JSON.stringify(choice)); } catch { /* Choice still applies to this page. */ }
    try { clean(choice); } catch { /* Cookies may also be blocked by browser policy. */ }
    load();
    window.dispatchEvent(new CustomEvent('brs:consent', { detail: { ...choice } }));
    if (revoked) location.reload();
  };
  window.BRSConsent = { get: () => choice ? { ...choice } : null, open: () => {} };
  load();
  document.addEventListener('DOMContentLoaded', () => {
    const ru = document.documentElement.lang.startsWith('ru');
    const text = ru ? {
      title: 'Ваш выбор cookies', description: 'Необходимое хранилище обеспечивает работу сайта и запоминает ваш выбор. Аналитика и рекламные cookies используются только с вашего согласия.',
      accept: 'Принять все', reject: 'Отклонить необязательные', settings: 'Настройки cookies', save: 'Сохранить выбор', close: 'Закрыть настройки',
      necessary: 'Необходимые', necessaryText: 'Всегда включены: работа сайта и сохранение настроек cookies.', analytics: 'Аналитика', analyticsText: 'Помогает измерять посещаемость сайта с помощью Google Analytics.', marketing: 'Реклама', marketingText: 'Измерение рекламы Google Ads и персонализация рекламы.', policy: 'Политика cookies', always: 'Всегда включены'
    } : {
      title: 'Your cookie preferences', description: 'Essential storage keeps the website working and remembers your choice. Analytics and advertising cookies are used only with your consent.',
      accept: 'Accept all', reject: 'Reject optional', settings: 'Cookie settings', save: 'Save preferences', close: 'Close settings',
      necessary: 'Essential', necessaryText: 'Always enabled: website functionality and remembering your cookie preferences.', analytics: 'Analytics', analyticsText: 'Helps measure website visits using Google Analytics.', marketing: 'Advertising', marketingText: 'Google Ads measurement and advertising personalisation.', policy: 'Cookie Policy', always: 'Always enabled'
    };
    const button = (label, action) => { const element = document.createElement('button'); element.type = 'button'; element.textContent = label; element.className = 'brs-consent-button'; element.addEventListener('click', action); return element; };
    const paragraph = value => { const element = document.createElement('p'); element.textContent = value; return element; };
    const heading = document.createElement('h2'); heading.id = 'brs-consent-heading'; heading.textContent = text.title;
    const banner = document.createElement('section'); banner.className = 'brs-consent-banner'; banner.setAttribute('aria-labelledby', heading.id);
    banner.append(heading, paragraph(text.description));
    let returnFocus;
    const dialog = document.createElement('dialog'); dialog.className = 'brs-consent-dialog'; dialog.setAttribute('aria-labelledby', 'brs-consent-dialog-title');
    const title = document.createElement('h2'); title.id = 'brs-consent-dialog-title'; title.textContent = text.settings;
    dialog.append(title, paragraph(text.description));
    const essential = document.createElement('div'); essential.className = 'brs-consent-category'; const strong = document.createElement('strong'); strong.textContent = `${text.necessary} · ${text.always}`; essential.append(strong, paragraph(text.necessaryText)); dialog.append(essential);
    const toggle = (label, description, name) => {
      const row = document.createElement('label'); row.className = 'brs-consent-category';
      const input = document.createElement('input'); input.type = 'checkbox'; input.name = name;
      const copy = document.createElement('span'), title = document.createElement('strong'); title.textContent = label;
      copy.append(title, paragraph(description)); row.append(input, copy); dialog.append(row); return input;
    };
    const analytics = toggle(text.analytics, text.analyticsText, 'analytics'), marketing = toggle(text.marketing, text.marketingText, 'marketing');
    const dismiss = () => { if (dialog.open) dialog.close(); banner.hidden = !!choice; if (returnFocus?.isConnected && !returnFocus.closest('[hidden]')) returnFocus.focus(); };
    const commit = (a, m) => { save(a, m); dismiss(); };
    const actions = document.createElement('div'); actions.className = 'brs-consent-actions';
    actions.append(button(text.reject, () => commit(false, false)), button(text.accept, () => commit(true, true)), button(text.save, () => commit(analytics.checked, marketing.checked)));
    dialog.append(actions, button(text.close, dismiss));
    dialog.addEventListener('keydown', event => {
      if (event.key !== 'Tab') return;
      const controls = [...dialog.querySelectorAll('input:not([disabled]),button:not([disabled]),a[href]')];
      const first = controls[0], last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
    dialog.addEventListener('close', () => { if (returnFocus?.isConnected && !returnFocus.closest('[hidden]')) returnFocus.focus(); });
    const open = () => { returnFocus = document.activeElement; analytics.checked = !!choice?.analytics; marketing.checked = !!choice?.marketing; if (!dialog.open) dialog.showModal(); };
    window.BRSConsent.open = open;
    const barActions = document.createElement('div'); barActions.className = 'brs-consent-actions'; barActions.append(button(text.reject, () => commit(false, false)), button(text.accept, () => commit(true, true)), button(text.settings, open)); banner.append(barActions);
    if (config.policyUrl) { try { const url = new URL(config.policyUrl, location.href); if (['https:', 'http:'].includes(url.protocol)) { const link = document.createElement('a'); link.href = url.href; link.textContent = text.policy; banner.append(link); } } catch { /* No unapproved or invalid policy URL. */ } }
    banner.hidden = !!choice;
    document.body.append(banner, dialog);
    const reopen = button(text.settings, open); reopen.classList.add('brs-consent-reopen');
    (document.querySelector('footer .footer__column') || document.body).append(reopen);
    window.addEventListener('storage', event => {
      if (event.key !== key && event.key !== null) return;
      // Reload to restore defaults/stop already loaded tags after another tab changes consent.
      location.reload();
    });
  });
})();
