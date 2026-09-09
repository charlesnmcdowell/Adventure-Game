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
    ctx = ctx || {};
    const D = ADV.DATA.DIALOGUE;
    const p = speaker.personalityId ? D[speaker.personalityId] : null;
    if (!p) return null;
    const lines = p[band];
    if (!lines || !lines.length) return null;
    const rules = p.replyFamilies && p.replyFamilies[band];
    const usable = [];
    const matched = [];
    for (let i = 0; i < lines.length; i++) {
      const needs = ADV.util.lineNeeds(lines[i]);
      if (needs.includes('them') && !ctx.them) continue;
      if (needs.includes('partner') && !ctx.partner) continue;
      usable.push(i);
      if (ctx.replyTo && rules && rules[i] && rules[i].includes(ctx.replyTo)) matched.push(i);
    }
    if (!usable.length) return null; // show no box rather than the wrong voice (§17a)
    speaker.lastVariantUsed = speaker.lastVariantUsed || {};
    const last = speaker.lastVariantUsed[band];
    // Replies must answer the actual subject. Exhausting a preparation pool
    // must not turn the next answer into a greeting or an acknowledgment of thanks.
    if (ctx.replyTo && !matched.length) return null;
    const eligible = ctx.replyTo ? matched : usable;
    let preferred = eligible;
    if (ctx.score != null && usable.length >= 4 && !ctx.replyTo) {
      const intensity = band === 'hatred' ? Math.abs(ctx.score) : ctx.score;
      const pos = band === 'general' ? (intensity + 49) / 98 : (intensity - 50) / 50;
      const at = Math.max(0, Math.min(lines.length - 2, Math.floor(pos * (lines.length - 1))));
      const allowed = usable.filter(i => i >= at && i <= at + 1);
      if (allowed.length) preferred = allowed;
    }
    speaker.dialogueRotation = speaker.dialogueRotation || {};
    const signature = (ADV.DATA.DIALOGUE_REVISION || '') + ':' + eligible.join(',');
    const rotationKey = band + (ctx.replyTo ? ':' + ctx.replyTo : '');
    let rotation = speaker.dialogueRotation[rotationKey];
    if (!rotation || rotation.signature !== signature || !Array.isArray(rotation.used)) {
      rotation = speaker.dialogueRotation[rotationKey] = { signature, used: [] };
    }
    const unused = list => list.filter(i => !rotation.used.includes(i) && i !== last);
    let pool = unused(preferred);
    if (!pool.length) pool = unused(eligible);
    if (!pool.length) {
      rotation.used = [];
      pool = eligible.filter(i => i !== last);
    }
    if (!pool.length) pool = eligible;
    const roll = Math.max(0, Math.min(0.999999, ctx.rand == null ? Math.random() : ctx.rand));
    const idx = pool[Math.floor(roll * pool.length)];
    speaker.lastVariantUsed[band] = idx;
    rotation.used.push(idx);
    return { text: ADV.util.renderLine(lines[idx], ctx), band, idx };
  },
};
})();
