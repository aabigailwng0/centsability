// Stage 2 overlay positions, as percentages of the page 7 / page 8 photo.
// Tune them with ?debug=1. Page 7 and page 8 are 2200 by 1400.

export const STAGE2_NOTE = {
  left: 40,
  top: 66,
  width: 8,
  height: 12,
};

export const STAGE2_TITLE = {
  left: 2,
  top: 2,
  width: 48,
  height: 7,
};

export const STAGE2_STARS = {
  left: 78,
  top: 1.5,
  width: 20,
  height: 6.5,
};

export const STAGE2_SUBMIT = {
  left: 39,
  top: 91,
  width: 22,
  height: 6.5,
};

// button: the clickable cloud. text: the inner area the words must stay inside.
export const STAGE2_CLOUDS = [
  {
    id: 'top-left',
    button: { left: 8, top: 27, width: 35, height: 23 },
    text: { left: 11, top: 31, width: 28, height: 15 },
  },
  {
    id: 'top-right',
    button: { left: 57, top: 19, width: 30, height: 22 },
    text: { left: 59.5, top: 24.5, width: 24, height: 13 },
  },
  {
    id: 'mid-right',
    button: { left: 75, top: 45, width: 22, height: 16 },
    text: { left: 77, top: 48.5, width: 17, height: 10.5 },
  },
  {
    id: 'bottom-left',
    button: { left: 1.5, top: 59, width: 31, height: 19 },
    text: { left: 4, top: 62, width: 24, height: 13 },
  },
  {
    id: 'bottom-right',
    button: { left: 61, top: 65, width: 27, height: 22 },
    text: { left: 63.5, top: 69.5, width: 20, height: 13 },
  },
];

const STAGE2_SKINS = new Set(['cat', 'cow', 'dog']);

// Page 7 and page 8 are one file per player avatar: page7_cat.png, page8_dog.png, and so on.
export function stage2Photo(page, avatarId) {
  const skin = STAGE2_SKINS.has(avatarId) ? avatarId : 'cat';
  return `/assets/page${page}_${skin}.png`;
}
