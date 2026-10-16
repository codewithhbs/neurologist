import { useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Modal,
  RefreshControl,
  FlatList,
  Linking,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import client from "../../src/api/client";
import { useAuth } from "../../src/context/AuthContext";
import AppHeader from "../../src/components/AppHeader";
import Screen from "../../src/components/Screen";
import VisitTimer from "../../src/components/VisitTimer";
import InClinicNow from "../../src/components/InClinicNow";

const STATUS_STYLES = {
  pending: { bg: "bg-amber-50", text: "text-amber-700", dot: "#f59e0b" },
  confirmed: { bg: "bg-blue-50", text: "text-blue-700", dot: "#2563eb" },
  completed: { bg: "bg-green-50", text: "text-green-700", dot: "#16a34a" },
  cancelled: { bg: "bg-red-50", text: "text-red-700", dot: "#dc2626" },
  no_show: { bg: "bg-slate-100", text: "text-slate-600", dot: "#64748b" },
};

const STATUS_LABELS = {
  pending: "Pending",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No Show",
};

function todayStr() {
  const d = new Date();
  return d.toISOString().split("T")[0];
}

function addDays(dateStr, n) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

function normalizeMobile(mobile) {
  if (!mobile) return "";
  let n = String(mobile).replace(/\D/g, "");
  if (n.length === 10) n = `91${n}`;
  return n;
}

export default function ReceptionBookings() {
  const router = useRouter();
  const { staff } = useAuth();
  const [date, setDate] = useState(todayStr());
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [payModal, setPayModal] = useState(null);
  const [reminderLoadingId, setReminderLoadingId] = useState(null);
  const [liveKey, setLiveKey] = useState(0);

  // IN / OUT / timer change -> patch row in place + refresh "in clinic" strip
  const onVisitUpdated = (updated) => {
    if (!updated) return;
    setAppointments((list) =>
      list.map((x) =>
        x.id === updated.id && x.patient_type !== "old" ? { ...x, ...updated } : x,
      ),
    );
    setLiveKey((k) => k + 1);
  };

  const load = useCallback(
    async (d = date) => {
      try {
        const res = await client.get("/admin/appointments", {
          params: { date: d },
        });
        setAppointments(res.data.appointments || []);
      } catch (e) {
        Toast.show({ type: "error", text1: "Failed to load appointments" });
      }
      setLoading(false);
      setRefreshing(false);
    },
    [date],
  );

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load(date);
    }, [date]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    setLiveKey((k) => k + 1);
    load(date);
  };

  const changeDate = (n) => {
    setLoading(true);
    setDate((d) => addDays(d, n));
  };

  const updateStatus = async (id, status) => {
    try {
      await client.put(`/admin/appointments/${id}/status`, { status });
      Toast.show({ type: "success", text1: `Marked ${status}` });
      load(date);
    } catch (e) {
      Toast.show({
        type: "error",
        text1: e.response?.data?.message || "Failed to update",
      });
    }
  };

  const collectPayment = async (id, method) => {
    setPayModal(null);
    try {
      await client.post(`/admin/appointments/${id}/collect-payment`, {
        method,
      });
      Toast.show({ type: "success", text1: "Payment collected" });
      load(date);
    } catch (e) {
      Toast.show({
        type: "error",
        text1: e.response?.data?.message || "Failed to collect payment",
      });
    }
  };

  const sendReminder = async (id) => {
    setReminderLoadingId(id);
    try {
      await client.post(`/admin/appointments/${id}/send-reminder`);
      Toast.show({ type: "success", text1: "Reminder sent" });
    } catch (e) {
      Toast.show({
        type: "error",
        text1: e.response?.data?.message || "Failed to send reminder",
      });
    }
    setReminderLoadingId(null);
  };

  const openWhatsapp = (mobile) => {
    const num = normalizeMobile(mobile);
    if (!num) {
      Toast.show({ type: "error", text1: "No mobile number" });
      return;
    }
    Linking.openURL(`https://wa.me/${num}`).catch(() => {
      Toast.show({ type: "error", text1: "WhatsApp not available" });
    });
  };

  const renderItem = ({ item: a }) => {
    const expanded = expandedId === a.id;
    const statusStyle = STATUS_STYLES[a.status] || STATUS_STYLES.no_show;
    const isLocked = ["completed", "cancelled"].includes(a.status);

    return (
      <Pressable
        onPress={() => setExpandedId(expanded ? null : a.id)}
        className="bg-white rounded-2xl border border-slate-100 overflow-hidden mb-3"
        style={cardShadow}
      >
        <View
          className={`flex-row items-center justify-between px-4 py-2 ${statusStyle.bg}`}
        >
          <View className="flex-row items-center gap-1.5">
            <View
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: statusStyle.dot }}
            />
            <Text
              className={`text-[10.5px] font-bold uppercase ${statusStyle.text}`}
            >
              {STATUS_LABELS[a.status] || a.status}
            </Text>
          </View>
          <View
            className={`px-2 py-0.5 rounded-full ${a.payment_status === "paid" ? "bg-green-100" : a.payment_status === "not_required" ? "bg-slate-100" : "bg-red-100"}`}
          >
            <Text className="text-[10px] font-bold uppercase">
              {a.payment_status === "not_required" ? "free" : a.payment_status}
            </Text>
          </View>
        </View>

        <View className="p-4">
          <View className="flex-row justify-between items-start">
            <View className="flex-1 pr-2">
              <Text className="font-bold text-slate-900">
                {a.patient_name || "Unnamed"}
                {a.patient_parent_id ? (
                  <Text className="text-violet-600 text-xs font-semibold">
                    {"  "}({a.patient_relation || "family"})
                  </Text>
                ) : null}
              </Text>
              <Text className="text-slate-400 text-xs mt-0.5">
                {a.patient_mobile}
              </Text>
              <Text className="text-slate-600 text-xs mt-1">
                {a.service_name || "General"} • Dr. {a.doctor_name}
              </Text>
              <Text className="text-slate-500 text-xs mt-0.5">
                {a.start_time?.slice(0, 5)} - {a.end_time?.slice(0, 5)}
              </Text>
            </View>
            <Text className="font-extrabold text-brand-700 text-base">
              ₹{a.final_amount}
            </Text>
          </View>

          {(date === todayStr() || a.checked_in_at) && (
            <View className="mt-3">
              <VisitTimer appt={a} compact onUpdated={onVisitUpdated} />
            </View>
          )}

          <View className="flex-row items-center gap-2 mt-3">
            <Pressable
              onPress={() => openWhatsapp(a.patient_mobile)}
              className="flex-row items-center gap-1.5 bg-green-50 rounded-lg px-3 py-1.5"
            >
              <Ionicons name="logo-whatsapp" size={14} color="#16a34a" />
              <Text className="text-green-700 text-[11px] font-semibold">
                WhatsApp
              </Text>
            </Pressable>

            <Pressable
              onPress={() => sendReminder(a.id)}
              disabled={reminderLoadingId === a.id}
              className="flex-row items-center gap-1.5 bg-blue-50 rounded-lg px-3 py-1.5"
            >
              {reminderLoadingId === a.id ? (
                <ActivityIndicator size={12} color="#1d4ed8" />
              ) : (
                <Ionicons
                  name="notifications-outline"
                  size={14}
                  color="#1d4ed8"
                />
              )}
              <Text className="text-blue-700 text-[11px] font-semibold">
                Send Reminder
              </Text>
            </Pressable>
          </View>

          {expanded && (
            <View
              className="mt-4 pt-4 border-t border-slate-100"
              style={{ gap: 8 }}
            >
              <Pressable
                onPress={() => router.push(`/appointment/${a.id}`)}
                className="flex-row items-center justify-center gap-2 bg-slate-100 rounded-xl py-2.5 mb-1"
              >
                <Ionicons name="document-text" size={15} color="#334155" />
                <Text className="text-xs font-semibold text-slate-700">
                  View Complete Details
                </Text>
              </Pressable>

              {!isLocked && (
                <View className="flex-row flex-wrap gap-2">
                  {a.status !== "confirmed" && (
                    <ActionChip
                      label="Confirm"
                      icon="checkmark"
                      onPress={() => updateStatus(a.id, "confirmed")}
                    />
                  )}
                  <ActionChip
                    label="Complete"
                    icon="checkmark-done"
                    onPress={() => updateStatus(a.id, "completed")}
                  />
                  <ActionChip
                    label="No-show"
                    icon="alert-circle"
                    onPress={() => updateStatus(a.id, "no_show")}
                  />
                  <ActionChip
                    label="Cancel"
                    icon="close-circle"
                    danger
                    onPress={() => updateStatus(a.id, "cancelled")}
                  />
                </View>
              )}

              {a.payment_status !== "paid" &&
                a.payment_status !== "not_required" && (
                  <Pressable
                    onPress={() => setPayModal(a.id)}
                    className="mt-1 bg-brand-600 rounded-xl py-2.5 items-center flex-row justify-center gap-2"
                  >
                    <Ionicons name="cash" size={16} color="#fff" />
                    <Text className="text-white font-semibold text-xs">
                      Collect Payment at Clinic
                    </Text>
                  </Pressable>
                )}
            </View>
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <Screen scroll={false} className="bg-slate-50">
      <AppHeader
        title="Front Desk"
        subtitle={staff?.clinic_name || "All bookings"}
        showBack={false}
      />

      <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-slate-100">
        <Pressable
          onPress={() => changeDate(-1)}
          className="w-9 h-9 rounded-full bg-slate-100 items-center justify-center"
        >
          <Ionicons name="chevron-back" size={18} color="#334155" />
        </Pressable>
        <Text className="font-bold text-slate-900">
          {date === todayStr() ? "Today" : date}
        </Text>
        <Pressable
          onPress={() => changeDate(1)}
          className="w-9 h-9 rounded-full bg-slate-100 items-center justify-center"
        >
          <Ionicons name="chevron-forward" size={18} color="#334155" />
        </Pressable>
      </View>

      <InClinicNow
        refreshKey={liveKey}
        onOpen={(a) => router.push(`/appointment/${a.id}`)}
      />

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#1d4ed8" />
        </View>
      ) : (
        <FlatList
          data={appointments}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: 40,
            flexGrow: 1,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#1d4ed8"]}
            />
          }
          ListEmptyComponent={
            <Text className="text-slate-400 text-sm text-center mt-10">
              No appointments for this day.
            </Text>
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      <Modal
        visible={!!payModal}
        transparent
        animationType="fade"
        onRequestClose={() => setPayModal(null)}
      >
        <View className="flex-1 bg-black/40 items-center justify-center px-8">
          <View className="bg-white rounded-2xl p-5 w-full">
            <Text className="font-bold text-slate-900 mb-4 text-center">
              How was payment collected?
            </Text>
            {["cash", "card", "upi"].map((m) => (
              <Pressable
                key={m}
                onPress={() => collectPayment(payModal, m)}
                className="flex-row items-center gap-3 py-3 border-b border-slate-100"
              >
                <Ionicons
                  name={
                    m === "cash" ? "cash" : m === "card" ? "card" : "qr-code"
                  }
                  size={18}
                  color="#1d4ed8"
                />
                <Text className="text-slate-800 font-medium capitalize">
                  {m}
                </Text>
              </Pressable>
            ))}
            <Pressable
              onPress={() => setPayModal(null)}
              className="pt-4 items-center"
            >
              <Text className="text-slate-400 text-sm">Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const cardShadow = {
  shadowColor: "#000",
  shadowOpacity: 0.04,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 2 },
  elevation: 1,
};

function ActionChip({ label, icon, onPress, danger }) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center gap-1.5 px-3 py-2 rounded-xl ${danger ? "bg-red-50" : "bg-slate-100"}`}
    >
      <Ionicons name={icon} size={14} color={danger ? "#dc2626" : "#334155"} />
      <Text
        className={`text-xs font-semibold ${danger ? "text-red-600" : "text-slate-700"}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
