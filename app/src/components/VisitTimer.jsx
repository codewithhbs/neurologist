import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  TextInput,
  ActivityIndicator,
  Vibration,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import client from "../api/client";
import {
  fmtClock,
  fmtDuration,
  visitState,
  timerEndsAtMs,
  TIMER_PRESETS,
} from "../utils/visitTimer";

let cachedDefault = null;
async function getDefaultMinutes() {
  if (cachedDefault) return cachedDefault;
  try {
    const res = await client.get("/admin/visit-timer/settings");
    cachedDefault = parseInt(res.data.default_minutes, 10) || 40;
  } catch (e) {
    cachedDefault = 40;
  }
  return cachedDefault;
}

/** live countdown hook: returns remaining seconds (negative = overtime) */
export function useCountdown(appt) {
  const receivedAt = useRef(Date.now());
  const [now, setNow] = useState(Date.now());
  const state = visitState(appt);

  useEffect(() => {
    receivedAt.current = Date.now();
  }, [appt?.checked_in_at, appt?.timer_minutes, appt?.visit?.server_now]);

  useEffect(() => {
    if (state !== "in") return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [state]);

  if (state !== "in") return null;
  const ends = timerEndsAtMs(appt, receivedAt.current);
  if (!ends) return null;
  return Math.round((ends - now) / 1000);
}

/** Duration picker shown when receptionist presses IN */
function StartTimerModal({ visible, onClose, onStart, loading }) {
  const [minutes, setMinutes] = useState(40);
  const [custom, setCustom] = useState("");

  useEffect(() => {
    if (!visible) return;
    setCustom("");
    getDefaultMinutes().then(setMinutes);
  }, [visible]);

  const value = custom ? parseInt(custom, 10) : minutes;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-black/40 items-center justify-center px-6">
        <View className="bg-white rounded-2xl p-5 w-full">
          <View className="items-center mb-4">
            <View className="w-12 h-12 rounded-full bg-green-100 items-center justify-center mb-2">
              <Ionicons name="log-in" size={22} color="#16a34a" />
            </View>
            <Text className="font-bold text-slate-900 text-base">Patient IN</Text>
            <Text className="text-slate-500 text-xs mt-1">Set the visit timer</Text>
          </View>

          <View className="flex-row flex-wrap justify-center gap-2">
            {TIMER_PRESETS.map((m) => {
              const active = !custom && minutes === m;
              return (
                <Pressable
                  key={m}
                  onPress={() => {
                    setCustom("");
                    setMinutes(m);
                  }}
                  className={`px-4 py-2 rounded-xl border ${active ? "bg-brand-600 border-brand-600" : "bg-white border-slate-200"}`}
                >
                  <Text className={`font-semibold text-sm ${active ? "text-white" : "text-slate-700"}`}>
                    {m} min
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View className="flex-row items-center gap-2 mt-4">
            <Text className="text-slate-600 text-xs">Custom:</Text>
            <TextInput
              value={custom}
              onChangeText={(t) => setCustom(t.replace(/\D/g, "").slice(0, 3))}
              keyboardType="number-pad"
              placeholder="minutes"
              placeholderTextColor="#94a3b8"
              className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
            />
          </View>

          <Pressable
            disabled={loading || !(value > 0)}
            onPress={() => onStart(value)}
            className={`mt-5 rounded-xl py-3 items-center flex-row justify-center gap-2 ${loading || !(value > 0) ? "bg-green-300" : "bg-green-600"}`}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Ionicons name="play" size={16} color="#fff" />
            )}
            <Text className="text-white font-bold">
              Start {value > 0 ? `${value} min` : ""} timer
            </Text>
          </Pressable>
          <Pressable onPress={onClose} className="pt-4 items-center">
            <Text className="text-slate-400 text-sm">Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

/**
 * IN / OUT control + live timer for one appointment.
 *  appt       : appointment row (needs id, status, checked_in_at, checked_out_at, timer_minutes)
 *  onUpdated  : (updatedAppointment) => void
 *  compact    : smaller layout for list cards
 */
export default function VisitTimer({ appt, onUpdated, compact = false }) {
  const [busy, setBusy] = useState(null);
  const [startModal, setStartModal] = useState(false);
  const remaining = useCountdown(appt);
  const buzzed = useRef(false);
  const state = visitState(appt);

  // one vibration when time is over
  useEffect(() => {
    if (remaining === null) {
      buzzed.current = false;
      return;
    }
    if (remaining <= 0 && !buzzed.current) {
      buzzed.current = true;
      Vibration.vibrate([0, 400, 200, 400]);
      Toast.show({
        type: "info",
        text1: `⏰ Time over — ${appt.patient_name || "patient"}`,
        text2: "Visit timer finished",
      });
    }
    if (remaining > 0) buzzed.current = false;
  }, [remaining, appt?.patient_name]);

  if (appt?.patient_type === "old") return null; // backdated table, no live visit
  if (appt?.status === "cancelled" && state === "not_arrived") return null;

  const call = async (key, fn, okMsg) => {
    setBusy(key);
    try {
      const res = await fn();
      Toast.show({ type: "success", text1: res.data.message || okMsg });
      onUpdated?.(res.data.appointment);
    } catch (e) {
      Toast.show({ type: "error", text1: e.response?.data?.message || "Action failed" });
      if (e.response?.data?.appointment) onUpdated?.(e.response.data.appointment);
    }
    setBusy(null);
  };

  const checkIn = (minutes) =>
    call("in", () => client.post(`/admin/appointments/${appt.id}/check-in`, { timer_minutes: minutes }), "Patient IN").then(
      () => setStartModal(false),
    );

  const checkOut = () =>
    Alert.alert("Patient OUT?", `${appt.patient_name || "Patient"} is leaving now.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "OUT",
        style: "destructive",
        onPress: () => call("out", () => client.post(`/admin/appointments/${appt.id}/check-out`), "Patient OUT"),
      },
    ]);

  const extend = (mins) =>
    call("ext", () => client.put(`/admin/appointments/${appt.id}/timer`, { add_minutes: mins }), "Timer updated");

  const undo = () =>
    Alert.alert("Undo IN?", "Timer will be removed for this appointment.", [
      { text: "No", style: "cancel" },
      {
        text: "Undo",
        style: "destructive",
        onPress: () => call("undo", () => client.post(`/admin/appointments/${appt.id}/undo-check-in`), "Undone"),
      },
    ]);

  // ---------- NOT ARRIVED ----------
  if (state === "not_arrived") {
    return (
      <>
        <Pressable
          onPress={() => setStartModal(true)}
          className={`flex-row items-center justify-center gap-2 bg-green-600 rounded-xl ${compact ? "py-2 px-3" : "py-3"}`}
        >
          <Ionicons name="log-in-outline" size={compact ? 15 : 18} color="#fff" />
          <Text className={`text-white font-bold ${compact ? "text-xs" : "text-sm"}`}>IN — Start timer</Text>
        </Pressable>
        <StartTimerModal
          visible={startModal}
          loading={busy === "in"}
          onClose={() => setStartModal(false)}
          onStart={checkIn}
        />
      </>
    );
  }

  // ---------- OUT (done) ----------
  if (state === "out") {
    return (
      <View className={`rounded-xl bg-slate-50 border border-slate-100 ${compact ? "px-3 py-2" : "p-3"}`}>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-1.5">
            <Ionicons name="log-in" size={13} color="#16a34a" />
            <Text className="text-xs text-slate-700">
              IN <Text className="font-bold">{fmtClock(appt.checked_in_at)}</Text>
            </Text>
          </View>
          <View className="flex-row items-center gap-1.5">
            <Ionicons name="log-out" size={13} color="#dc2626" />
            <Text className="text-xs text-slate-700">
              OUT <Text className="font-bold">{fmtClock(appt.checked_out_at)}</Text>
            </Text>
          </View>
          <Text className="text-xs font-bold text-slate-900">
            {appt.visit_duration_minutes ?? "--"} min
          </Text>
        </View>
        {!compact && appt.timer_minutes ? (
          <Text className="text-[11px] text-slate-400 mt-1.5">
            Timer was {appt.timer_minutes} min
            {appt.visit_duration_minutes > appt.timer_minutes
              ? ` · ${appt.visit_duration_minutes - appt.timer_minutes} min overtime`
              : ""}
          </Text>
        ) : null}
      </View>
    );
  }

  // ---------- IN (timer running) ----------
  const total = (parseInt(appt.timer_minutes, 10) || 40) * 60;
  const over = remaining !== null && remaining < 0;
  const warn = remaining !== null && remaining >= 0 && remaining <= 300;
  const pct = remaining === null ? 0 : Math.min(1, Math.max(0, (total - remaining) / total));
  const color = over ? "#dc2626" : warn ? "#f59e0b" : "#16a34a";

  return (
    <View
      className={`rounded-2xl border ${over ? "bg-red-50 border-red-200" : warn ? "bg-amber-50 border-amber-200" : "bg-green-50 border-green-200"} ${compact ? "p-3" : "p-4"}`}
    >
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-[10.5px] font-bold uppercase" style={{ color }}>
            {over ? "Overtime" : "Time left"}
          </Text>
          <Text
            className={`font-extrabold ${compact ? "text-2xl" : "text-4xl"}`}
            style={{ color, fontVariant: ["tabular-nums"] }}
          >
            {remaining === null ? "--:--" : over ? `+${fmtDuration(-remaining)}` : fmtDuration(remaining)}
          </Text>
        </View>
        <View className="items-end">
          <Text className="text-[11px] text-slate-500">IN at</Text>
          <Text className="text-sm font-bold text-slate-800">{fmtClock(appt.checked_in_at)}</Text>
          <Text className="text-[11px] text-slate-500 mt-0.5">{appt.timer_minutes} min timer</Text>
        </View>
      </View>

      <View className="h-2 rounded-full bg-white mt-3 overflow-hidden">
        <View style={{ width: `${pct * 100}%`, backgroundColor: color, height: "100%" }} />
      </View>

      <View className="flex-row items-center gap-2 mt-3">
        <Pressable
          onPress={() => extend(10)}
          disabled={!!busy}
          className="flex-row items-center gap-1 bg-white border border-slate-200 rounded-xl px-3 py-2"
        >
          {busy === "ext" ? (
            <ActivityIndicator size={12} color="#334155" />
          ) : (
            <Ionicons name="add" size={14} color="#334155" />
          )}
          <Text className="text-xs font-semibold text-slate-700">10 min</Text>
        </Pressable>
        {!compact && (
          <Pressable
            onPress={() => extend(-5)}
            disabled={!!busy || (parseInt(appt.timer_minutes, 10) || 0) <= 5}
            className="flex-row items-center gap-1 bg-white border border-slate-200 rounded-xl px-3 py-2"
          >
            <Ionicons name="remove" size={14} color="#334155" />
            <Text className="text-xs font-semibold text-slate-700">5 min</Text>
          </Pressable>
        )}
        <Pressable
          onPress={checkOut}
          disabled={!!busy}
          className="flex-1 flex-row items-center justify-center gap-1.5 bg-red-600 rounded-xl py-2"
        >
          {busy === "out" ? (
            <ActivityIndicator size={12} color="#fff" />
          ) : (
            <Ionicons name="log-out-outline" size={15} color="#fff" />
          )}
          <Text className="text-white text-xs font-bold">OUT</Text>
        </Pressable>
      </View>

      {!compact && (
        <Pressable onPress={undo} disabled={!!busy} className="items-center mt-3">
          <Text className="text-[11px] text-slate-400 underline">Pressed IN by mistake? Undo</Text>
        </Pressable>
      )}
    </View>
  );
}
