// Avatar art lives under /public/assets/avatars. To swap in real Figma art,
// replace the files (keep the same names) or update the `src` values here.
export const AVATARS = Array.from({ length: 6 }, (_, i) => ({
  id: i + 1,
  label: `Avatar ${i + 1}`,
  src: `/assets/avatars/avatar-${i + 1}.svg`,
}));

export const NICKNAME_MAX_LENGTH = 15;
