// End-of-day overlay positions, as percentages of the page 11 photo (2200 by 1400).
// Tune them with ?debug=1. The same boxes fit page11_cat.png, page11_cow.png, and page11_dog.png.

const AVATARS = new Set(['cat', 'cow', 'dog']);

export function dayEndPhoto(avatarId) {
  const id = AVATARS.has(avatarId) ? avatarId : 'cat';
  return `/assets/page11_${id}.png`;
}

export const DAY_STARS = {
  left: 78,
  top: 1.5,
  width: 20,
  height: 6.5,
};

export const DAY_STRONG = {
  left: 6.5,
  top: 34,
  width: 30,
  height: 43,
};

export const DAY_WEAK = {
  left: 64.2,
  top: 34,
  width: 29,
  height: 43,
};

export const DAY_NEXT = {
  left: 39,
  top: 88.5,
  width: 22,
  height: 6.5,
};
