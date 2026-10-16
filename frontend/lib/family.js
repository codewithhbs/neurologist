export const RELATIONS = [
  { value: "spouse", label: "Spouse" },
  { value: "son", label: "Son" },
  { value: "daughter", label: "Daughter" },
  { value: "father", label: "Father" },
  { value: "mother", label: "Mother" },
  { value: "brother", label: "Brother" },
  { value: "sister", label: "Sister" },
  { value: "grandfather", label: "Grandfather" },
  { value: "grandmother", label: "Grandmother" },
  { value: "other", label: "Other" },
];

export const relationLabel = (r) =>
  RELATIONS.find((x) => x.value === r)?.label || (r ? r[0].toUpperCase() + r.slice(1) : "");

export const ageFromDob = (dob) => {
  if (!dob) return null;
  const d = new Date(String(dob).slice(0, 10) + "T00:00:00");
  if (isNaN(d)) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age >= 0 ? age : null;
};
