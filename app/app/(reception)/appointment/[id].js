import { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Linking,
  ScrollView,
  ActivityIndicator,
  Modal,
  Image,
} from "react-native";
import { useLocalSearchParams, useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import client from "../../../src/api/client";
import AppHeader from "../../../src/components/AppHeader";
import Screen from "../../../src/components/Screen";
import Button from "../../../src/components/Button";
import VisitTimer from "../../../src/components/VisitTimer";
import {
  HistoryForm,
  PrescriptionForm,
} from "../../../src/components/MedicalForms";

const STATUS_COLORS = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  no_show: "bg-slate-200 text-slate-600",
};

export default function AppointmentDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [form, setForm] = useState(null); // 'history' | 'prescription' | null
  const [payModal, setPayModal] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await client.get(`/admin/appointments/${id}`);
      setData(res.data);
      setNameInput(res.data.appointment.patient_name || "");
    } catch (e) {
      Toast.show({ type: "error", text1: "Failed to load appointment" });
    }
    setLoading(false);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load]),
  );

  const saveName = async () => {
    if (!nameInput.trim()) {
      Toast.show({ type: "error", text1: "Name cannot be empty" });
      return;
    }
    setSavingName(true);
    try {
      await client.put(`/admin/patients/${data.appointment.patient_id}`, {
        name: nameInput.trim(),
      });
      Toast.show({ type: "success", text1: "Patient name updated" });
      setEditingName(false);
      load();
    } catch (e) {
      Toast.show({ type: "error", text1: "Failed to update name" });
    }
    setSavingName(false);
  };

  const updateStatus = async (status) => {
    try {
      await client.put(`/admin/appointments/${id}/status`, { status });
      Toast.show({ type: "success", text1: `Marked ${status}` });
      load();
    } catch (e) {
      Toast.show({
        type: "error",
        text1: e.response?.data?.message || "Failed to update",
      });
    }
  };

  const collectPayment = async (method) => {
    setPayModal(false);
    try {
      await client.post(`/admin/appointments/${id}/collect-payment`, {
        method,
      });
      Toast.show({ type: "success", text1: "Payment collected" });
      load();
    } catch (e) {
      Toast.show({
        type: "error",
        text1: e.response?.data?.message || "Failed to collect payment",
      });
    }
  };
  if (loading || !data) {
    return (
      <Screen scroll={false} className="bg-slate-50">
        <AppHeader title="Appointment" showBack />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#1d4ed8" />
        </View>
      </Screen>
    );
  }

  const { appointment: a, payments, prescriptions, history } = data;

  return (
    <Screen className="bg-slate-50">
      <AppHeader title={a.appointment_code} subtitle={a.clinic_name} showBack />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>
        {/* Visit IN / OUT timer */}
        {a.patient_type !== "old" && (
          <View className="bg-white rounded-2xl border border-slate-100 p-4 mb-3">
            <View className="flex-row items-center gap-1.5 mb-3">
              <Ionicons name="timer-outline" size={15} color="#1d4ed8" />
              <Text className="font-bold text-slate-900 text-sm">Visit In / Out</Text>
            </View>
            <VisitTimer
              appt={a}
              onUpdated={(updated) =>
                updated &&
                setData((d) => ({ ...d, appointment: { ...d.appointment, ...updated } }))
              }
            />
          </View>
        )}

        {/* Patient card */}
        <View className="bg-white rounded-2xl border border-slate-100 p-4 mb-3">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="font-bold text-slate-900 text-sm">Patient</Text>
            {!editingName && (
              <Pressable
                onPress={() => setEditingName(true)}
                className="flex-row items-center gap-1"
              >
                <Ionicons name="pencil" size={13} color="#1d4ed8" />
                <Text className="text-brand-600 text-xs font-semibold">
                  Edit Name
                </Text>
              </Pressable>
            )}
          </View>

          {editingName ? (
            <View>
              <TextInput
                value={nameInput}
                onChangeText={setNameInput}
                placeholder="Patient name"
                placeholderTextColor="#94a3b8"
                className="border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 mb-2"
              />
              <View className="flex-row gap-2">
                <Button
                  label="Cancel"
                  variant="outline"
                  onPress={() => {
                    setEditingName(false);
                    setNameInput(a.patient_name || "");
                  }}
                  className="flex-1"
                />
                <Button
                  label="Save"
                  onPress={saveName}
                  loading={savingName}
                  className="flex-1"
                />
              </View>
            </View>
          ) : (
            <>
              <Text className="text-slate-900 font-semibold">
                {a.patient_name || "Unnamed"}
                {a.patient_parent_id ? (
                  <Text className="text-violet-600 text-xs"> ({a.patient_relation || "family"} of mobile owner)</Text>
                ) : null}
              </Text>
              <Text className="text-slate-400 text-xs mt-0.5">
                {a.patient_mobile}
              </Text>
              {a.patient_email && (
                <Text className="text-slate-400 text-xs">
                  {a.patient_email}
                </Text>
              )}
            </>
          )}
        </View>

        {/* Appointment info */}
        <View className="bg-white rounded-2xl border border-slate-100 p-4 mb-3">
          <Text className="font-bold text-slate-900 text-sm mb-2">
            Appointment
          </Text>
          <Row label="Doctor" value={a.doctor_name} />
          <Row label="Service" value={a.service_name} />
          <Row label="Date" value={a.appointment_date} />
          <Row
            label="Time"
            value={`${a.start_time?.slice(0, 5)} - ${a.end_time?.slice(0, 5)}`}
          />
          {a.booked_by_receptionist_name && (
            <Row label="Booked By" value={a.booked_by_receptionist_name} />
          )}
          {a.reason && <Row label="Reason" value={a.reason} />}
          <View className="flex-row gap-2 mt-2">
            <View
              className={`px-2.5 py-1 rounded-full ${STATUS_COLORS[a.status] || "bg-slate-100"}`}
            >
              <Text className="text-[10px] font-bold uppercase">
                {a.status}
              </Text>
            </View>
            <View
              className={`px-2.5 py-1 rounded-full ${a.payment_status === "paid" ? "bg-green-100" : a.payment_status === "not_required" ? "bg-slate-100" : "bg-red-100"}`}
            >
              <Text className="text-[10px] font-bold uppercase">
                {a.payment_status === "not_required"
                  ? "free"
                  : a.payment_status}
              </Text>
            </View>
          </View>
        </View>

        {/* Payment */}
        <View className="bg-white rounded-2xl border border-slate-100 p-4 mb-3">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="font-bold text-slate-900 text-sm">Payment</Text>
            <Text className="font-bold text-brand-700 text-base">
              ₹{a.final_amount}
            </Text>
          </View>
          {payments.map((p) => (
            <Row
              key={p.id}
              label={p.method || "razorpay"}
              value={`₹${p.amount} • ${p.status}`}
            />
          ))}
          {a.payment_status !== "paid" &&
            a.payment_status !== "not_required" && (
              <Pressable
                onPress={() => setPayModal(true)}
                className="mt-2 bg-brand-600 rounded-xl py-2.5 items-center flex-row justify-center gap-2"
              >
                <Ionicons name="cash" size={16} color="#fff" />
                <Text className="text-white font-semibold text-xs">
                  Collect Payment at Clinic
                </Text>
              </Pressable>
            )}
        </View>

        {/* Status actions */}
        <View className="bg-white rounded-2xl border border-slate-100 p-4 mb-3">
          <Text className="font-bold text-slate-900 text-sm mb-2">
            Update Status
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {a.status !== "confirmed" &&
              a.status !== "completed" &&
              a.status !== "cancelled" && (
                <ActionChip
                  label="Confirm"
                  icon="checkmark"
                  onPress={() => updateStatus("confirmed")}
                />
              )}
            {a.status !== "completed" && a.status !== "cancelled" && (
              <ActionChip
                label="Complete"
                icon="checkmark-done"
                onPress={() => updateStatus("completed")}
              />
            )}
            {a.status !== "cancelled" && a.status !== "completed" && (
              <ActionChip
                label="No-show"
                icon="alert-circle"
                onPress={() => updateStatus("no_show")}
              />
            )}
            {a.status !== "cancelled" && a.status !== "completed" && (
              <ActionChip
                label="Cancel"
                icon="close-circle"
                danger
                onPress={() => updateStatus("cancelled")}
              />
            )}
          </View>
        </View>

        {/* Prescription / History add */}
        <View className="flex-row gap-2 mb-3">
          <Button
            label="+ Prescription"
            variant="outline"
            onPress={() =>
              setForm(form === "prescription" ? null : "prescription")
            }
            className="flex-1"
          />
          <Button
            label="+ Medical History"
            variant="outline"
            onPress={() => setForm(form === "history" ? null : "history")}
            className="flex-1"
          />
        </View>
        {form === "prescription" && (
          <PrescriptionForm
            patientId={a.patient_id}
            appointmentId={a.id}
            doctorId={a.doctor_id}
            onDone={() => {
              setForm(null);
              load();
            }}
          />
        )}
        {form === "history" && (
          <HistoryForm
            patientId={a.patient_id}
            appointmentId={a.id}
            doctorId={a.doctor_id}
            onDone={() => {
              setForm(null);
              load();
            }}
          />
        )}
        <Section title="Prescriptions" count={prescriptions.length}>
          {prescriptions.map((p) => (
            <PrescriptionCard key={p.id} prescription={p} />
          ))}
        </Section>

<Section title="Medical History" count={history.length}>
  {history.map((h) => (
    <MedicalHistoryCard key={h.id} history={h} />
  ))}
</Section>
      </ScrollView>

      <Modal
        visible={payModal}
        transparent
        animationType="fade"
        onRequestClose={() => setPayModal(false)}
      >
        <View className="flex-1 bg-black/40 items-center justify-center px-8">
          <View className="bg-white rounded-2xl p-5 w-full">
            <Text className="font-bold text-slate-900 mb-4 text-center">
              How was payment collected?
            </Text>
            {["cash", "card", "upi"].map((m) => (
              <Pressable
                key={m}
                onPress={() => collectPayment(m)}
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
              onPress={() => setPayModal(false)}
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

function Row({ label, value }) {
  return (
    <View className="flex-row justify-between py-1.5">
      <Text className="text-slate-500 text-xs">{label}</Text>
      <Text className="font-medium text-slate-800 text-xs flex-1 text-right pl-2">
        {value}
      </Text>
    </View>
  );
}

function Section({ title, count, children }) {
  return (
    <View className="mb-6">
      <Text className="font-bold text-slate-900 text-sm mb-2">
        {title} ({count})
      </Text>
      {count === 0 ? (
        <Text className="text-slate-400 text-xs">Nothing yet.</Text>
      ) : (
        <View
          className="bg-white rounded-2xl border border-slate-100 p-4"
          style={{ gap: 4 }}
        >
          {children}
        </View>
      )}
    </View>
  );
}

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

function PrescriptionCard({ prescription }) {
  const {
    id,
    prescribed_date,
    medicines_json,
    notes,
    pdf_url,
    attachment_urls,
    created_at,
  } = prescription;

  // Medicines can sometimes come as JSON string
  let medicines = medicines_json;

  if (typeof medicines === "string") {
    try {
      medicines = JSON.parse(medicines);
    } catch {
      medicines = [];
    }
  }

  medicines = Array.isArray(medicines) ? medicines : [];

  // Normalize attachments
  const attachments = Array.isArray(attachment_urls) ? attachment_urls : [];

  return (
    <View className="bg-white rounded-2xl border border-slate-200 p-4 mb-3">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center gap-2">
          <View className="w-9 h-9 rounded-xl bg-blue-50 items-center justify-center">
            <Ionicons name="document-text" size={18} color="#1d4ed8" />
          </View>

          <View>
            <Text className="text-slate-900 font-bold text-sm">
              Prescription #{id}
            </Text>

            <Text className="text-slate-400 text-[11px]">
              {prescribed_date || "Date not available"}
            </Text>
          </View>
        </View>

        <View className="bg-green-50 px-2.5 py-1 rounded-full">
          <Text className="text-green-700 text-[10px] font-bold">
            PRESCRIBED
          </Text>
        </View>
      </View>

      {/* Medicines */}
      {medicines.length > 0 && (
        <View className="mb-4">
          <Text className="text-slate-900 font-bold text-xs mb-2">
            Medicines
          </Text>

          <View className="border border-slate-100 rounded-xl overflow-hidden">
            {medicines.map((medicine, index) => (
              <View
                key={index}
                className={`p-3 ${
                  index !== medicines.length - 1
                    ? "border-b border-slate-100"
                    : ""
                }`}
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 pr-2">
                    <Text className="text-slate-900 font-semibold text-sm">
                      {medicine.name ||
                        medicine.medicine_name ||
                        medicine.medication ||
                        `Medicine ${index + 1}`}
                    </Text>

                    {(medicine.dosage ||
                      medicine.strength ||
                      medicine.dose) && (
                      <Text className="text-slate-500 text-xs mt-1">
                        Dosage:{" "}
                        {medicine.dosage || medicine.strength || medicine.dose}
                      </Text>
                    )}

                    {medicine.frequency && (
                      <Text className="text-slate-500 text-xs mt-0.5">
                        Frequency: {medicine.frequency}
                      </Text>
                    )}

                    {medicine.duration && (
                      <Text className="text-slate-500 text-xs mt-0.5">
                        Duration: {medicine.duration}
                      </Text>
                    )}

                    {medicine.instructions && (
                      <Text className="text-slate-500 text-xs mt-0.5">
                        Instructions: {medicine.instructions}
                      </Text>
                    )}

                    {medicine.timing && (
                      <Text className="text-slate-500 text-xs mt-0.5">
                        Timing: {medicine.timing}
                      </Text>
                    )}
                  </View>

                  <View className="bg-blue-50 rounded-lg px-2 py-1">
                    <Ionicons name="medical" size={14} color="#1d4ed8" />
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* No medicines */}
      {medicines.length === 0 && (
        <View className="bg-slate-50 rounded-xl p-3 mb-3">
          <Text className="text-slate-400 text-xs">No medicines recorded</Text>
        </View>
      )}

      {/* Notes */}
      {notes?.trim() && (
        <View className="mb-4">
          <Text className="text-slate-900 font-bold text-xs mb-2">
            Doctor's Notes
          </Text>

          <View className="bg-amber-50 border border-amber-100 rounded-xl p-3">
            <Text className="text-slate-700 text-xs leading-5">{notes}</Text>
          </View>
        </View>
      )}

      {/* Prescription PDF */}
      {pdf_url && (
        <View className="mb-4">
          <Text className="text-slate-900 font-bold text-xs mb-2">
            Prescription PDF
          </Text>

          <Pressable
            onPress={() => Linking.openURL(pdf_url)}
            className="flex-row items-center bg-red-50 border border-red-100 rounded-xl p-3"
          >
            <View className="w-9 h-9 rounded-lg bg-red-100 items-center justify-center">
              <Ionicons name="document" size={18} color="#dc2626" />
            </View>

            <View className="flex-1 ml-3">
              <Text className="text-red-700 font-semibold text-xs">
                View Prescription PDF
              </Text>

              <Text className="text-red-400 text-[10px] mt-0.5">
                Tap to open
              </Text>
            </View>

            <Ionicons name="open-outline" size={17} color="#dc2626" />
          </Pressable>
        </View>
      )}

      {/* Attachments / Images */}
      {attachments.length > 0 && (
        <View className="mb-3">
          <Text className="text-slate-900 font-bold text-xs mb-2">
            Prescription Attachments ({attachments.length})
          </Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {attachments.map((url, index) => (
              <Pressable
                key={index}
                onPress={() => Linking.openURL(url)}
                className="mr-3"
              >
                <View className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                  <Image
                    source={{ uri: url }}
                    style={{
                      width: 150,
                      height: 180,
                    }}
                    resizeMode="cover"
                  />

                  <View className="absolute bottom-0 left-0 right-0 bg-black/50 px-2 py-2">
                    <Text className="text-white text-[10px] font-semibold text-center">
                      Attachment {index + 1}
                    </Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Created date */}
      {created_at && (
        <View className="border-t border-slate-100 pt-2 mt-1">
          <Text className="text-slate-400 text-[10px]">
            Created: {created_at}
          </Text>
        </View>
      )}
    </View>
  );
}



function MedicalHistoryCard({ history }) {
  const {
    id,
    title,
    diagnosis,
    treatment_notes,
    attachment_urls,
    visit_date,
    created_at,
  } = history;

  const attachments = Array.isArray(attachment_urls)
    ? attachment_urls
    : [];

  return (
    <View className="bg-white rounded-2xl border border-slate-200 p-4 mb-3">

      {/* Header */}
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center gap-2 flex-1">
          <View className="w-9 h-9 rounded-xl bg-purple-50 items-center justify-center">
            <Ionicons
              name="medical"
              size={18}
              color="#7c3aed"
            />
          </View>

          <View className="flex-1">
            <Text
              className="text-slate-900 font-bold text-sm"
              numberOfLines={2}
            >
              {title || 'Medical Visit'}
            </Text>

            <Text className="text-slate-400 text-[11px] mt-0.5">
              Visit Date: {visit_date || 'Not available'}
            </Text>
          </View>
        </View>

        <View className="bg-purple-50 px-2.5 py-1 rounded-full">
          <Text className="text-purple-700 text-[10px] font-bold">
            HISTORY
          </Text>
        </View>
      </View>

      {/* Diagnosis */}
      {diagnosis?.trim() && (
        <View className="mb-3">
          <Text className="text-slate-900 font-bold text-xs mb-1.5">
            Diagnosis
          </Text>

          <View className="bg-blue-50 border border-blue-100 rounded-xl p-3">
            <View className="flex-row items-start gap-2">
              <Ionicons
                name="clipboard-outline"
                size={16}
                color="#2563eb"
              />

              <Text className="text-slate-700 text-xs leading-5 flex-1">
                {diagnosis}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Treatment Notes */}
      {treatment_notes?.trim() && (
        <View className="mb-3">
          <Text className="text-slate-900 font-bold text-xs mb-1.5">
            Treatment Notes
          </Text>

          <View className="bg-amber-50 border border-amber-100 rounded-xl p-3">
            <View className="flex-row items-start gap-2">
              <Ionicons
                name="document-text-outline"
                size={16}
                color="#d97706"
              />

              <Text className="text-slate-700 text-xs leading-5 flex-1">
                {treatment_notes}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Attachments */}
      {attachments.length > 0 && (
        <View className="mb-3">
          <Text className="text-slate-900 font-bold text-xs mb-2">
            Medical Attachments ({attachments.length})
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            {attachments.map((url, index) => (
              <Pressable
                key={index}
                onPress={() => Linking.openURL(url)}
                className="mr-3"
              >
                <View className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                  <Image
                    source={{ uri: url }}
                    style={{
                      width: 150,
                      height: 180,
                    }}
                    resizeMode="cover"
                  />

                  <View className="absolute bottom-0 left-0 right-0 bg-black/50 px-2 py-2">
                    <View className="flex-row items-center justify-center gap-1">
                      <Ionicons
                        name="open-outline"
                        size={11}
                        color="#fff"
                      />

                      <Text className="text-white text-[10px] font-semibold">
                        Attachment {index + 1}
                      </Text>
                    </View>
                  </View>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {/* No attachment */}
      {attachments.length === 0 && (
        <View className="bg-slate-50 rounded-xl p-3 mb-3">
          <View className="flex-row items-center gap-2">
            <Ionicons
              name="image-outline"
              size={15}
              color="#94a3b8"
            />

            <Text className="text-slate-400 text-xs">
              No attachments available
            </Text>
          </View>
        </View>
      )}

      {/* Footer */}
      <View className="border-t border-slate-100 pt-2 mt-1">
        <View className="flex-row justify-between">
          <Text className="text-slate-400 text-[10px]">
            Visit: {visit_date || '-'}
          </Text>

          <Text className="text-slate-400 text-[10px]">
            Created: {created_at || '-'}
          </Text>
        </View>
      </View>
    </View>
  );
}