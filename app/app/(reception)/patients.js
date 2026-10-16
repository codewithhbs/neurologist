import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Image,
  Linking,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";

import client from "../../src/api/client";
import AppHeader from "../../src/components/AppHeader";
import Screen from "../../src/components/Screen";
import Button from "../../src/components/Button";
import {
  HistoryForm,
  PrescriptionForm,
} from "../../src/components/MedicalForms";

const API_BASE_URL = "http://192.168.1.38:5680";

// ---------------------------------------------------------
// URL HELPER
// ---------------------------------------------------------
const calculateAge = (dob) => {
  if (!dob) return "—";

  const birthDate = new Date(dob);
  const today = new Date();

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return `${age} Years`;
};

const formatDate = (date) => {
  if (!date || date === "0000-00-00") return "—";

  const d = new Date(date);

  if (Number.isNaN(d.getTime())) return String(date);

  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const capitalize = (value) => {
  if (!value) return "—";

  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
};
function getFileUrl(url) {
  if (!url) return "";

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  return `${API_BASE_URL}/${url.replace(/^\/+/, "")}`;
}

// ---------------------------------------------------------
// MAIN SCREEN
// ---------------------------------------------------------

export default function ReceptionPatients() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const [selected, setSelected] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [form, setForm] = useState(null);

  const search = async () => {
    if (!query.trim()) {
      Toast.show({
        type: "error",
        text1: "Enter patient name or mobile",
      });
      return;
    }

    setSearching(true);

    try {
      const res = await client.get("/admin/patients", {
        params: {
          search: query.trim(),
        },
      });

      setResults(res.data?.patients || []);
    } catch (e) {
      console.error("Patient Search Error:", e);

      Toast.show({
        type: "error",
        text1: "Search failed",
      });
    } finally {
      setSearching(false);
    }
  };

  const openPatient = async (id) => {
    setLoadingDetail(true);
    setSelected(null);

    try {
      const res = await client.get(`/admin/patients/${id}`);

      setSelected(res.data);
    } catch (e) {
      console.error("Patient Detail Error:", e);

      Toast.show({
        type: "error",
        text1: "Failed to load patient",
      });
    } finally {
      setLoadingDetail(false);
    }
  };

  if (loadingDetail) {
    return (
      <Screen scroll={false} className="bg-white">
        <AppHeader
          title="Patient"
          subtitle="Loading patient details..."
          showBack={false}
        />

        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#1d4ed8" />

          <Text className="text-slate-400 text-xs mt-3">
            Loading patient details...
          </Text>
        </View>
      </Screen>
    );
  }

  if (selected) {
    return (
      <PatientDetail
        data={selected}
        form={form}
        setForm={setForm}
        onBack={() => {
          setSelected(null);
          setForm(null);
        }}
        onRefresh={() => openPatient(selected.patient.id)}
      />
    );
  }

  return (
    <Screen className="bg-white">
      <AppHeader
        title="Patients"
        subtitle="Search by name or mobile"
        showBack={false}
      />

      <View className="px-5 pt-4 flex-1">
        {/* Search */}
        <View className="flex-row gap-2 mb-4">
          <TextInput
            placeholder="Name or mobile number"
            placeholderTextColor="#94a3b8"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={search}
            returnKeyType="search"
            className="flex-1 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900"
          />

          <Pressable
            onPress={search}
            disabled={searching}
            className="bg-brand-600 rounded-xl px-4 items-center justify-center"
          >
            {searching ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Ionicons name="search" size={18} color="#fff" />
            )}
          </Pressable>
        </View>

        {/* Results */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            gap: 10,
            paddingBottom: 40,
          }}
        >
          {results.length === 0 && !searching && (
            <View className="items-center py-16">
              <View className="w-16 h-16 rounded-full bg-slate-100 items-center justify-center mb-3">
                <Ionicons name="people-outline" size={28} color="#94a3b8" />
              </View>

              <Text className="text-slate-700 font-semibold text-sm">
                No patients found
              </Text>

              <Text className="text-slate-400 text-xs mt-1 text-center">
                Search using patient's name or mobile number
              </Text>
            </View>
          )}

          {results.map((p) => (
            <Pressable
              key={p.id}
              onPress={() => openPatient(p.id)}
              className="flex-row items-center gap-3 bg-white border border-slate-200 rounded-2xl px-4 py-3 active:bg-slate-50"
            >
              {/* Avatar */}
              <View className="w-11 h-11 rounded-full bg-brand-100 items-center justify-center">
                <Text className="text-brand-700 font-bold">
                  {(p.name || "?")[0]?.toUpperCase()}
                </Text>
              </View>

              {/* Patient */}
              <View className="flex-1">
                <Text className="font-semibold text-slate-900 text-sm">
                  {p.name || "Unnamed"}
                </Text>

                <Text className="text-slate-400 text-xs mt-0.5">
                  {p.mobile || "No mobile"}
                </Text>
              </View>

              <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </Screen>
  );
}

// ---------------------------------------------------------
// PATIENT DETAIL
// ---------------------------------------------------------

function PatientDetail({ data, form, setForm, onBack, onRefresh }) {
  const router = useRouter();

  const { patient, appointments = [], history = [], prescriptions = [] } = data;

  const [editingName, setEditingName] = useState(false);

  const [nameInput, setNameInput] = useState(patient?.name || "");

  const [savingName, setSavingName] = useState(false);

  // -------------------------------------------------------
  // SAVE PATIENT NAME
  // -------------------------------------------------------

  const saveName = async () => {
    if (!nameInput.trim()) {
      Toast.show({
        type: "error",
        text1: "Name cannot be empty",
      });

      return;
    }

    setSavingName(true);

    try {
      await client.put(`/admin/patients/${patient.id}`, {
        name: nameInput.trim(),
      });

      Toast.show({
        type: "success",
        text1: "Patient name updated",
      });

      setEditingName(false);

      onRefresh();
    } catch (e) {
      console.error("Update Patient Error:", e);

      Toast.show({
        type: "error",
        text1: "Failed to update name",
      });
    } finally {
      setSavingName(false);
    }
  };

  return (
    <Screen className="bg-white">
      <AppHeader
        title={patient?.name || "Patient"}
        subtitle={patient?.mobile || ""}
        showBack={false}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          padding: 20,
          paddingBottom: 80,
        }}
      >
        {/* BACK */}
        <Pressable
          onPress={onBack}
          className="flex-row items-center gap-1 mb-4"
        >
          <Ionicons name="chevron-back" size={14} color="#1d4ed8" />

          <Text className="text-brand-600 text-xs font-semibold">
            Back to search
          </Text>
        </Pressable>

        {/* PATIENT INFORMATION */}
        <View className="bg-white border border-slate-200 rounded-2xl mb-5 overflow-hidden">
          {/* Header */}
          <View className="bg-slate-50 px-4 py-4 border-b border-slate-100">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <View className="w-12 h-12 rounded-2xl bg-brand-100 items-center justify-center mr-3">
                  <Text className="text-brand-700 font-bold text-lg">
                    {(patient?.name || "?")[0]?.toUpperCase()}
                  </Text>
                </View>

                <View className="flex-1">
                  <Text className="text-slate-900 font-bold text-base">
                    {patient?.name || "Unnamed Patient"}
                  </Text>

                  <Text className="text-slate-500 text-xs mt-0.5">
                    {patient?.mobile
                      ? `+91 ${patient.mobile}`
                      : "No mobile number"}
                  </Text>

                  <Text className="text-slate-400 text-[11px] mt-0.5">
                    Patient ID: {patient?.patient_id || patient?.id || "—"}
                  </Text>
                </View>
              </View>

              <View
                className={`px-2.5 py-1 rounded-full ${
                  patient?.is_active ? "bg-green-50" : "bg-red-50"
                }`}
              >
                <Text
                  className={`text-[10px] font-bold uppercase ${
                    patient?.is_active ? "text-green-700" : "text-red-700"
                  }`}
                >
                  {patient?.is_active ? "Active" : "Inactive"}
                </Text>
              </View>
            </View>
          </View>

          <View className="p-4">
            {/* Personal Details */}
            <PatientSectionTitle
              icon="person-outline"
              title="Personal Details"
            />

            <View className="flex-row flex-wrap -mx-1">
              <PatientInfoBox label="Full Name" value={patient?.name} />

              <PatientInfoBox
                label="Father / Husband"
                value={patient?.father_husband_name}
              />

              <PatientInfoBox
                label="Gender"
                value={capitalize(patient?.gender)}
              />

              <PatientInfoBox
                label="Date of Birth"
                value={formatDate(patient?.dob)}
              />

              <PatientInfoBox label="Age" value={calculateAge(patient?.dob)} />

              <PatientInfoBox
                label="Nationality"
                value={patient?.nationality}
              />

              <PatientInfoBox
                label="Marital Status"
                value={capitalize(patient?.marital_status)}
              />

              <PatientInfoBox label="Email" value={patient?.email} />
            </View>

            {/* Contact Details */}
            <PatientSectionTitle icon="call-outline" title="Contact Details" />

            <View className="flex-row flex-wrap -mx-1">
              <PatientInfoBox
                label="Mobile Number"
                value={patient?.mobile ? `+91 ${patient.mobile}` : "—"}
              />

              <PatientInfoBox label="Email" value={patient?.email} />
            </View>

            {/* Permanent Address */}
            <PatientSectionTitle
              icon="location-outline"
              title="Permanent Address"
            />

            <PatientAddressBox
              address={patient?.permanent_address}
              pincode={patient?.permanent_pincode}
            />

            {/* Local Address */}
            <PatientSectionTitle icon="home-outline" title="Local Address" />

            <PatientAddressBox
              address={patient?.local_address}
              pincode={patient?.local_pincode}
            />

            {/* Legacy Address */}
            {!!patient?.address && (
              <>
                <PatientSectionTitle
                  icon="archive-outline"
                  title="Previous / General Address"
                />

                <View className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-4">
                  <Text className="text-slate-700 text-xs leading-5">
                    {patient.address}
                  </Text>
                </View>
              </>
            )}

            {/* Referral */}
            <PatientSectionTitle
              icon="git-branch-outline"
              title="Referral Details"
            />

            <View className="flex-row flex-wrap -mx-1">
              <PatientInfoBox
                label="Referred By"
                value={capitalize(patient?.referred_by)}
              />

              <PatientInfoBox
                label="Referrer Name"
                value={
                  patient?.referred_by === "self"
                    ? "Self"
                    : patient?.referrer_name
                }
              />
            </View>

            {!!patient?.referrer_address && patient?.referred_by !== "self" && (
              <View className="bg-slate-50 rounded-xl p-3 mb-4">
                <Text className="text-slate-400 text-[10px] uppercase font-semibold mb-1">
                  Referrer Address
                </Text>

                <Text className="text-slate-700 text-xs leading-5">
                  {patient.referrer_address}
                </Text>
              </View>
            )}

            {/* Record Details */}
            <PatientSectionTitle
              icon="information-circle-outline"
              title="Record Details"
            />

            <View className="flex-row flex-wrap -mx-1">
              <PatientInfoBox label="Database ID" value={patient?.id} />

              <PatientInfoBox
                label="Patient ID"
                value={patient?.patient_id || "Not Assigned"}
              />

              <PatientInfoBox
                label="Patient Type"
                value={capitalize(patient?.patient_type)}
              />

              <PatientInfoBox
                label="Status"
                value={patient?.is_active ? "Active" : "Inactive"}
              />

              <PatientInfoBox
                label="Created At"
                value={formatDate(patient?.created_at)}
              />

              <PatientInfoBox
                label="Last Updated"
                value={formatDate(patient?.updated_at)}
              />
            </View>
          </View>
        </View>

        {/* ADD BUTTONS */}
        <View className="flex-row gap-2 mb-5">
          <Button
            label="+ Medical History"
            variant="outline"
            onPress={() => setForm(form === "history" ? null : "history")}
            className="flex-1"
          />

          <Button
            label="+ Prescription"
            variant="outline"
            onPress={() =>
              setForm(form === "prescription" ? null : "prescription")
            }
            className="flex-1"
          />
        </View>

        {/* HISTORY FORM */}
        {form === "history" && (
          <View className="mb-5">
            <HistoryForm
              patientId={patient.id}
              onDone={() => {
                setForm(null);
                onRefresh();
              }}
            />
          </View>
        )}

        {/* PRESCRIPTION FORM */}
        {form === "prescription" && (
          <View className="mb-5">
            <PrescriptionForm
              patientId={patient.id}
              onDone={() => {
                setForm(null);
                onRefresh();
              }}
            />
          </View>
        )}

        {/* APPOINTMENTS */}
        <Section
          title="Appointments"
          count={appointments.length}
          icon="calendar-outline"
        >
          {appointments.map((a) => (
            <AppointmentCard
              key={a.id}
              appointment={a}
              onPress={() => router.push(`/appointment/${a.id}`)}
            />
          ))}
        </Section>

        {/* MEDICAL HISTORY */}
        <Section
          title="Medical History"
          count={history.length}
          icon="medkit-outline"
        >
          {history.map((h) => (
            <MedicalHistoryCard key={h.id} history={h} />
          ))}
        </Section>

        {/* PRESCRIPTIONS */}
        <Section
          title="Prescriptions"
          count={prescriptions.length}
          icon="document-text-outline"
        >
          {prescriptions.map((p) => (
            <PrescriptionCard key={p.id} prescription={p} />
          ))}
        </Section>
      </ScrollView>
    </Screen>
  );
}

