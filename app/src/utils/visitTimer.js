// Visit (IN/OUT) timer helpers. Backend stores IST wall-clock "YYYY-MM-DD HH:mm:ss".

export const parseIST = (str) => {
  if (!str) return null;
  const s = String(str).replace("T", " ").slice(0, 19).replace(" ", "T");
  const d = new Date(`${s}+05:30`);
  return isNaN(d.getTime()) ? null : d;
};

export const fmtClock = (str) => {
  const d = parseIST(str);
  if (!d) return "--";
  // show IST wall-clock regardless of device timezone
  const hhmm = String(str).replace("T", " ").slice(11, 16);
  let [h, m] = hhmm.split(":").map(Number);
  const ap = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${String(m).padStart(2, "0")} ${ap}`;
};

export const fmtDuration = (totalSec) => {
  const neg = totalSec < 0;
  let s = Math.abs(Math.round(totalSec));
  const h = Math.floor(s / 3600);
  s -= h * 3600;
  const m = Math.floor(s / 60);
  const sec = s - m * 60;
  const core = h
    ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
    : `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return neg ? `-${core}` : core;
};

export const visitState = (a) => {
  if (!a) return "not_arrived";
  if (a.checked_out_at) return "out";
  if (a.checked_in_at) return "in";
  return "not_arrived";
};

/**
 * Device-clock timestamp (ms) when the timer ends.
 * Prefers server-computed remaining_seconds (immune to phone clock skew),
 * falls back to checked_in_at + timer_minutes.
 */
export const timerEndsAtMs = (a, receivedAtMs = Date.now()) => {
  if (!a?.checked_in_at) return null;
  if (a.visit && typeof a.visit.remaining_seconds === "number" && a.visit.state === "in") {
    return receivedAtMs + a.visit.remaining_seconds * 1000;
  }
  const inAt = parseIST(a.checked_in_at);
  if (!inAt) return null;
  return inAt.getTime() + (parseInt(a.timer_minutes, 10) || 40) * 60000;
};

export const TIMER_PRESETS = [20, 30, 40, 45, 60];
