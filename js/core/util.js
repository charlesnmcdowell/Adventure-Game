// Small shared helpers.
(function () {
'use strict';
globalThis.ADV = globalThis.ADV || {};

ADV.util = {
  clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); },
  cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; },
  // Dialogue token substitution (§17a): names in text, written pronouns in voice.
  renderLine(line, ctx) {
    // ctx: {target, them, partner, self} — names (or null)
    let out = line;
    out = out.replace(/\{target\}/g, ctx.target || 'friend');
    out = out.replace(/\{they\}/g, ctx.them || 'they');
    out = out.replace(/\{them\}/g, ctx.them || 'them');
    out = out.replace(/\{their\}/g, ctx.them ? ctx.them + "'s" : 'their');
    out = out.replace(/\{partner\}/g, ctx.partner || 'someone');
    out = out.replace(/\{self\}/g, ctx.self || '');
    out = out.replace(/\[[a-z ]+\]\s*/gi, '');   // delivery cues are for the voice, not the text box
    if (out) out = out[0].toUpperCase() + out.slice(1);
    return out;
  },
  lineNeeds(line) {
    const needs = [];
    if (/\{them\}|\{their\}|\{they\}/.test(line)) needs.push('them');
    if (/\{partner\}/.test(line)) needs.push('partner');
    return needs;
  },
  // Pick a dialogue line for a speaker (§17a): band by tier, warmth by score,
  // never the same variant twice running, conditional lines excluded when
  // their token can't resolve, fallback INSIDE the same band only.
  speak(world, speaker, band, ctx) {
    const r = ADV.util.speakEx(world, speaker, band, ctx);
    return r ? r.text : null;
  },
  // Full form: returns {text, band, idx} so callers can play the matching
  // voice clip (audio/vo/{pid}/{band}_{idx+1}.mp3, §17a asset layout).
  speakEx(world, speaker, band, ctx) {
    const D = ADV.DATA.DIALOGUE;
    const p = speaker.personalityId ? D[speaker.personalityId] : null;
    if (!p) return null;
    const lines = p[band] || p.general;
    if (!lines || !lines.length) return null;
    const usable = [];
    for (let i = 0; i < lines.length; i++) {
      const needs = ADV.util.lineNeeds(lines[i]);
      if (needs.includes('them') && !ctx.them) continue;
      if (needs.includes('partner') && !ctx.partner) continue;
      usable.push(i);
    }
    if (!usable.length) return null; // show no box rather than the wrong voice (§17a)
    speaker.lastVariantUsed = speaker.lastVariantUsed || {};
    const last = speaker.lastVariantUsed[band];
    let pickPool = usable.filter(i => i !== last);
    if (!pickPool.length) pickPool = usable;
    // warmth position selects within the band where score has range (§6)
    let idx;
    if (ctx.score != null && pickPool.length > 1) {
      const w = ADV.Rel.warmth(ctx.score);
      const pos = w === 'low' ? 0 : w === 'mid' ? 0.5 : 1;
      idx = pickPool[Math.round(pos * (pickPool.length - 1))];
      if (idx === last && pickPool.length > 1) idx = pickPool[(pickPool.indexOf(idx) + 1) % pickPool.length];
    } else {
      idx = pickPool[Math.floor((ctx.rand != null ? ctx.rand : Math.random()) * pickPool.length)];
    }
    speaker.lastVariantUsed[band] = idx;
    return { text: ADV.util.renderLine(lines[idx], ctx), band, idx };
  },
};
})();