// ---------------------------------------------------------
// APPOINTMENT CARD
// ---------------------------------------------------------

function AppointmentCard({ appointment, onPress }) {
  const a = appointment;

  return (
    <Pressable
      onPress={onPress}
      className="bg-white border border-slate-200 rounded-2xl p-4 active:bg-slate-50"
    >
      {/* Header */}
      <View className="flex-row items-center justify-between">
        <View className="flex-1 pr-3">
          <Text className="font-bold text-slate-900 text-sm" numberOfLines={2}>
            {a.service_name || "Appointment"}
          </Text>

          <Text className="text-slate-500 text-xs mt-1">
            Dr. {a.doctor_name || "Doctor"}
          </Text>
        </View>

        <View className="flex-row items-center gap-2">
          <StatusBadge status={a.status} />

          <Ionicons name="chevron-forward" size={17} color="#94a3b8" />
        </View>
      </View>

      {/* Details */}
      <View className="border-t border-slate-100 mt-3 pt-3">
        <InfoLine icon="calendar-outline" value={a.appointment_date || "-"} />

        <InfoLine
          icon="time-outline"
          value={
            a.start_time
              ? `${a.start_time.slice(0, 5)}${
                  a.end_time ? ` - ${a.end_time.slice(0, 5)}` : ""
                }`
              : "-"
          }
        />

        {a.final_amount !== undefined && (
          <InfoLine icon="cash-outline" value={`₹${a.final_amount}`} />
        )}

        {a.payment_status && (
          <InfoLine
            icon="card-outline"
            value={`Payment: ${a.payment_status}`}
          />
        )}
      </View>

      {/* Footer */}
      <View className="flex-row justify-end items-center mt-3">
        <Text className="text-brand-600 text-xs font-semibold">
          View Appointment
        </Text>

        <Ionicons
          name="arrow-forward"
          size={14}
          color="#2563eb"
          style={{
            marginLeft: 5,
          }}
        />
      </View>
    </Pressable>
  );
}

