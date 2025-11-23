const STAFF_COLOR_PALETTE = [
  '#0EA5E9',
  '#22C55E',
  '#A855F7',
  '#F97316',
  '#E11D48'
];

function hashString(str) {
  if (!str) return 0;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

export function getStaffColor(staffId) {
  if (!staffId) return STAFF_COLOR_PALETTE[0];
  const hash = hashString(staffId);
  const index = hash % STAFF_COLOR_PALETTE.length;
  return STAFF_COLOR_PALETTE[index];
}

export function getAllStaffColors() {
  return [...STAFF_COLOR_PALETTE];
}

export function getStaffColorWithOpacity(staffId, opacity = 0.2) {
  const color = getStaffColor(staffId);
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}
