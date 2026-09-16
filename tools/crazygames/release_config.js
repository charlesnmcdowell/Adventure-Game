// Selected only by the gated CrazyGames build profile, never by a query string.
(function () {
'use strict';
globalThis.ADV = globalThis.ADV || {};
Object.defineProperty(ADV, 'Release', {
  value: Object.freeze({
    target: 'crazygames',
    voiceBase: 'https://charlesnmcdowell.github.io/Adventure-Game/audio/vo/',
    // These newly recorded clips are not on the public host yet (16 Sep).
    // Keep this small speaker pack local so the candidate never requests a 404.
    localVoicePrefixes: Object.freeze(['audio/vo/campaign/thornwise/']),
  }), enumerable: true,
});
})();
