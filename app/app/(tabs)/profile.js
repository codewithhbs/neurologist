import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import client from "../../src/api/client";
import { useAuth } from "../../src/context/AuthContext";
import GuestGate from "../../src/components/GuestGate";
import Button from "../../src/components/Button";
import { FamilyManager } from "../../src/components/FamilyMembers";
import { relationLabel } from "../../src/utils/family";

const API_BASE = process.env.EXPO_PUBLIC_API_URL
  ? process.env.EXPO_PUBLIC_API_URL.replace(/\/api\/?$/, "")
  : "https://api.drneerajkumarneurologist.com";

const TABS = [
  ["appointments", "Appts", "calendar-outline"],
  ["prescriptions", "Rx", "medkit-outline"],
  ["history", "History", "document-text-outline"],
  ["family", "Family", "people-outline"],
  ["edit", "Edit", "person-outline"],
];

const STATUS_STYLES = {
  pending: { bg: "bg-amber-50", text: "text-amber-700", dot: "#f59e0b" },
  confirmed: { bg: "bg-blue-50", text: "text-blue-700", dot: "#2563eb" },
  completed: { bg: "bg-green-50", text: "text-green-700", dot: "#16a34a" },
  cancelled: { bg: "bg-red-50", text: "text-red-700", dot: "#dc2626" },
  no_show: { bg: "bg-slate-100", text: "text-slate-600", dot: "#64748b" },
};

const STATUS_LABELS = {
  pending: "Pending Confirmation",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No Show",
};

const PAYMENT_LABELS = {
  not_required: "Free",
  pending: "Payment Pending",
  paid: "Paid",
  failed: "Payment Failed",
  refunded: "Refunded",
};