// ---------------------------------------------------------
// MEDICAL HISTORY CARD
// ---------------------------------------------------------

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

  const attachments = Array.isArray(attachment_urls) ? attachment_urls : [];

  return (
    <View className="bg-white border border-slate-200 rounded-2xl p-4">
      {/* HEADER */}
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center gap-2 flex-1">
          <View className="w-10 h-10 rounded-xl bg-purple-50 items-center justify-center">
            <Ionicons name="medical" size={19} color="#7c3aed" />
          </View>

          <View className="flex-1">
            <Text
              className="text-slate-900 font-bold text-sm"
              numberOfLines={2}
            >
              {title || "Medical Visit"}
            </Text>

            <Text className="text-slate-400 text-[11px] mt-0.5">
              Visit Date: {visit_date || "Not available"}
            </Text>
          </View>
        </View>

        <View className="bg-purple-50 px-2.5 py-1 rounded-full">
          <Text className="text-purple-700 text-[10px] font-bold">HISTORY</Text>
        </View>
      </View>

      {/* DIAGNOSIS */}
      {diagnosis?.trim() && (
        <View className="mb-3">
          <Text className="text-slate-900 font-bold text-xs mb-1.5">
            Diagnosis
          </Text>

          <View className="bg-blue-50 border border-blue-100 rounded-xl p-3">
            <View className="flex-row items-start gap-2">
              <Ionicons name="clipboard-outline" size={16} color="#2563eb" />

              <Text className="text-slate-700 text-xs leading-5 flex-1">
                {diagnosis}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* TREATMENT NOTES */}
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

      {/* ATTACHMENTS */}
      {attachments.length > 0 && (
        <View className="mb-3">
          <Text className="text-slate-900 font-bold text-xs mb-2">
            Medical Attachments ({attachments.length})
          </Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {attachments.map((url, index) => (
              <AttachmentImage
                key={`${id}-${index}`}
                url={url}
                label={`Attachment ${index + 1}`}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* NO ATTACHMENTS */}
      {attachments.length === 0 && (
        <View className="bg-slate-50 rounded-xl p-3 mb-3">
          <View className="flex-row items-center gap-2">
            <Ionicons name="image-outline" size={15} color="#94a3b8" />

            <Text className="text-slate-400 text-xs">
              No attachments available
            </Text>
          </View>
        </View>
      )}

      {/* FOOTER */}
      <View className="border-t border-slate-100 pt-2 mt-1">
        <View className="flex-row justify-between">
          <Text className="text-slate-400 text-[10px]">
            Visit: {visit_date || "-"}
          </Text>

          <Text className="text-slate-400 text-[10px]">
            Created: {created_at || "-"}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------
// PRESCRIPTION CARD
// ---------------------------------------------------------

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

  let medicines = medicines_json;

  if (typeof medicines === "string") {
    try {
      medicines = JSON.parse(medicines);
    } catch {
      medicines = [];
    }
  }

  medicines = Array.isArray(medicines) ? medicines : [];

  const attachments = Array.isArray(attachment_urls) ? attachment_urls : [];

  return (
    <View className="bg-white border border-slate-200 rounded-2xl p-4">
      {/* HEADER */}
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center gap-2 flex-1">
          <View className="w-10 h-10 rounded-xl bg-blue-50 items-center justify-center">
            <Ionicons name="document-text" size={19} color="#1d4ed8" />
          </View>

          <View className="flex-1">
            <Text className="text-slate-900 font-bold text-sm">
              Prescription #{id}
            </Text>

            <Text className="text-slate-400 text-[11px] mt-0.5">
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

      {/* MEDICINES */}
      <View className="mb-4">
        <Text className="text-slate-900 font-bold text-xs mb-2">Medicines</Text>

        {medicines.length > 0 ? (
          <View className="border border-slate-100 rounded-xl overflow-hidden">
            {medicines.map((medicine, index) => (
              <MedicineRow
                key={index}
                medicine={medicine}
                index={index}
                isLast={index === medicines.length - 1}
              />
            ))}
          </View>
        ) : (
          <View className="bg-slate-50 rounded-xl p-3">
            <View className="flex-row items-center gap-2">
              <Ionicons name="medical-outline" size={15} color="#94a3b8" />

              <Text className="text-slate-400 text-xs">
                No medicines recorded
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* NOTES */}
      {notes?.trim() && (
        <View className="mb-4">
          <Text className="text-slate-900 font-bold text-xs mb-2">
            Doctor's Notes
          </Text>

          <View className="bg-amber-50 border border-amber-100 rounded-xl p-3">
            <View className="flex-row items-start gap-2">
              <Ionicons
                name="document-text-outline"
                size={16}
                color="#d97706"
              />

              <Text className="text-slate-700 text-xs leading-5 flex-1">
                {notes}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* PDF */}
      {pdf_url && (
        <View className="mb-4">
          <Text className="text-slate-900 font-bold text-xs mb-2">
            Prescription PDF
          </Text>

          <Pressable
            onPress={() => openFile(pdf_url)}
            className="flex-row items-center bg-red-50 border border-red-100 rounded-xl p-3"
          >
            <View className="w-10 h-10 rounded-lg bg-red-100 items-center justify-center">
              <Ionicons name="document" size={19} color="#dc2626" />
            </View>

            <View className="flex-1 ml-3">
              <Text className="text-red-700 font-semibold text-xs">
                View Prescription PDF
              </Text>

              <Text className="text-red-400 text-[10px] mt-0.5">
                Tap to open document
              </Text>
            </View>

            <Ionicons name="open-outline" size={17} color="#dc2626" />
          </Pressable>
        </View>
      )}

      {/* ATTACHMENTS */}
      {attachments.length > 0 && (
        <View className="mb-3">
          <Text className="text-slate-900 font-bold text-xs mb-2">
            Prescription Attachments ({attachments.length})
          </Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {attachments.map((url, index) => (
              <AttachmentImage
                key={`${id}-${index}`}
                url={url}
                label={`Attachment ${index + 1}`}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* NO ATTACHMENTS */}
      {attachments.length === 0 && !pdf_url && (
        <View className="bg-slate-50 rounded-xl p-3 mb-3">
          <View className="flex-row items-center gap-2">
            <Ionicons name="document-outline" size={15} color="#94a3b8" />

            <Text className="text-slate-400 text-xs">
              No prescription files attached
            </Text>
          </View>
        </View>
      )}

      {/* FOOTER */}
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

// ---------------------------------------------------------
// MEDICINE ROW
// ---------------------------------------------------------

function MedicineRow({ medicine, index, isLast }) {
  const name =
    medicine?.name ||
    medicine?.medicine_name ||
    medicine?.medication ||
    `Medicine ${index + 1}`;

  const dosage = medicine?.dosage || medicine?.strength || medicine?.dose;

  const frequency = medicine?.frequency || medicine?.freq;

  const duration = medicine?.duration;

  const instructions = medicine?.instructions || medicine?.instruction;

  const timing = medicine?.timing;

  return (
    <View className={`p-3 ${!isLast ? "border-b border-slate-100" : ""}`}>
      <View className="flex-row items-start">
        <View className="w-8 h-8 rounded-lg bg-blue-50 items-center justify-center mr-2">
          <Ionicons name="medical" size={14} color="#1d4ed8" />
        </View>

        <View className="flex-1">
          <Text className="text-slate-900 font-semibold text-sm">{name}</Text>

          {dosage && <DetailLine label="Dosage" value={dosage} />}

          {frequency && <DetailLine label="Frequency" value={frequency} />}

          {duration && <DetailLine label="Duration" value={duration} />}

          {timing && <DetailLine label="Timing" value={timing} />}

          {instructions && (
            <DetailLine label="Instructions" value={instructions} />
          )}
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------
// ATTACHMENT IMAGE
// ---------------------------------------------------------

function AttachmentImage({ url, label }) {
  const fileUrl = getFileUrl(url);

  return (
    <Pressable onPress={() => openFile(fileUrl)} className="mr-3">
      <View className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
        <Image
          source={{
            uri: fileUrl,
          }}
          style={{
            width: 150,
            height: 180,
          }}
          resizeMode="cover"
        />

        <View className="absolute bottom-0 left-0 right-0 bg-black/55 px-2 py-2">
          <View className="flex-row items-center justify-center gap-1">
            <Ionicons name="open-outline" size={11} color="#fff" />

            <Text className="text-white text-[10px] font-semibold">
              {label}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

// ---------------------------------------------------------
// SECTION
// ---------------------------------------------------------

function Section({ title, count, icon, children }) {
  return (
    <View className="mb-6">
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center gap-2">
          <Ionicons name={icon} size={16} color="#334155" />

          <Text className="font-bold text-slate-900 text-sm">{title}</Text>

          <View className="bg-slate-100 px-2 py-0.5 rounded-full">
            <Text className="text-slate-500 text-[10px] font-bold">
              {count}
            </Text>
          </View>
        </View>
      </View>

      {count === 0 ? (
        <View className="bg-slate-50 rounded-xl p-4">
          <Text className="text-slate-400 text-xs text-center">
            Nothing yet.
          </Text>
        </View>
      ) : (
        <View className="gap-3">{children}</View>
      )}
    </View>
  );
}

// ---------------------------------------------------------
// STATUS BADGE
// ---------------------------------------------------------

function StatusBadge({ status }) {
  const value = status || "pending";

  const config = {
    pending: {
      bg: "bg-amber-50",
      text: "text-amber-700",
    },
    confirmed: {
      bg: "bg-blue-50",
      text: "text-blue-700",
    },
    completed: {
      bg: "bg-green-50",
      text: "text-green-700",
    },
    cancelled: {
      bg: "bg-red-50",
      text: "text-red-700",
    },
    no_show: {
      bg: "bg-slate-100",
      text: "text-slate-600",
    },
  };

  const style = config[value] || {
    bg: "bg-slate-100",
    text: "text-slate-600",
  };

  return (
    <View className={`${style.bg} px-2.5 py-1 rounded-full`}>
      <Text className={`${style.text} text-[10px] font-bold uppercase`}>
        {value.replace("_", " ")}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------
// INFO LINE
// ---------------------------------------------------------

function InfoLine({ icon, value }) {
  return (
    <View className="flex-row items-center mb-2">
      <Ionicons name={icon} size={14} color="#64748b" />

      <Text className="text-slate-600 text-xs ml-2">{value}</Text>
    </View>
  );
}

// ---------------------------------------------------------
// DETAIL LINE
// ---------------------------------------------------------

function DetailLine({ label, value }) {
  return (
    <Text className="text-slate-500 text-xs mt-1">
      <Text className="font-semibold text-slate-600">{label}: </Text>
      {String(value)}
    </Text>
  );
}

// ---------------------------------------------------------
// OPEN FILE
// ---------------------------------------------------------

async function openFile(url) {
  try {
    const fileUrl = getFileUrl(url);

    if (!fileUrl) {
      Toast.show({
        type: "error",
        text1: "File unavailable",
      });

      return;
    }

    const supported = await Linking.canOpenURL(fileUrl);

    if (!supported) {
      Toast.show({
        type: "error",
        text1: "Cannot open this file",
      });

      return;
    }

    await Linking.openURL(fileUrl);
  } catch (error) {
    console.error("Open File Error:", error);

    Toast.show({
      type: "error",
      text1: "Failed to open file",
    });
  }
}

function PatientSectionTitle({ icon, title }) {
  return (
    <View className="flex-row items-center gap-2 mt-2 mb-3">
      <View className="w-7 h-7 rounded-lg bg-slate-100 items-center justify-center">
        <Ionicons name={icon} size={14} color="#475569" />
      </View>

      <Text className="text-slate-800 font-bold text-xs uppercase tracking-wide">
        {title}
      </Text>

      <View className="flex-1 h-px bg-slate-100 ml-1" />
    </View>
  );
}

function PatientInfoBox({ label, value }) {
  const hasValue =
    value !== null && value !== undefined && String(value).trim() !== "";

  return (
    <View className="w-1/2 px-1 mb-2">
      <View className="bg-slate-50 rounded-xl px-3 py-3 min-h-[70px]">
        <Text className="text-slate-400 text-[10px] uppercase font-semibold">
          {label}
        </Text>

        <Text
          className="text-slate-800 text-xs font-semibold mt-1"
          numberOfLines={3}
        >
          {hasValue ? String(value) : "—"}
        </Text>
      </View>
    </View>
  );
}

function PatientAddressBox({ address, pincode }) {
  return (
    <View className="bg-slate-50 border border-slate-100 rounded-xl p-3 mb-4">
      <View className="flex-row items-start">
        <Ionicons
          name="location-outline"
          size={15}
          color="#64748b"
          style={{ marginTop: 2 }}
        />

        <Text className="text-slate-700 text-xs leading-5 flex-1 ml-2">
          {address || "No address available"}
        </Text>
      </View>

      <View className="border-t border-slate-200 mt-3 pt-2">
        <Text className="text-slate-500 text-[11px]">
          Pin Code:{" "}
          <Text className="font-semibold text-slate-700">{pincode || "—"}</Text>
        </Text>
      </View>
    </View>
  );
}
