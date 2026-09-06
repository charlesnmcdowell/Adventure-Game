// Music + voice playback. HTML5 Audio elements (they work from file:// where
// XHR-based loaders don't). One music channel with per-context rotation that
// switches up often, one voice channel for dialogue lines.
(function () {
'use strict';
globalThis.ADV = globalThis.ADV || {};

// context -> track pool (audio/music/<name>.mp3). Single-track pools loop.
const POOLS = {
  // "Weight of the Quiet Man Edwyn theme 2" — the relaxing home-menu theme.
  title:    ['edwyn2'],
  town:     ['edwyn2'],
  creation: ['shop1', 'relax1'],
  quest:    ['forest1', 'forest2', 'night1', 'night2', 'fog1', 'origin1',
             'city1', 'city2', 'stars1', 'stars2', 'scabbard1', 'scabbard2',
             'gate1', 'inn1', 'inn2'],
  combat:   ['battle_clove', 'battle_ronin1', 'battle_ronin2', 'battle_fire1',
             'battle_fire2', 'battle_origin', 'battle_salute1', 'battle_salute2',
             'battle_riot1', 'battle_riot2'],
  boss:     ['boss1', 'boss2', 'gate2'],
  death:    ['edwyn1'],
};

const live = new Set();
let playGen = 0;

function bumpGen(el) {
  playGen++;
  if (el) el.__playGen = playGen;
  return playGen;
}

// Chrome will often honor a play() that resolves AFTER we paused. Stamp the
// generation so a late promise cannot restart a track we already left.
function pauseEl(el) {
  if (!el) return;
  el.__wantPlay = false;
  bumpGen(el);
  try { el.pause(); } catch (e) {}
}

function killEl(el) {
  pauseEl(el);
  if (!el) return;
  try { el.removeAttribute('src'); el.src = ''; el.load(); } catch (e) {}
  live.delete(el);
}

function playEl(el) {
  if (!el) return;
  const gen = bumpGen(el);
  el.__wantPlay = true;
  el.volume = Music.muted ? 0 : (el === Music.voiceEl ? 1 : Music.volume);
  if (Music.muted || Music.hidden) return;
  const p = el.play();
  if (p && p.then) {
    p.then(() => {
      Music.unlocked = true;
      if (!el.__wantPlay || el.__playGen !== gen || Music.hidden || Music.muted) {
        try { el.pause(); } catch (e) {}
      }
    }).catch(() => {});
  }
}

function watch(el) {
  if (!el) return el;
  live.add(el);
  el.addEventListener('ended', () => {
    if (!el.__wantPlay) live.delete(el);
  });
  return el;
}

function pauseOthers(keep) {
  for (const el of live) {
    if (el !== keep && el !== Music.voiceEl) pauseEl(el);
  }
  if (Music.homeEl && Music.homeEl !== keep) pauseEl(Music.homeEl);
  if (Music.el && Music.el !== keep && Music.el !== Music.voiceEl) pauseEl(Music.el);
}

function haltAll(hard) {
  if (hard) {
    for (const el of live) killEl(el);
    killEl(Music.el);
    killEl(Music.homeEl);
    killEl(Music.voiceEl);
    live.clear();
    Music.el = null;
    Music.homeEl = null;
    Music.voiceEl = null;
    Music.track = null;
    return;
  }
  for (const el of live) pauseEl(el);
  pauseEl(Music.el);
  pauseEl(Music.homeEl);
  pauseEl(Music.voiceEl);
}

const Music = {
  el: null, voiceEl: null,
  context: null, track: null,
  queues: {}, muted: false, unlocked: false,
  volume: 0.4,
  hidden: false,

  init() {
    try { Music.muted = localStorage.getItem('adv:muted') === '1'; } catch (e) {}
    const unlock = () => {
      Music.unlocked = true;
      document.removeEventListener('pointerdown', unlock);
      document.removeEventListener('keydown', unlock);
      if (Music.hidden || Music.muted) return;
      Music.resumeCurrent();
    };
    document.addEventListener('pointerdown', unlock);
    document.addEventListener('keydown', unlock);
    if (typeof window === 'undefined') return;
    // Soft halt when the tab is hidden so one track can resume. Hard halt
    // on real close — otherwise looped HTML5 Audio keeps playing with no UI.
    window.addEventListener('pagehide', (ev) => Music.halt(!ev.persisted));
    window.addEventListener('beforeunload', () => Music.halt(true));
    window.addEventListener('freeze', () => Music.halt(true));
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) Music.halt(false);
      else { Music.hidden = false; Music.resumeCurrent(); }
    });
  },

  halt(hard) {
    Music.hidden = true;
    haltAll(!!hard);
  },

  resumeCurrent() {
    if (Music.hidden || Music.muted) return;
    if (Music.HOME.includes(Music.context) && Music.homeEl && Music.homeEl.src) {
      pauseOthers(Music.homeEl);
      Music.el = Music.homeEl;
      playEl(Music.homeEl);
      return;
    }
    if (Music.el && Music.el.src) {
      pauseOthers(Music.el);
      playEl(Music.el);
    }
  },

  nextTrack(context) {
    const pool = POOLS[context] || [];
    if (!pool.length) return null;
    if (pool.length === 1) return pool[0];
    let q = Music.queues[context];
    if (!q || !q.length) {
      q = pool.slice();
      for (let i = q.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [q[i], q[j]] = [q[j], q[i]];
      }
      // avoid immediate repeat across reshuffles
      if (q[0] === Music.track && q.length > 1) q.push(q.shift());
      Music.queues[context] = q;
    }
    return q.shift();
  },

  // One track per quest (request): the run picks a track when the quest
  // starts and keeps it through every encounter and fight; boss quests draw
  // from the boss pool. Town/death/creation end the run.
  RUN_CONTEXTS: ['quest', 'combat', 'boss'],
  run: null,                       // {track} while a quest is in progress

  startRun(isBoss) {
    const pool = isBoss ? POOLS.boss : POOLS.quest.concat(POOLS.combat);
    let name = pool[Math.floor(Math.random() * pool.length)];
    if (name === Music.lastRunTrack && pool.length > 1) name = pool[(pool.indexOf(name) + 1) % pool.length];
    Music.lastRunTrack = name;
    Music.run = { track: name };
    Music.context = 'quest';
    Music.startNamed(name, true);
  },
  endRun() { Music.run = null; },

  play(context) {
    if (Music.RUN_CONTEXTS.includes(context)) {
      if (Music.run) {                                   // mid-quest: keep the quest's track going
        Music.context = context;
        Music.leaveHome();
        if (Music.el && Music.el.__name === Music.run.track) {
          pauseOthers(Music.el);
          if (Music.el.paused) playEl(Music.el);
        }
        return;
      }
    } else Music.endRun();
    if (Music.context === context && Music.el && !Music.el.paused && Music.el.__wantPlay) return;
    // seamless carry-over when both contexts sit on the same single track
    if (Music.el && !Music.el.paused && Music.el.__wantPlay && Music.context && (POOLS[context] || []).length === 1 &&
        (POOLS[Music.context] || []).length === 1 && POOLS[context][0] === Music.track) {
      Music.context = context;
      return;
    }
    Music.context = context;
    Music.start(context, false);
  },

  // The home theme is one element for the whole session: it loops, and when
  // the player leaves town it pauses where it is and resumes there on return
  // (request: keep "Weight of the Quiet Man" playing on the home screen).
  HOME: ['title', 'town'],
  homeEl: null,

  pauseEl,
  pauseHome() { pauseEl(Music.homeEl); },
  leaveHome() {
    const keep = (Music.el && Music.el !== Music.homeEl) ? Music.el : null;
    pauseEl(Music.homeEl);
    if (Music.el === Music.homeEl) Music.el = null;
    pauseOthers(keep);
  },

  start(context, force) {
    const name = Music.nextTrack(context);
    if (!name) return;
    const isHome = Music.HOME.includes(context);
    let el;
    if (isHome && Music.homeEl && Music.homeEl.__name === name && Music.homeEl.src) {
      el = Music.homeEl;                                   // resume where it left off
    } else {
      if (isHome && Music.homeEl) pauseEl(Music.homeEl);
      el = watch(new Audio('audio/music/' + name + '.mp3'));
      el.__name = name;
      const single = (POOLS[context] || []).length === 1;
      el.loop = single || isHome;
      el.addEventListener('ended', () => {
        if (!el.__wantPlay || Music.el !== el) return;
        if (el.loop) {
          try { el.currentTime = 0; } catch (e) {}
          playEl(el);
        } else if (Music.context === context) Music.start(context, false);
      });
      if (isHome) Music.homeEl = el;
    }
    pauseOthers(el);
    Music.el = el;
    Music.track = name;
    playEl(el);
  },

  // Play one named track, looping or not, replacing whatever is on.
  startNamed(name, loop) {
    pauseEl(Music.homeEl);
    const el = watch(new Audio('audio/music/' + name + '.mp3'));
    el.__name = name; el.loop = !!loop;
    pauseOthers(el);
    Music.el = el; Music.track = name;
    playEl(el);
  },

  // Force a rotation step ("switch it up") without changing context.
  rotate() { if (Music.context) Music.start(Music.context, false); },

  toggleMute() {
    Music.muted = !Music.muted;
    try { localStorage.setItem('adv:muted', Music.muted ? '1' : '0'); } catch (e) {}
    if (Music.muted) haltAll(false);
    else Music.resumeCurrent();
    return Music.muted;
  },

  // ---- voice channel --------------------------------------------------------
  speakFile(personalityId, band, idx, tag) {
    if (!personalityId) return;
    Music.stopVoice();
    const plain = 'audio/vo/' + personalityId + '/' + band + '_' + idx + '.mp3';
    const src = tag ? 'audio/vo/' + tag + '/' + personalityId + '/' + band + '_' + idx + '.mp3' : plain;
    const el = watch(new Audio(src));
    if (tag) {
      el.addEventListener('error', () => {
        if (Music.voiceEl !== el) return;
        const fb = watch(new Audio(plain));
        Music.voiceEl = fb;
        playEl(fb);
      }, { once: true });
    }
    Music.voiceEl = el;
    playEl(el);
  },
  // campaign lines are name-free clips keyed by character, beat and index (§8)
  speakCampaign(who, key, idx) {
    Music.stopVoice();
    const el = watch(new Audio('audio/vo/campaign/' + who + '/' + key + '_' + idx + '.mp3'));
    Music.voiceEl = el;
    playEl(el);
  },
  speakTutorial(id) {
    if (!id) return;
    Music.stopVoice();
    const el = watch(new Audio('audio/vo/tutorial/' + id + '.mp3'));
    Music.voiceEl = el;
    playEl(el);
  },
  stopVoice() {
    if (Music.voiceEl) { pauseEl(Music.voiceEl); Music.voiceEl = null; }
  },

  // small speaker toggle for a scene corner
  button(scene, x, y) {
    const label = () => Music.muted ? '♪ off' : '♪ on';
    const t = ADV.T.text(scene, x, y, label(), { size: 12, ox: 1, color: ADV.T.css.inkDim })
      .setInteractive({ useHandCursor: true });
    t.on('pointerdown', () => { Music.toggleMute(); t.setText(label()); });
    return t;
  },
};

Music.init();
ADV.Music = Music;
})();
