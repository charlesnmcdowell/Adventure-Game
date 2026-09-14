// Phone launch screen: DOM controls retain their physical size while Phaser
// continues drawing the approved animated scenery behind them.
(function () {
'use strict';
const ua = () => navigator.userAgent;
const ios = () => /iPhone|iPad|iPod/.test(ua()) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const inApp = () => /FBAN|FBAV|Messenger|Instagram/i.test(ua());
let hostStandalone = false;
const standalone = () => hostStandalone || navigator.standalone === true || matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches;
const gameLink = () => window.parent !== window ? 'https://neverendingnarratives.com/adventurer/' : new URL('./', location.href).href;
window.addEventListener('message', event => {
  if (event.source !== window.parent || event.origin !== 'https://neverendingnarratives.com' || event.data?.type !== 'adv:host-state') return;
  hostStandalone = event.data.standalone === true;
  if (hostStandalone) document.querySelector('.mobile-home .browser-hint')?.remove();
  for (const side of ['top', 'right', 'bottom', 'left']) {
    const value = event.data.safeArea?.[side];
    if (typeof value === 'number' && value >= 0 && value < 150) document.documentElement.style.setProperty('--adv-safe-' + side, value + 'px');
  }
  window.__refit?.();
});
const safari = () => ios() && /Safari/.test(ua()) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua()) && !inApp();
function el(tag, text, cls) { const n = document.createElement(tag); if (text) n.textContent = text; if (cls) n.className = cls; return n; }
function button(text, action, cls) { const n = el('button', text, cls); n.type = 'button'; n.addEventListener('click', action); return n; }
function enabled() { return /iPhone|iPod|Android.*Mobile|Windows Phone/.test(ua()) || (matchMedia('(pointer: coarse)').matches && Math.min(innerWidth, innerHeight) <= 600); }
function mount(scene) {
  const root = el('section', '', 'mobile-home'); root.id = 'mobile-home'; root.setAttribute('aria-label', 'Adventurer launch menu');
  document.body.append(root); document.body.classList.add('mobile-launch'); window.__refit?.();
  scene.password = '';
  const main = el('div'); main.style.display = 'contents'; root.append(main);
  let shade = null, returnFocus = null;
  const cleanup = () => { root.remove(); document.body.classList.remove('mobile-launch'); ADV.Music.stopTutorial(); window.__refit?.(); };
  scene.events.once('shutdown', cleanup);
  function closeSheet() { if (!shade) return; shade.remove(); shade = null; main.inert = false; returnFocus?.focus(); }
  function sheet(title) {
    closeSheet(); returnFocus = document.activeElement;
    shade = el('div', '', 'sheet-shade'); const panel = el('section', '', 'sheet');
    panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'true'); panel.setAttribute('aria-label', title);
    const heading = el('div', '', 'sheet-heading'), close = button('×', closeSheet); close.setAttribute('aria-label', 'Close ' + title);
    heading.append(el('h2', title), close); panel.append(heading); shade.append(panel); root.append(shade); main.inert = true;
    shade.addEventListener('click', e => { if (e.target === shade) closeSheet(); });
    shade.addEventListener('keydown', e => {
      if (e.key === 'Escape') { e.preventDefault(); closeSheet(); }
      if (e.key === 'Tab') {
        const items = [...panel.querySelectorAll('button,input,select,a[href]')].filter(n => !n.disabled);
        if (e.shiftKey && document.activeElement === items[0]) { e.preventDefault(); items.at(-1).focus(); }
        else if (!e.shiftKey && document.activeElement === items.at(-1)) { e.preventDefault(); items[0].focus(); }
      }
    });
    close.focus(); return panel;
  }
  function installHint(panel) {
    panel.append(el('p', inApp() ? 'For the best experience, open in Safari' : 'Add Adventurer to your Home Screen'));
    panel.append(el('p', inApp() ? 'Copy the game link, then paste it into Safari. Your saved game stays in the browser where you played.' : 'In Safari, open Share, then choose Add to Home Screen. Launch from that icon to play without browser bars. Saved games stay in the browser where they were created.'));
    const status = el('p', '', 'status'); status.setAttribute('role', 'status');
    const copy = button('Copy game link', async () => {
      const url = gameLink();
      try { await navigator.clipboard.writeText(url); status.textContent = 'Link copied. Paste it into Safari.'; }
      catch (_) {
        const input = el('input'); input.value = url; input.readOnly = true; input.setAttribute('aria-label', 'Game link');
        panel.append(input); input.focus(); input.select();
        status.textContent = 'Touch and hold the selected link to copy it.';
      }
    }); panel.append(copy, status);
  }
  function banner() {
    if (standalone() || (!inApp() && !safari())) return;
    const key = 'adv:launch-hint:' + (inApp() ? 'in-app' : 'safari');
    try { if (localStorage.getItem(key)) return; localStorage.setItem(key, '1'); } catch (_) {}
    const hint = el('aside', '', 'browser-hint');
    hint.append(el('div', inApp() ? 'For the best experience, open in Safari' : 'Add to Home Screen for an app-like launch'));
    const actions = el('div', '', 'hint-actions');
    if (inApp()) {
      actions.append(button('Copy link', async e => {
        const target = e.currentTarget;
        try { await navigator.clipboard.writeText(gameLink()); target.textContent = 'Link copied'; }
        catch (_) { installHint(sheet('Open in Safari')); }
      }));
    } else actions.append(button('How to add', () => installHint(sheet('Add to Home Screen'))));
    const close = button('×', () => hint.remove(), 'close-hint'); close.setAttribute('aria-label', 'Dismiss browser hint'); actions.append(close); hint.append(actions); main.append(hint);
  }
  function more() {
    const panel = sheet('More');
    const sound = button(ADV.Music.muted ? 'Sound: off' : 'Sound: on', () => { ADV.Music.toggleMute(); sound.textContent = ADV.Music.muted ? 'Sound: off' : 'Sound: on'; });
    const motion = button('Scenery motion: ' + (ADV.Prefs.get().titleMotion === false ? 'off' : 'on'), () => {
      const on = ADV.Prefs.get().titleMotion === false; ADV.Prefs.set({ titleMotion: on }); motion.textContent = 'Scenery motion: ' + (on ? 'on' : 'off');
    }); panel.append(sound, motion);
    const type = el('label', 'Game text size'), select = el('select');
    for (const [value, text] of [[1, 'Standard'], [1.2, 'Larger'], [1.35, 'Largest']]) { const option = el('option', text); option.value = value; select.append(option); }
    select.value = ADV.Prefs.textScale(); select.addEventListener('change', () => ADV.Prefs.setTextScale(Number(select.value))); type.append(select); panel.append(type);
    const label = el('label', 'Character password (optional)'), input = el('input'); input.value = scene.password; input.maxLength = 16;
    input.autocapitalize = 'none'; input.autocomplete = 'off'; input.spellcheck = false;
    input.addEventListener('input', () => { input.value = input.value.replace(/[^a-z0-9]/gi, ''); scene.password = input.value; });
    label.append(input); panel.append(label);
    if (ADV.AnimeArt) panel.append(button('Art fitting room', () => scene.scene.start('AnimePreview')));
    if (ADV.Display.supported()) panel.append(button(ADV.Display.label(), () => ADV.Display.toggle()));
    if (ios() || inApp()) panel.append(button('Install / browser help', () => installHint(sheet('Play like an app'))));
    panel.append(el('p', 'Your save lives in this browser. Starting a new game resets the world and your progress.', 'save-note'));
    const ver = (ADV.Game && ADV.Game.versionLabel && ADV.Game.versionLabel()) || (ADV.DATA.VERSION && ADV.DATA.VERSION.label) || '';
    if (ver) panel.append(el('p', 'Version ' + ver, 'save-note'));
  }
  function cards() {
    closeSheet(); main.replaceChildren();
    const card = el('article', '', 'onboarding'), count = el('p', '', 'card-count'), text = el('p'); card.append(count, text);
    const actions = el('div', '', 'launch-actions'); let index = 0;
    const finish = () => { ADV.Music.stopTutorial(); scene.scene.start('Creation', { password: scene.password }); };
    const next = button('Next', () => { index++; if (index >= ADV.DATA.PREGAME_CARDS.length) finish(); else render(); }, 'primary');
    const render = () => { count.textContent = 'BEFORE YOU BEGIN · ' + (index + 1) + ' / ' + ADV.DATA.PREGAME_CARDS.length; text.textContent = ADV.DATA.PREGAME_CARDS[index]; next.textContent = index === ADV.DATA.PREGAME_CARDS.length - 1 ? 'Create my character' : 'Next'; ADV.Music.speakTutorial('card_' + (index + 1)); };
    actions.append(next, button('Skip introduction', finish)); main.append(card, actions); render();
  }
  function begin() {
    if (!ADV.Save.hasSave()) { cards(); return; }
    const panel = sheet('Start a new game?'); panel.append(el('p', 'This deletes the current world, journal, skill levels, and lives saved in this browser.'));
    panel.append(button('Keep my current game', closeSheet, 'primary'), button('Reset and start new game', () => { ADV.Save.reset(); cards(); }, 'danger'));
  }
  banner();
  const header = el('header'); header.append(el('h1', 'ADVENTURER'), el('p', 'a life, several times over', 'tagline'));
  const ver = (ADV.Game && ADV.Game.versionLabel && ADV.Game.versionLabel()) || (ADV.DATA.VERSION && ADV.DATA.VERSION.label) || '';
  if (ver) header.append(el('p', 'Version ' + ver, 'version'));
  main.append(header);
  const actions = el('nav', '', 'launch-actions'); actions.setAttribute('aria-label', 'Start playing');
  const hasSave = ADV.Save.hasVoicedContinue();
  if (hasSave) actions.append(button('Continue', () => {
    let game; try { game = ADV.Game.load(); } catch (_) {}
    if (game) { scene.registry.set('game', game); scene.scene.start('Town'); }
    else { const panel = sheet('Could not load this save'); panel.append(el('p', 'Your saved data has been kept. Close this message and try again.')); }
  }, 'primary'));
  actions.append(button(hasSave ? 'New game' : 'Play', begin, hasSave ? '' : 'primary'), button('More', more), el('p', 'Your adventure saves in this browser', 'save-note'));
  main.append(actions);
  return { destroy: cleanup };
}
ADV.MobileTitle = { enabled, mount, ios, inApp, standalone };
})();
