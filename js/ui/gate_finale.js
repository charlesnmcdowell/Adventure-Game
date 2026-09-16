// Native inline movie playback. The opening is enabled only after a finished
// movie has been rendered, inspected and installed; no missing-file placeholder.
(function () {
'use strict';
const A = ADV, G = A.GateArt;
G.openingMovie = { version: 1, src: null, title: 'Campaign opening' };
G.playOpening = function (scene, game, done, movie = G.openingMovie) {
 if (!movie.src) { done?.(); return; }
 const oldFocus = document.activeElement, oldCut = scene.__cutscene;
 scene.__cutscene = true;
 const root = document.createElement('div'); root.className = 'gate-opening-movie';
 root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', movie.title);
 root.style.cssText = 'position:fixed;inset:0;z-index:100000;background:#05070b;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);color:#eee;box-sizing:border-box';
 const video = document.createElement('video'); video.playsInline = true; video.preload = 'metadata'; video.controls = true;
 video.style.cssText = 'width:100%;min-height:0;max-height:calc(100dvh - 100px);object-fit:contain';
 video.muted = !!A.Music.muted; video.src = movie.src;
 const status = document.createElement('div'); status.setAttribute('role', 'status'); status.textContent = movie.title;
 const controls = document.createElement('div'); controls.style.cssText = 'display:flex;gap:12px;padding:10px;flex-wrap:wrap;justify-content:center';
 const button = text => { const b = document.createElement('button'); b.textContent = text; b.style.cssText = 'min-height:44px;min-width:44px;padding:10px 20px;font:inherit;touch-action:manipulation'; controls.append(b); return b; };
 const play = button('Play opening'), skip = button('Continue to quest');
 root.append(video, status, controls); document.body.append(root);
 A.Music.stopVoice(); A.Music.movieHeld = true; A.Music.halt(false);
 let finished = false;
 const cleanup = completed => {
  if (finished) return; finished = true;
  scene.events.off('shutdown', shutdown); document.removeEventListener('visibilitychange', visibility);
  video.pause(); video.removeAttribute('src'); video.load(); root.remove(); scene.__cutscene = oldCut;
  A.Music.movieHeld = false; A.Music.wake(); oldFocus?.focus?.();
  if (completed) { A.Campaign3.state(game).openingMovieSeen = movie.version; A.Campaign3.save(game); }
 };
 const finish = completed => { if (finished) return; cleanup(completed); done?.(); };
 const shutdown = () => cleanup(false);
 const visibility = () => { if (document.hidden) video.pause(); };
 play.onclick = () => {
  video.play().then(() => { if (!finished) { play.textContent = 'Resume'; status.textContent = movie.title; } }).catch(() => {
   if (!finished) status.textContent = 'Playback was blocked. Tap Play opening to try again, or continue to the quest.';
  });
 };
 skip.onclick = () => finish(false);
 video.onended = () => finish(true);
 video.onerror = () => { status.textContent = 'The movie could not load. You can continue to the quest.'; };
 root.onkeydown = e => {
  if (e.key === 'Escape') { e.preventDefault(); finish(false); }
  if (e.key === 'Tab') {
   const items = [video, play, skip], index = items.indexOf(document.activeElement);
   e.preventDefault(); items[(index + (e.shiftKey ? 2 : 1)) % 3].focus();
  }
 };
 document.addEventListener('visibilitychange', visibility); scene.events.once('shutdown', shutdown); play.focus();
};
const departure = A.Campaign3.departureBeats;
A.Campaign3.departureBeats = function (game, quest) {
 const beats = departure(game, quest);
 if (quest?.campaign3 && quest.n === 1 && G.openingMovie.src && A.Campaign3.state(game).openingMovieSeen !== G.openingMovie.version) {
  beats.unshift({ c3: true, openingMovie: true });
 }
 return beats;
};
const playBeat = A.Campaign3UI.playBeat;
A.Campaign3UI.playBeat = function (scene, game, beat, done) {
 if (beat.openingMovie) return G.playOpening(scene, game, done);
 return playBeat(scene, game, beat, done);
};
})();
