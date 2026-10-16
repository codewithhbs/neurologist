const dayjs = require('dayjs');
const slugify = require('slugify');

// DHC + YYMM + Clinic short + running number, e.g. DHC2410S21001
const generateAppointmentCode = (clinicShortCode = 'S') => {
  const yymm = dayjs().format('YYMM');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `DHC${yymm}${clinicShortCode}${rand}`;
};

const makeSlug = (text) => slugify(text, { lower: true, strict: true });

const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

const toHHMM = (mins) => {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

module.exports = { generateAppointmentCode, makeSlug, toMinutes, toHHMM };