function to12h(t) {
  if (!t) return "";
  const m = String(t).match(/^(\d{1,2}):(\d{2})/);
  if (!m) return t;
  let h = +m[1];
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m[2]} ${ampm}`;
}

function prettyDate(iso) {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function resolveImg(url) {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `${API_BASE}/${url.replace(/^\/+/, "")}`;
}

export default function Profile() {
  const { isAuthenticated, isGuest, patient, logout, setPatient } = useAuth();

  if (!isAuthenticated) {
    return (
      <SafeAreaView
        style={{ flex: 1 }}
        className="flex-1 bg-white"
        edges={["top"]}
      >
        <View className="px-5 pt-4">
          <Text className="text-2xl font-extrabold text-slate-900">
            Profile
          </Text>
        </View>
        <GuestGate
          message={
            isGuest
              ? "You're browsing as a guest. Login to view your appointments and profile."
              : "Login to view your appointments and profile."
          }
        />
      </SafeAreaView>
    );
  }

  return (
    <PatientDashboard
      patient={patient}
      logout={logout}
      setPatient={setPatient}
    />
  );
}

function PatientDashboard({ patient, logout, setPatient }) {
  const [tab, setTab] = useState("appointments");
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [history, setHistory] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    const [a, p, h] = await Promise.all([
      client
        .get("/patients/appointments/my")
        .catch(() => ({ data: { appointments: [] } })),
      client
        .get("/patients/prescriptions")
        .catch(() => ({ data: { prescriptions: [] } })),
      client
        .get("/patients/medical-history")
        .catch(() => ({ data: { history: [] } })),
    ]);
    setAppointments(a.data.appointments || []);
    setPrescriptions(p.data.prescriptions || []);
    setHistory(h.data.history || []);
  };

  useEffect(() => {
    load();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  console.log(history[0]);

  const cancelAppointment = (id) => {
    Alert.alert(
      "Cancel Appointment",
      "Are you sure you want to cancel this appointment?",
      [
        { text: "No" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            try {
              await client.post(`/patients/appointments/${id}/cancel`, {});
              load();
              Toast.show({ type: "success", text1: "Appointment cancelled" });
            } catch (e) {
              Toast.show({ type: "error", text1: "Failed to cancel" });
            }
          },
        },
      ],
    );
  };

  const upcoming = appointments.filter((a) =>
    ["pending", "confirmed"].includes(a.status),
  );

  return (
    <SafeAreaView
      style={{ flex: 1 }}
      className="flex-1 bg-slate-50"
      edges={["top"]}
    >
      {/* HEADER */}
      <View className="bg-white px-5 pt-4 pb-4 border-b border-slate-100">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <View
              className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 items-center justify-center"
              style={{ backgroundColor: "#1D4ED8" }}
            >
              <Text className="text-white font-extrabold text-xl">
                {patient?.name?.[0]?.toUpperCase() || "P"}
              </Text>
            </View>
            <View>
              <Text className="font-extrabold text-slate-900 text-base">
                {patient?.name || "Patient"}
              </Text>
              <Text className="text-slate-500 text-xs mt-0.5">
                +91 {patient?.mobile}
              </Text>
            </View>
          </View>
          <Pressable
            onPress={logout}
            className="w-10 h-10 rounded-full bg-red-50 items-center justify-center"
          >
            <Ionicons name="log-out-outline" size={20} color="#dc2626" />
          </Pressable>
        </View>

        {upcoming.length > 0 && (
          <View className="flex-row items-center gap-2 mt-4 bg-blue-50 rounded-xl px-3 py-2.5">
            <Ionicons name="notifications" size={15} color="#1D4ED8" />
            <Text className="text-blue-700 text-xs font-semibold flex-1">
              You have {upcoming.length} upcoming appointment
              {upcoming.length > 1 ? "s" : ""}
            </Text>
          </View>
        )}
      </View>

      {/* TAB BAR */}
      <View className="px-5 pt-3 pb-2 bg-slate-50">
        <View className="flex-row bg-white rounded-2xl p-1 border border-slate-100">
          {TABS.map(([key, label, icon]) => {
            const active = tab === key;
            return (
              <Pressable
                key={key}
                onPress={() => setTab(key)}
                className={`flex-1 flex-row items-center justify-center gap-1 py-2.5 rounded-xl ${active ? "bg-[#1D4ED8]" : ""}`}
              >
                <Ionicons
                  name={icon}
                  size={14}
                  color={active ? "#fff" : "#64748b"}
                />
                <Text
                  className={`text-[11px] font-bold ${active ? "text-white" : "text-slate-500"}`}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <ScrollView
        className="px-5"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30, paddingTop: 6 }}
      >
        {tab === "appointments" && (
          <View className="gap-3">
            {appointments.length === 0 && (
              <EmptyState icon="calendar-outline" text="No appointments yet." />
            )}
            {appointments.map((a) => (
              <AppointmentCard
                key={a.id}
                appointment={a}
                onCancel={() => cancelAppointment(a.id)}
              />
            ))}
          </View>
        )}
        {tab === "prescriptions" && (
          <View className="gap-3">
            {prescriptions.length === 0 && (
              <EmptyState icon="medkit-outline" text="No prescriptions yet." />
            )}
            {prescriptions.map((p) => {
              const meds =
                typeof p.medicines_json === "string"
                  ? JSON.parse(p.medicines_json || "[]")
                  : p.medicines_json || [];
              const attachments =
                typeof p.attachment_urls === "string"
                  ? JSON.parse(p.attachment_urls || "[]")
                  : p.attachment_urls || [];

              return (
                <View
                  key={p.id}
                  className="bg-white border border-slate-100 rounded-2xl p-4"
                  style={cardShadow}
                >
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-row items-center gap-2">
                      <View className="w-8 h-8 rounded-lg bg-blue-50 items-center justify-center">
                        <Ionicons name="medkit" size={15} color="#1D4ED8" />
                      </View>
                      <View>
                        <Text className="font-bold text-slate-900 text-[13px]">
                          {prettyDate(p.prescribed_date)}
                        </Text>
                        {p.doctor_name && (
                          <Text className="text-slate-400 text-[11px]">
                            {p.doctor_name}
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>

                  {p.notes ? (
                    <Text className="text-slate-500 text-xs mb-2">
                      {p.notes}
                    </Text>
                  ) : null}

                  {meds.length > 0 && (
                    <View className="gap-2 mt-1">
                      {meds.map((m, i) => (
                        <View
                          key={i}
                          className="bg-slate-50 rounded-xl px-3 py-2.5"
                        >
                          <View className="flex-row items-center justify-between">
                            <Text className="font-bold text-slate-800 text-[13px]">
                              {m.name || "-"}
                            </Text>
                            <Text className="text-slate-500 text-[11px]">
                              {m.dosage ? `${m.dosage}` : ""}
                              {m.duration ? ` · ${m.duration}` : ""}
                            </Text>
                          </View>
                          {m.instructions ? (
                            <Text className="text-slate-500 text-[11px] mt-1">
                              {m.instructions}
                            </Text>
                          ) : null}
                        </View>
                      ))}
                    </View>
                  )}

                  {attachments.length > 0 && (
                    <View className="flex-row flex-wrap gap-2 mt-3">
                      {attachments.map((url, i) => (
                        <Pressable
                          key={i}
                          className="flex-row items-center gap-1.5 bg-blue-50 rounded-lg px-2.5 py-1.5"
                        >
                          <Ionicons name="attach" size={12} color="#1D4ED8" />
                          <Text className="text-[#1D4ED8] text-[11px] font-semibold">
                            Attachment {i + 1}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  )}

                  {p.pdf_url && (
                    <Pressable className="flex-row items-center gap-1.5 mt-3">
                      <Ionicons
                        name="document-attach"
                        size={14}
                        color="#1D4ED8"
                      />
                      <Text className="text-[#1D4ED8] text-xs font-semibold">
                        View prescription PDF
                      </Text>
                    </Pressable>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {tab === "history" && (
          <View className="gap-3">
            {history.length === 0 && (
              <EmptyState
                icon="document-text-outline"
                text="No medical history recorded."
              />
            )}
            {history.map((h) => {
              const attachments =
                typeof h.attachment_urls === "string"
                  ? JSON.parse(h.attachment_urls || "[]")
                  : h.attachment_urls || [];

              return (
                <View
                  key={h.id}
                  className="bg-white border border-slate-100 rounded-2xl p-4"
                  style={cardShadow}
                >
                  <View className="flex-row justify-between items-start mb-1.5">
                    <Text className="font-bold text-slate-900 flex-1">
                      {h.title?.trim() || "Visit Record"}
                    </Text>
                    <Text className="text-slate-400 text-[11px]">
                      {prettyDate(h.visit_date)}
                    </Text>
                  </View>

                  {h.doctor_name && (
                    <Text className="text-slate-500 text-xs mb-1">
                      {h.doctor_name}
                    </Text>
                  )}

                  {h.diagnosis?.trim() ? (
                    <Text className="text-slate-500 text-xs mt-1">
                      Diagnosis: {h.diagnosis}
                    </Text>
                  ) : null}

                  {h.treatment_notes?.trim() ? (
                    <Text className="text-slate-500 text-xs mt-1">
                      Treatment: {h.treatment_notes}
                    </Text>
                  ) : null}

                  {attachments.length > 0 && (
                    <View className="flex-row flex-wrap gap-2 mt-3">
                      {attachments.map((url, i) => (
                        <Image
                          key={i}
                          source={{ uri: url }}
                          style={{ width: 64, height: 64, borderRadius: 10 }}
                          resizeMode="cover"
                        />
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
        {tab === "family" && <FamilyManager />}
        {tab === "edit" && (
          <EditProfileForm patient={patient} setPatient={setPatient} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const cardShadow = {
  shadowColor: "#000",
  shadowOpacity: 0.04,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 2 },
  elevation: 1,
};

function AppointmentCard({ appointment: a, onCancel }) {
  const statusStyle = STATUS_STYLES[a.status] || STATUS_STYLES.no_show;
  const canCancel = ["pending", "confirmed"].includes(a.status);
  const isFree = Number(a.is_free) === 1;
  const photo = resolveImg(a.doctor_photo);

  return (
    <View
      className="bg-white border border-slate-100 rounded-2xl overflow-hidden"
      style={cardShadow}
    >
      {/* top status strip */}
      <View
        className={`flex-row items-center justify-between px-4 py-2.5 ${statusStyle.bg}`}
      >
        <View className="flex-row items-center gap-1.5">
          <View
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: statusStyle.dot }}
          />
          <Text className={`text-[11px] font-bold ${statusStyle.text}`}>
            {STATUS_LABELS[a.status] || a.status}
          </Text>
        </View>
        <Text className="text-[10.5px] text-slate-400 font-medium">
          {a.appointment_code}
        </Text>
      </View>

      <View className="p-4">
        <View className="flex-row gap-3">
          <View className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 items-center justify-center">
            {photo ? (
              <Image
                source={{ uri: photo }}
                style={{ width: 56, height: 56 }}
                resizeMode="cover"
              />
            ) : (
              <Ionicons name="person" size={22} color="#94a3b8" />
            )}
          </View>

          <View className="flex-1">
            {a.patient_name ? (
              <Text className="text-[11px] font-semibold text-violet-600 mb-0.5">
                For {a.patient_name}
                {a.patient_parent_id ? ` (${relationLabel(a.patient_relation)})` : " (Me)"}
              </Text>
            ) : null}
            <Text className="font-bold text-slate-900 text-[14.5px]">
              {a.doctor_name}
            </Text>
            <Text className="text-slate-500 text-xs mt-0.5">
              {a.service_name || "General Consultation"}
            </Text>

            <View className="flex-row items-center gap-1.5 mt-2">
              <Ionicons name="calendar-outline" size={12} color="#64748b" />
              <Text className="text-slate-600 text-[12px] font-medium">
                {prettyDate(a.appointment_date)}
              </Text>
            </View>
            <View className="flex-row items-center gap-1.5 mt-1">
              <Ionicons name="time-outline" size={12} color="#64748b" />
              <Text className="text-slate-600 text-[12px] font-medium">
                {to12h(a.start_time)} - {to12h(a.end_time)}
              </Text>
            </View>
          </View>
        </View>

        <View className="flex-row items-center gap-1.5 mt-3 pt-3 border-t border-slate-100">
          <Ionicons name="location-outline" size={12} color="#94a3b8" />
          <Text className="text-slate-400 text-[11px] flex-1" numberOfLines={1}>
            {a.clinic_name}
          </Text>
        </View>

        <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-slate-100">
          <View>
            <Text className="text-slate-400 text-[10px] uppercase font-semibold">
              {isFree
                ? "Amount"
                : PAYMENT_LABELS[a.payment_status] || a.payment_status}
            </Text>
            <Text className="text-slate-900 font-extrabold text-[15px] mt-0.5">
              {isFree ? "Free" : `₹${Number(a.final_amount || 0).toFixed(0)}`}
            </Text>
          </View>
          <View className="items-end">
            <Text className="text-slate-400 text-[10px] uppercase font-semibold">
              Payment
            </Text>
            <Text className="text-slate-600 text-[12px] font-semibold mt-0.5">
              {a.payment_method === "pay_at_clinic"
                ? "At Clinic"
                : formatWord(a.payment_method)}
            </Text>
          </View>
        </View>

        {a.cancelled_reason && (
          <View className="mt-3 bg-red-50 rounded-lg px-3 py-2">
            <Text className="text-red-600 text-[11px]">
              Cancelled: {a.cancelled_reason}
            </Text>
          </View>
        )}

        {canCancel && (
          <Pressable
            onPress={onCancel}
            className="mt-3 flex-row items-center justify-center gap-1.5 bg-red-50 rounded-xl py-2.5"
          >
            <Ionicons name="close-circle-outline" size={14} color="#dc2626" />
            <Text className="text-red-600 text-[12.5px] font-bold">
              Cancel Appointment
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function formatWord(v) {
  if (!v) return "-";
  return String(v).replace(/\b\w/g, (c) => c.toUpperCase());
}

function EmptyState({ icon, text }) {
  return (
    <View className="items-center mt-14">
      <View className="w-16 h-16 rounded-full bg-white border border-slate-100 items-center justify-center mb-3">
        <Ionicons name={icon} size={24} color="#94a3b8" />
      </View>
      <Text className="text-slate-400 text-sm">{text}</Text>
    </View>
  );
}

function EditProfileForm({ patient, setPatient }) {
  const [form, setForm] = useState({
    name: patient?.name || "",
    email: patient?.email || "",
    address: patient?.address || "",
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const res = await client.put("/patients/profile", form);
      setPatient(res.data.patient);
      Toast.show({ type: "success", text1: "Profile updated" });
    } catch (e) {
      Toast.show({ type: "error", text1: "Failed to update" });
    }
    setSaving(false);
  };

  return (
    <View
      className="bg-white border border-slate-100 rounded-2xl p-4 gap-4"
      style={cardShadow}
    >
      <View>
        <Text className="text-xs font-semibold text-slate-500 uppercase mb-1.5">
          Full Name
        </Text>
        <TextInput
          value={form.name}
          onChangeText={(t) => setForm({ ...form, name: t })}
          className="border border-slate-200 rounded-xl px-4 py-3 text-sm bg-slate-50"
        />
      </View>
      <View>
        <Text className="text-xs font-semibold text-slate-500 uppercase mb-1.5">
          Mobile Number
        </Text>
        <TextInput
          value={patient?.mobile}
          editable={false}
          className="border border-slate-200 rounded-xl px-4 py-3 text-sm bg-slate-100 text-slate-400"
        />
      </View>
      <View>
        <Text className="text-xs font-semibold text-slate-500 uppercase mb-1.5">
          Email
        </Text>
        <TextInput
          value={form.email}
          onChangeText={(t) => setForm({ ...form, email: t })}
          className="border border-slate-200 rounded-xl px-4 py-3 text-sm bg-slate-50"
          keyboardType="email-address"
        />
      </View>
      <View>
        <Text className="text-xs font-semibold text-slate-500 uppercase mb-1.5">
          Address
        </Text>
        <TextInput
          value={form.address}
          onChangeText={(t) => setForm({ ...form, address: t })}
          multiline
          numberOfLines={3}
          className="border border-slate-200 rounded-xl px-4 py-3 text-sm bg-slate-50"
        />
      </View>
      <Button label="Save Changes" onPress={save} loading={saving} />
    </View>
  );
}
