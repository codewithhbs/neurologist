import { useCallback, useEffect, useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import client from "../api/client";
import { useCountdown } from "./VisitTimer";
import { fmtDuration } from "../utils/visitTimer";

function LiveChip({ appt, onPress }) {
  const remaining = useCountdown(appt);
  const over = remaining !== null && remaining < 0;
  const warn = remaining !== null && remaining >= 0 && remaining <= 300;
  const color = over ? "#dc2626" : warn ? "#d97706" : "#15803d";
  return (
    <Pressable
      onPress={onPress}
      className={`mr-2 rounded-xl px-3 py-2 border ${over ? "bg-red-50 border-red-200" : warn ? "bg-amber-50 border-amber-200" : "bg-green-50 border-green-200"}`}
      style={{ minWidth: 120 }}
    >
      <Text className="text-xs font-semibold text-slate-800" numberOfLines={1}>
        {appt.patient_name || "Patient"}
      </Text>
      <Text className="text-[10px] text-slate-500" numberOfLines={1}>
        Dr. {appt.doctor_name}
      </Text>
      <Text className="font-extrabold text-base mt-0.5" style={{ color, fontVariant: ["tabular-nums"] }}>
        {remaining === null ? "--:--" : over ? `+${fmtDuration(-remaining)}` : fmtDuration(remaining)}
      </Text>
    </Pressable>
  );
}

/** "In clinic now" strip — patients currently IN with live countdown. refreshKey forces reload. */
export default function InClinicNow({ refreshKey, onOpen }) {
  const [list, setList] = useState([]);

  const load = useCallback(async () => {
    try {
      const res = await client.get("/admin/appointments/in-clinic/live");
      setList(res.data.appointments || []);
    } catch (e) {
      setList([]);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 60000); // resync every minute
    return () => clearInterval(t);
  }, [load, refreshKey]);

  if (!list.length) return null;

  return (
    <View className="bg-white border-b border-slate-100 px-4 pt-3 pb-3">
      <View className="flex-row items-center gap-1.5 mb-2">
        <Ionicons name="pulse" size={14} color="#16a34a" />
        <Text className="text-xs font-bold text-slate-800">
          In clinic now ({list.length})
        </Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {list.map((a) => (
          <LiveChip key={a.id} appt={a} onPress={() => onOpen?.(a)} />
        ))}
      </ScrollView>
    </View>
  );
}
