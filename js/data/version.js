// Public game version and patch notes. Bump `id` for each live patch so
// returning players see the notes once and receive the thank-you gold.
(function () {
'use strict';
globalThis.ADV = globalThis.ADV || {};
ADV.DATA = ADV.DATA || {};

ADV.DATA.PATCHES = [
  {
    id: '1.2.0',
    label: '1.2.0',
    date: '14 Sep 2026',
    gold: 5000,
    notes: [
      'Gate named foes bring fuller kits, and a lone ward meets a fairer first fight.',
      'Every living spouse shares one vault — a later marriage no longer hides the gold.',
      'The ordinary town has grown to eighty people, and Lookism no longer reserves every stranger.',
      'The Bandit Camp has its own battle hymn, and the quest score returns after a reload.',
    ],
  },
];

ADV.DATA.VERSION = ADV.DATA.PATCHES[ADV.DATA.PATCHES.length - 1];
})();
