'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { load } = require('./harness');
const ADV = load();

vm.runInThisContext(fs.readFileSync(path.join(__dirname, '../js/ui/theme.js'), 'utf8'), { filename: 'theme.js' });
vm.runInThisContext(fs.readFileSync(path.join(__dirname, '../js/ui/tooltip.js'), 'utf8'), { filename: 'tooltip.js' });

let pass = 0, fail = 0;
function ok(c, n, x) { if (c) { pass++; console.log('  ok  ' + n); } else { fail++; console.log('FAIL  ' + n, x !== undefined ? '[' + x + ']' : ''); } }
function eq(a, b, n) { ok(a === b, n, a + ' != ' + b); }

function overlaps(box, host) {
  return ADV.Tooltip.overlapsHost({ x: box.x, y: box.y, w: box.w, h: box.h }, host);
}

function fakeScene() {
  const texts = [];
  return {
    texts,
    add: {
      text(x, y, body) {
        const t = {
          width: 200, height: 80, x, y, text: body,
          setDepth() { return this; },
          setPosition(px, py) { this.x = px; this.y = py; return this; },
          destroy() { this.dead = true; },
        };
        texts.push(t);
        return t;
      },
      graphics() {
        return {
          setDepth() { return this; },
          fillStyle() {}, fillRoundedRect() {}, lineStyle() {}, strokeRoundedRect() {},
          disableInteractive() { this.locked = true; },
          destroy() { this.dead = true; },
        };
      },
    },
    events: { once() {} },
  };
}

function fakeZone(rect) {
  const handlers = {};
  return {
    rect,
    on(ev, fn) { (handlers[ev] = handlers[ev] || []).push(fn); return this; },
    emit(ev, p) { (handlers[ev] || []).forEach(fn => fn(p)); },
    getBounds() { return { x: rect.x, y: rect.y, width: rect.w, height: rect.h }; },
  };
}

console.log('\n-- Tooltip placement stays off the skill --');
{
  const P = ADV.Tooltip;
  eq(P.SHOW_DELAY_MS, 4000, 'hover delay is 4 seconds');
  const host = { x: 80, y: 120, w: 40, h: 40 };
  const right = P.placeBeside(host, 220, 90, 1280, 760);
  ok(right.x >= host.x + host.w + 12, 'uses the free side to the right');
  ok(!overlaps({ x: right.x, y: right.y, w: 220, h: 90 }, host), 'right-side card does not cover the host');

  const edge = { x: 1100, y: 600, w: 80, h: 50 };
  const left = P.placeBeside(edge, 454, 200, 1280, 760);
  ok(left.x + 454 <= edge.x, 'flips to the left near the right edge');
  ok(!overlaps({ x: left.x, y: left.y, w: 454, h: 200 }, edge), 'left-side card does not cover the host');

  const bar = { x: 56, y: 674, w: 110, h: 60 };
  const tall = P.placeBeside(bar, 454, 400, 1280, 760);
  ok(tall.x >= bar.x + bar.w, 'bottom action stays to the side when the card is tall');
  ok(!overlaps({ x: tall.x, y: tall.y, w: 454, h: 400 }, bar), 'tall card still misses the hovered button');
}

console.log('\n-- Hover waits, then leaves with the pointer --');
{
  const P = ADV.Tooltip;
  const timers = [];
  const realSet = global.setTimeout;
  const realClear = global.clearTimeout;
  global.setTimeout = (fn, ms) => { timers.push({ fn, ms, id: timers.length + 1 }); return timers.length; };
  global.clearTimeout = (id) => { const t = timers[id - 1]; if (t) t.cleared = true; };
  try {
    const scene = fakeScene();
    const zone = fakeZone({ x: 100, y: 80, w: 48, h: 48 });
    P.attach(scene, zone, () => 'Fire Bolt');
    zone.emit('pointerover', { x: 110, y: 90 });
    eq(timers.length, 1, 'schedules one hover timer');
    eq(timers[0].ms, 4000, 'timer waits 4 seconds');
    ok(!P.current, 'does not open the card on the first hover frame');
    zone.emit('pointerout');
    ok(timers[0].cleared, 'leaving the skill cancels the pending card');
    ok(!P.current, 'no card after a cancelled hover');

    zone.emit('pointerover', { x: 110, y: 90 });
    timers[timers.length - 1].fn();
    ok(!!P.current, 'card opens after the delay');
    ok(P.current.host && P.current.host.x === 100, 'card is placed from the skill box');
    ok(P.current.host && P.current.txt.x >= 100 + 48, 'text sits to the side of the skill');
    zone.emit('pointerout');
    ok(!P.current, 'card closes when the pointer leaves the skill');
  } finally {
    global.setTimeout = realSet;
    global.clearTimeout = realClear;
    ADV.Tooltip.hide();
  }
}

console.log('\n' + pass + ' passed, ' + fail + ' failed');
if (fail) process.exit(1);
