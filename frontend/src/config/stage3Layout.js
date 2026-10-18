// Stage 3 overlay positions, as percentages of the page 9 photo (2200 by 1400).
// Tune them with ?debug=1. The same boxes fit page9_cat.png, page9_cow.png, and page9_dog.png.

export const STAGE3_NOTE = {
  left: 27.5,
  top: 70.7,
  width: 7.5,
  height: 13.3,
};

export const STAGE3_TITLE = {
  left: 2,
  top: 2,
  width: 56,
  height: 8,
};

export const STAGE3_STARS = {
  left: 78,
  top: 1.5,
  width: 20,
  height: 6.5,
};

export const STAGE3_CONFIRM = {
  left: 39,
  top: 91,
  width: 22,
  height: 6.5,
};

// button: the clickable cloud. text: the inner area the words must stay inside.
export const STAGE3_CLOUDS = [
  {
    id: 'left',
    button: { left: 2.6, top: 19.1, width: 40.8, height: 24.4 },
    text: { left: 7, top: 22.5, width: 31, height: 17 },
  },
  {
    id: 'right',
    button: { left: 59.8, top: 55.9, width: 32.5, height: 22.2 },
    text: { left: 62.5, top: 60, width: 27, height: 16 },
  },
];

const STAGE3_SKINS = new Set(['cat', 'cow', 'dog']);

export function stage3Photo(avatarId) {
  const skin = STAGE3_SKINS.has(avatarId) ? avatarId : 'cat';
  return `/assets/page9_${skin}.png`;
}
