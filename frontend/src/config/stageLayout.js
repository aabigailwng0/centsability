// Positions are percentages of the stage photo so overlays scale with it.
// Tune them with ?debug=1, which draws a box around each region.

const nameplate = {
  left: 2.85,
  top: 57.52,
  width: 17.65,
  height: 7.96,
  rotate: -6,
  fontSize: 2.6,
  patch: '#32343a',
};

export const NAMEPLATES = {
  1: nameplate,
  2: nameplate,
  3: nameplate,
  4: nameplate,
  5: nameplate,
  6: nameplate,
  10: nameplate,
};

export const STAGE4_NOTE = {
  left: 9,
  top: 63,
  width: 10,
  height: 16,
};

export const STAGE4_PANEL = {
  left: 27,
  top: 51,
  width: 46,
  height: 46,
};

// The empty white bar beside the star in the top right of every photo.
export const STAR_SLOT = {
  left: 85.5,
  top: 2.4,
  width: 13.5,
  height: 7.2,
};

export const STAGE_HOTSPOTS = {
  listen: { left: 39.1, top: 71.9, width: 18.9, height: 8.1 },
  continue: { left: 38.3, top: 71.9, width: 20.6, height: 8.1 },
  note: { left: 12, top: 64, width: 7, height: 12 },
  issue: { left: 30, top: 60, width: 40, height: 18 },
  answer: { left: 24, top: 54, width: 52, height: 32 },
  page4Continue: { left: 39, top: 81, width: 22, height: 6 },
};

export function stagePhoto(page, animal) {
  if (page === 1) return '/assets/page1_empty.png';
  return `/assets/page${page}_${animal}.png`;
}
