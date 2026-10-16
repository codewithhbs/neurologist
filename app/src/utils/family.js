export const RELATIONS = [
  ["spouse", "Spouse"],
  ["son", "Son"],
  ["daughter", "Daughter"],
  ["father", "Father"],
  ["mother", "Mother"],
  ["brother", "Brother"],
  ["sister", "Sister"],
  ["grandfather", "Grandfather"],
  ["grandmother", "Grandmother"],
  ["other", "Other"],
];
export const relationLabel = (r) => RELATIONS.find(([v]) => v === r)?.[1] || r || "";
export const ageFromDob = (dob) => {
  if (!dob) return null;
  const d = new Date(String(dob).slice(0, 10) + "T00:00:00");
  if (isNaN(d)) return null;
  const n = new Date();
  let a = n.getFullYear() - d.getFullYear();
  const m = n.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && n.getDate() < d.getDate())) a--;
  return a >= 0 ? a : null;
};
