// Voluntary feedback and support. The milestone lives in browser preferences,
// outside Save.reset(), campaign restarts and the journal inherited after death.
(function () {
'use strict';
const T = () => ADV.T;
const Support = {};
Support.links = Object.freeze({
  hiro: 'https://www.facebook.com/charles.mcdowell.14268769',
  narratives: 'https://www.facebook.com/neverendingnarratives',
  donate: 'https://neverendingnarratives.com/#fund',
});
Support.open = function (destination) {
  const url = Support.links[destination];
  if (!url) return;
  // A direct click opens outside the website's game iframe without navigating
  // away from the player's running game or granting the new tab an opener.
  try { window.open(url, '_blank', 'noopener,noreferrer'); } catch (e) {}
};
Support.due = function (game) {
  // Keep the original preference key so anyone who saw the Gate version is
  // also counted. Each campaign must reach quest 2; ordinary contracts do not.
  if (!game || ADV.Prefs.get().gateSupportSeen) return false;
  const original = game.campaign;
  const memberships = (game.campaign2 && game.campaign2.m) || {};
  const gate = game.meta && game.meta.c3;
  return !!((original && original.factionId && original.stage >= 2) ||
    Object.values(memberships).some(m => m && m.stage >= 2) ||
    (gate && gate.stage >= 2));
};

Support.arrival = function (scene, game, done) {
  if (!Support.due(game)) { if (done) done(); return; }
  let shown = false;
  ADV.Notices.custom(scene, (keep, depth, close) => {
    const W = T().W, width = 748;
    let y = 140;
    const text = (copy, size, opts) => {
      const label = keep(T().text(scene, W / 2, y, copy,
        Object.assign({ size, ox: 0.5, wrap: width, align: 'center' }, opts)).setDepth(depth));
      y += label.height + 18;
    };
    const button = (x, label, destination) => ADV.UI.modalBtn(keep, depth,
      T().button(scene, x, y, 354, 44, label,
        () => Support.open(destination), { size: 16, color: T().css.gold }));
    text('Enjoying Adventurer?', 28, { display: true, color: T().css.gold });
    text("Thanks for spending time in this world. I'd love to hear what you've enjoyed, what feels rough, and what you'd like to see next.", 16);
    text('Send me feedback on Facebook as Hiro Protagonist or Neverendingnarratives.', 16);
    button(W / 2 - 364, 'Hiro Protagonist', 'hiro');
    button(W / 2 + 10, 'Neverendingnarratives', 'narratives');
    y += 70;
    text('Want to help keep the site alive? A donation of any amount helps keep the game online and supports its development. Thank you for helping me keep it going.', 16);
    text('Your feedback matters whether or not you donate. — Hiro', 14, { italic: true, color: T().css.inkDim });
    y = Math.max(y + 6, 584);
    button(W / 2 - 364, 'Donate any amount', 'donate');
    ADV.UI.modalBtn(keep, depth, T().button(scene, W / 2 + 10, y, 354, 44,
      'Keep playing', () => { close(); if (done) done(); }, { size: 16 }));
    // Mark only after the notice actually acquired the modal and was built.
    // Prefs also caches this in memory if browser storage is unavailable.
    ADV.Prefs.set({ gateSupportSeen: true });
    shown = true;
  }, { w: 828, h: 552, y: 110 });
  if (!shown && done) done();
};

ADV.SupportUI = Support;
})();
