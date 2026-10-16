import { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import client from "../../src/api/client";
import { useAuth } from "../../src/context/AuthContext";
import AppHeader from "../../src/components/AppHeader";
import Screen from "../../src/components/Screen";
import Button from "../../src/components/Button";
import { ReceptionFamilySelect } from "../../src/components/FamilyMembers";
import { relationLabel } from "../../src/utils/family";

const STEPS = ["Doctor", "Date & Time", "Patient", "Payment"];

function nextNDays(n) {
  const days = [];
  for (let i = 0; i < n; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    days.push(d);
  }
  return days;
}

export default function ReceptionBook() {
  const { staff } = useAuth();
  const [step, setStep] = useState(1);

  const [clinic, setClinic] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState("");

  const [patientForm, setPatientForm] = useState({
    mobile: "",
    name: "",
    email: "",
    gender: "",
    father_husband_name: "",
    dob: "",
    nationality: "Indian",
    marital_status: "",

    permanent_address: "",
    permanent_pincode: "",
    local_address: "",
    local_pincode: "",

    referred_by: "",
    referrer_name: "",
    referrer_address: "",

    reason: "",
  });

  const [paymentMethod, setPaymentMethod] = useState("pending");
  const [familySel, setFamilySel] = useState({ member_patient_id: "", new_member: null, _adding: false });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(null);

  const dateOptions = useMemo(() => nextNDays(21), []);

  useEffect(() => {
    (async () => {
      try {
        const [docRes, clinicRes] = await Promise.all([
          client.get("/doctors"),
          client.get("/clinics"),
        ]);
        setDoctors(docRes.data.doctors || []);
        const clinics = clinicRes.data.clinics || [];
        const preferred = staff?.clinic_id
          ? clinics.find((c) => c.id === staff.clinic_id)
          : null;
        setClinic(preferred || clinics[0] || null);
      } catch (e) {
        setDoctors([]);
      }
      setDoctorsLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectDoctor = (doctor) => {
    setSelectedDoctor(doctor);
    setSelectedDate(null);
    setSlots([]);
    setSelectedSlot("");
    setStep(2);
  };

  const fetchSlots = useCallback(
    async (date, doctor) => {
      const doc = doctor || selectedDoctor;
      if (!doc || !clinic) return;
      setSlotsLoading(true);
      setSlots([]);
      setSelectedSlot("");
      try {
        const dateStr = date.toISOString().split("T")[0];
        const res = await client.get("/appointments/available-slots", {
          params: { doctor_id: doc.id, clinic_id: clinic.id, date: dateStr },
        });
        setSlots(res.data.slots || []);
      } catch (e) {
        setSlots([]);
      }
      setSlotsLoading(false);
    },
    [selectedDoctor, clinic],
  );

  const pickDate = (date) => {
    setSelectedDate(date);
    fetchSlots(date);
  };



  const updatePatient = (field, value) => {
    setPatientForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };
  const reset = () => {
    setStep(1);
    setSelectedDoctor(null);
    setSelectedDate(null);
    setSlots([]);
    setSelectedSlot("");

    setPatientForm({
      mobile: "",
      name: "",
      email: "",
      gender: "",
      father_husband_name: "",
      dob: "",
      nationality: "Indian",
      marital_status: "",

      permanent_address: "",
      permanent_pincode: "",
      local_address: "",
      local_pincode: "",

      referred_by: "",
      referrer_name: "",
      referrer_address: "",

      reason: "",
    });

    setPaymentMethod("pending");
    setFamilySel({ member_patient_id: "", new_member: null, _adding: false });
    setDone(null);
  };
  const submit = async () => {
    if (!/^[6-9]\d{9}$/.test(patientForm.mobile)) {
      Toast.show({
        type: "error",
        text1: "Enter a valid 10-digit patient mobile number",
      });

      return;
    }

    setLoading(true);

    try {
      const dateStr = selectedDate.toISOString().split("T")[0];

      const res = await client.post("/admin/appointments", {
        patient_mobile: patientForm.mobile,

        patient_name: patientForm.name.trim() || undefined,

        patient_email: patientForm.email.trim() || undefined,

        patient_gender: patientForm.gender || undefined,

        patient_father_husband_name:
          patientForm.father_husband_name.trim() || undefined,

        patient_dob: patientForm.dob || undefined,

        patient_nationality: patientForm.nationality.trim() || undefined,

        patient_marital_status: patientForm.marital_status || undefined,

        patient_permanent_address:
          patientForm.permanent_address.trim() || undefined,

        patient_permanent_pincode:
          patientForm.permanent_pincode.trim() || undefined,

        patient_local_address: patientForm.local_address.trim() || undefined,

        patient_local_pincode: patientForm.local_pincode.trim() || undefined,

        patient_referred_by: patientForm.referred_by || undefined,

        patient_referrer_name: patientForm.referrer_name.trim() || undefined,

        patient_referrer_address:
          patientForm.referrer_address.trim() || undefined,

        clinic_id: clinic.id,
        doctor_id: selectedDoctor.id,

        appointment_date: dateStr,
        start_time: selectedSlot,

        reason: patientForm.reason.trim() || undefined,

        payment_method: paymentMethod,

        member_patient_id: familySel.member_patient_id || undefined,
        new_member: familySel.new_member || undefined,
      });

      setDone(res.data);
      setStep(5);
    } catch (e) {
      Toast.show({
        type: "error",
        text1: e.response?.data?.message || "Booking failed",
      });
    } finally {
      setLoading(false);
    }
  };

  const fee = selectedDoctor
    ? parseFloat(selectedDoctor.consultation_fee || 0)
    : 0;

  return (
    <Screen className="bg-white">
      <AppHeader
        title="New Walk-in Booking"
        subtitle={clinic?.name}
        showBack={false}
      />

      {step < 5 && (
        <View className="flex-row items-center px-5 pt-4 pb-2">
          {STEPS.map((label, i) => {
            const num = i + 1;
            const active = num === step;
            const doneStep = num < step;
            return (
              <View key={label} className="flex-1 flex-row items-center">
                <View
                  className={`w-7 h-7 rounded-full items-center justify-center ${doneStep || active ? "bg-brand-600" : "bg-slate-200"}`}
                >
                  {doneStep ? (
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  ) : (
                    <Text
                      className={`text-xs font-bold ${active ? "text-white" : "text-slate-500"}`}
                    >
                      {num}
                    </Text>
                  )}
                </View>
                {i < STEPS.length - 1 && (
                  <View
                    className={`flex-1 h-0.5 ${doneStep ? "bg-brand-600" : "bg-slate-200"}`}
                  />
                )}
              </View>
            );
          })}
        </View>
      )}

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {step === 1 && (
          <View className="gap-3">
            <Text className="font-bold text-slate-900 text-base mb-1">
              Choose Doctor
            </Text>
            {doctorsLoading && <ActivityIndicator color="#1d4ed8" />}
            {!doctorsLoading && doctors.length === 0 && (
              <Text className="text-slate-400 text-sm">
                No doctors available.
              </Text>
            )}
            {doctors.map((d) => (
              <Pressable
                key={d.id}
                onPress={() => selectDoctor(d)}
                className="flex-row items-center gap-3 bg-white border-2 border-slate-100 rounded-2xl px-4 py-3 mb-1"
              >
                <View className="w-12 h-12 rounded-full bg-brand-100 items-center justify-center">
                  <Text className="text-brand-700 font-bold">
                    {d.name?.replace(/^Dr\.?\s*/i, "")?.[0] || "D"}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-slate-900 text-sm">
                    {d.name}
                  </Text>
                  <Text className="text-slate-400 text-xs">
                    {d.qualification}
                  </Text>
                  {!!d.specialization && (
                    <Text className="text-slate-400 text-[11px]">
                      {d.specialization}
                    </Text>
                  )}
                </View>
                <Text className="font-bold text-brand-700">
                  ₹{d.consultation_fee}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {step === 2 && selectedDoctor && (
          <View>
            <Text className="font-bold text-slate-900 text-base mb-1">
              Select Date & Time
            </Text>
            <Text className="text-slate-500 text-xs mb-3">
              with {selectedDoctor.name}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mb-5"
              contentContainerStyle={{ gap: 8 }}
            >
              {dateOptions.map((d) => {
                const isSelected =
                  selectedDate &&
                  d.toDateString() === selectedDate.toDateString();
                return (
                  <Pressable
                    key={d.toISOString()}
                    onPress={() => pickDate(d)}
                    className={`items-center px-3 py-2.5 rounded-xl ${isSelected ? "bg-brand-600" : "bg-slate-100"}`}
                    style={{ minWidth: 56 }}
                  >
                    <Text
                      className={`text-[10px] font-medium ${isSelected ? "text-brand-100" : "text-slate-400"}`}
                    >
                      {d.toLocaleDateString("en-IN", { weekday: "short" })}
                    </Text>
                    <Text
                      className={`text-base font-bold ${isSelected ? "text-white" : "text-slate-800"}`}
                    >
                      {d.getDate()}
                    </Text>
                    <Text
                      className={`text-[10px] ${isSelected ? "text-brand-100" : "text-slate-400"}`}
                    >
                      {d.toLocaleDateString("en-IN", { month: "short" })}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {selectedDate && (
              <View className="mb-5">
                <Text className="text-slate-700 font-medium text-sm mb-3">
                  Available Slots
                </Text>
                {slotsLoading ? (
                  <ActivityIndicator color="#1d4ed8" />
                ) : slots.length === 0 ? (
                  <Text className="text-red-500 text-sm">
                    No slots available. Try another date.
                  </Text>
                ) : (
                  <View className="flex-row flex-wrap gap-2">
                    {slots.map((s) => (
                      <Pressable
                        key={s}
                        onPress={() => setSelectedSlot(s)}
                        className={`px-4 py-2.5 rounded-xl border-2 ${selectedSlot === s ? "bg-brand-600 border-brand-600" : "bg-white border-slate-200"}`}
                      >
                        <Text
                          className={`text-xs font-semibold ${selectedSlot === s ? "text-white" : "text-slate-700"}`}
                        >
                          {s}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            )}

            <View className="flex-row gap-3">
              <Button
                label="Back"
                variant="outline"
                onPress={() => setStep(1)}
                className="flex-1"
              />
              <Button
                label="Next"
                onPress={() =>
                  selectedSlot
                    ? setStep(3)
                    : Toast.show({ type: "error", text1: "Select a time slot" })
                }
                className="flex-1"
              />
            </View>
          </View>
        )}

        {step === 3 && (
          <View>
            <View className="mb-5">
              <Text className="font-bold text-slate-900 text-lg">
                Patient Details
              </Text>

              <Text className="text-slate-400 text-xs mt-1">
                Enter patient information. Only mobile number is required.
              </Text>
            </View>

            {/* Basic Information */}
            <FormSection icon="person-outline" title="Basic Information">
              <InputField label="Mobile Number *">
                <View className="flex-row items-center border border-slate-200 rounded-xl overflow-hidden bg-white">
                  <View className="px-3.5 py-3.5 bg-slate-50 border-r border-slate-200">
                    <Text className="text-slate-500 text-sm font-medium">
                      +91
                    </Text>
                  </View>

                  <TextInput
                    keyboardType="number-pad"
                    maxLength={10}
                    placeholder="10-digit mobile"
                    placeholderTextColor="#94a3b8"
                    value={patientForm.mobile}
                    onChangeText={(text) =>
                      updatePatient("mobile", text.replace(/\D/g, ""))
                    }
                    className="flex-1 px-4 py-3.5 text-sm text-slate-900"
                  />
                </View>

                <Text className="text-slate-400 text-[10px] mt-1.5">
                  Existing patient will be detected automatically by mobile
                  number.
                </Text>
              </InputField>

              <ReceptionFamilySelect
                mobile={patientForm.mobile}
                value={familySel}
                onChange={setFamilySel}
                onHolder={(h) => {
                  if (h?.name && !patientForm.name) updatePatient("name", h.name);
                }}
              />

              <InputField label="Full Name">
                <TextInput
                  placeholder="Patient full name"
                  placeholderTextColor="#94a3b8"
                  value={patientForm.name}
                  onChangeText={(text) => updatePatient("name", text)}
                  className="border border-slate-200 bg-white rounded-xl px-4 py-3.5 text-sm text-slate-900"
                />
              </InputField>

              <InputField label="Father's / Husband's Name">
                <TextInput
                  placeholder="Father's / husband's name"
                  placeholderTextColor="#94a3b8"
                  value={patientForm.father_husband_name}
                  onChangeText={(text) =>
                    updatePatient("father_husband_name", text)
                  }
                  className="border border-slate-200 bg-white rounded-xl px-4 py-3.5 text-sm text-slate-900"
                />
              </InputField>

              <InputField label="Email">
                <TextInput
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholder="patient@example.com"
                  placeholderTextColor="#94a3b8"
                  value={patientForm.email}
                  onChangeText={(text) => updatePatient("email", text)}
                  className="border border-slate-200 bg-white rounded-xl px-4 py-3.5 text-sm text-slate-900"
                />
              </InputField>
            </FormSection>

            {/* Personal Details */}
            <FormSection icon="id-card-outline" title="Personal Details">
              <InputField label="Gender">
                <View className="flex-row gap-2">
                  {["male", "female", "other"].map((gender) => (
                    <Pressable
                      key={gender}
                      onPress={() => updatePatient("gender", gender)}
                      className={`flex-1 py-3 rounded-xl border-2 items-center ${
                        patientForm.gender === gender
                          ? "bg-brand-600 border-brand-600"
                          : "bg-white border-slate-200"
                      }`}
                    >
                      <Text
                        className={`text-xs font-semibold capitalize ${
                          patientForm.gender === gender
                            ? "text-white"
                            : "text-slate-600"
                        }`}
                      >
                        {gender}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </InputField>

              <InputField label="Date of Birth">
                <TextInput
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#94a3b8"
                  value={patientForm.dob}
                  onChangeText={(text) => updatePatient("dob", text)}
                  className="border border-slate-200 bg-white rounded-xl px-4 py-3.5 text-sm text-slate-900"
                />
              </InputField>

              <InputField label="Nationality">
                <TextInput
                  placeholder="e.g. Indian"
                  placeholderTextColor="#94a3b8"
                  value={patientForm.nationality}
                  onChangeText={(text) => updatePatient("nationality", text)}
                  className="border border-slate-200 bg-white rounded-xl px-4 py-3.5 text-sm text-slate-900"
                />
              </InputField>

              <InputField label="Marital Status">
                <View className="flex-row flex-wrap gap-2">
                  {[
                    ["unmarried", "Unmarried"],
                    ["married", "Married"],
                    ["other", "Other"],
                  ].map(([key, label]) => (
                    <Pressable
                      key={key}
                      onPress={() => updatePatient("marital_status", key)}
                      className={`px-4 py-3 rounded-xl border-2 ${
                        patientForm.marital_status === key
                          ? "bg-brand-600 border-brand-600"
                          : "bg-white border-slate-200"
                      }`}
                    >
                      <Text
                        className={`text-xs font-semibold ${
                          patientForm.marital_status === key
                            ? "text-white"
                            : "text-slate-600"
                        }`}
                      >
                        {label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </InputField>
            </FormSection>

            {/* Permanent Address */}
            <FormSection icon="location-outline" title="Permanent Address">
              <InputField label="Address">
                <TextInput
                  placeholder="Permanent address"
                  placeholderTextColor="#94a3b8"
                  value={patientForm.permanent_address}
                  onChangeText={(text) =>
                    updatePatient("permanent_address", text)
                  }
                  multiline
                  textAlignVertical="top"
                  className="border border-slate-200 bg-white rounded-xl px-4 py-3.5 text-sm text-slate-900 min-h-[90px]"
                />
              </InputField>

              <InputField label="Pin Code">
                <TextInput
                  keyboardType="number-pad"
                  maxLength={6}
                  placeholder="110025"
                  placeholderTextColor="#94a3b8"
                  value={patientForm.permanent_pincode}
                  onChangeText={(text) =>
                    updatePatient("permanent_pincode", text.replace(/\D/g, ""))
                  }
                  className="border border-slate-200 bg-white rounded-xl px-4 py-3.5 text-sm text-slate-900"
                />
              </InputField>
            </FormSection>

            {/* Local Address */}
            <FormSection icon="home-outline" title="Local Address">
              <InputField label="Address">
                <TextInput
                  placeholder="Local / current address"
                  placeholderTextColor="#94a3b8"
                  value={patientForm.local_address}
                  onChangeText={(text) => updatePatient("local_address", text)}
                  multiline
                  textAlignVertical="top"
                  className="border border-slate-200 bg-white rounded-xl px-4 py-3.5 text-sm text-slate-900 min-h-[90px]"
                />
              </InputField>

              <InputField label="Pin Code">
                <TextInput
                  keyboardType="number-pad"
                  maxLength={6}
                  placeholder="110025"
                  placeholderTextColor="#94a3b8"
                  value={patientForm.local_pincode}
                  onChangeText={(text) =>
                    updatePatient("local_pincode", text.replace(/\D/g, ""))
                  }
                  className="border border-slate-200 bg-white rounded-xl px-4 py-3.5 text-sm text-slate-900"
                />
              </InputField>
            </FormSection>

            {/* Referral */}
            <FormSection icon="git-branch-outline" title="Referral Details">
              <InputField label="Referred By">
                <View className="flex-row flex-wrap gap-2">
                  {[
                    ["self", "Self"],
                    ["doctor", "Doctor"],
                    ["hospital", "Hospital"],
                    ["organisation", "Organisation"],
                  ].map(([key, label]) => (
                    <Pressable
                      key={key}
                      onPress={() => {
                        setPatientForm((prev) => ({
                          ...prev,
                          referred_by: key,

                          ...(key === "self"
                            ? {
                                referrer_name: "",
                                referrer_address: "",
                              }
                            : {}),
                        }));
                      }}
                      className={`px-4 py-3 rounded-xl border-2 ${
                        patientForm.referred_by === key
                          ? "bg-brand-600 border-brand-600"
                          : "bg-white border-slate-200"
                      }`}
                    >
                      <Text
                        className={`text-xs font-semibold ${
                          patientForm.referred_by === key
                            ? "text-white"
                            : "text-slate-600"
                        }`}
                      >
                        {label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </InputField>

              {!!patientForm.referred_by &&
                patientForm.referred_by !== "self" && (
                  <>
                    <InputField label="Referrer Name">
                      <TextInput
                        placeholder="Doctor / Hospital / Organisation"
                        placeholderTextColor="#94a3b8"
                        value={patientForm.referrer_name}
                        onChangeText={(text) =>
                          updatePatient("referrer_name", text)
                        }
                        className="border border-slate-200 bg-white rounded-xl px-4 py-3.5 text-sm text-slate-900"
                      />
                    </InputField>

                    <InputField label="Referrer Address">
                      <TextInput
                        placeholder="Referrer address"
                        placeholderTextColor="#94a3b8"
                        value={patientForm.referrer_address}
                        onChangeText={(text) =>
                          updatePatient("referrer_address", text)
                        }
                        multiline
                        textAlignVertical="top"
                        className="border border-slate-200 bg-white rounded-xl px-4 py-3.5 text-sm text-slate-900 min-h-[80px]"
                      />
                    </InputField>
                  </>
                )}
            </FormSection>

            {/* Appointment Reason */}
            <FormSection icon="document-text-outline" title="Appointment Notes">
              <InputField label="Reason / Notes">
                <TextInput
                  placeholder="Optional reason for visit"
                  placeholderTextColor="#94a3b8"
                  value={patientForm.reason}
                  onChangeText={(text) => updatePatient("reason", text)}
                  multiline
                  textAlignVertical="top"
                  className="border border-slate-200 bg-white rounded-xl px-4 py-3.5 text-sm text-slate-900 min-h-[90px]"
                />
              </InputField>
            </FormSection>

            <View className="flex-row gap-3 mt-2">
              <Button
                label="Back"
                variant="outline"
                onPress={() => setStep(2)}
                className="flex-1"
              />

              <Button
                label="Next"
                onPress={() => {
                  if (!/^[6-9]\d{9}$/.test(patientForm.mobile)) {
                    Toast.show({
                      type: "error",
                      text1: "Valid mobile required",
                    });

                    return;
                  }

                  if (familySel._adding && !familySel.new_member) {
                    Toast.show({
                      type: "error",
                      text1: "Enter family member name (DOB as YYYY-MM-DD)",
                    });
                    return;
                  }

                  setStep(4);
                }}
                className="flex-1"
              />
            </View>
          </View>
        )}

        {step === 4 && (
          <View>
            <Text className="font-bold text-slate-900 text-base mb-4">
              Review & Payment
            </Text>
            <View className="bg-slate-50 rounded-2xl p-4 mb-5">
              <Row label="Doctor" value={selectedDoctor.name} />
              <Row
                label="Date & Time"
                value={`${selectedDate.toLocaleDateString("en-IN")} at ${selectedSlot}`}
              />
            <Row label="Mobile owner" value={`${patientForm.name || "Unnamed"} • ${patientForm.mobile}`} />
            {(familySel.new_member || familySel.member_patient_id) ? (
              <Row
                label="Appointment for"
                value={
                  familySel.new_member
                    ? `${familySel.new_member.name} (${relationLabel(familySel.new_member.relation)}) • new`
                    : familySel._label || "Family member"
                }
              />
            ) : null}
              <View className="flex-row justify-between pt-3 mt-2 border-t border-slate-200">
                <Text className="font-bold text-slate-900">Amount Due</Text>
                <Text className="font-bold text-brand-700 text-base">
                  ₹{fee}
                </Text>
              </View>
            </View>

            <Text className="text-xs font-semibold text-slate-500 uppercase mb-2">
              Collect Payment
            </Text>
            <View className="gap-2 mb-5">
              {[
                {
                  key: "cash",
                  label: "Cash at clinic (mark paid now)",
                  icon: "cash",
                },
                {
                  key: "card",
                  label: "Card at clinic (mark paid now)",
                  icon: "card",
                },
                {
                  key: "upi",
                  label: "UPI at clinic (mark paid now)",
                  icon: "qr-code",
                },
                {
                  key: "pending",
                  label: "Collect later / pay online",
                  icon: "time",
                },
              ].map((opt) => (
                <Pressable
                  key={opt.key}
                  onPress={() => setPaymentMethod(opt.key)}
                  className={`flex-row items-center gap-3 px-4 py-3 rounded-xl border-2 ${paymentMethod === opt.key ? "bg-brand-50 border-brand-600" : "border-slate-200"}`}
                >
                  <Ionicons
                    name={opt.icon}
                    size={18}
                    color={paymentMethod === opt.key ? "#1d4ed8" : "#94a3b8"}
                  />
                  <Text
                    className={`text-sm font-medium ${paymentMethod === opt.key ? "text-brand-700" : "text-slate-600"}`}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View className="flex-row gap-3">
              <Button
                label="Back"
                variant="outline"
                onPress={() => setStep(3)}
                className="flex-1"
              />
              <Button
                label="Confirm Booking"
                icon="checkmark-circle"
                onPress={submit}
                loading={loading}
                className="flex-1"
              />
            </View>
          </View>
        )}

        {step === 5 && done && (
          <View className="items-center py-10">
            <View className="w-20 h-20 rounded-full bg-green-100 items-center justify-center mb-5">
              <Ionicons name="checkmark-circle" size={44} color="#16a34a" />
            </View>
            <Text className="text-xl font-extrabold text-slate-900 mb-1">
              Booked!
            </Text>
            <Text className="text-slate-500 text-sm mb-6 text-center">
              Appointment {done.appointment_code} confirmed.
            </Text>
            <Button
              label="Book Another"
              icon="add-circle"
              onPress={reset}
              className="w-full"
            />
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

function Row({ label, value }) {
  return (
    <View className="flex-row justify-between py-1.5">
      <Text className="text-slate-500 text-sm">{label}</Text>
      <Text className="font-medium text-slate-800 text-sm">{value}</Text>
    </View>
  );
}

function FormSection({ icon, title, children }) {
  return (
    <View className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-4">
      <View className="flex-row items-center gap-2 mb-4">
        <View className="w-8 h-8 rounded-lg bg-brand-100 items-center justify-center">
          <Ionicons name={icon} size={16} color="#1d4ed8" />
        </View>

        <Text className="font-bold text-slate-800 text-sm">{title}</Text>
      </View>

      <View className="gap-4">{children}</View>
    </View>
  );
}

function InputField({ label, children }) {
  return (
    <View>
      <Text className="text-xs font-semibold text-slate-500 uppercase mb-1.5">
        {label}
      </Text>

      {children}
    </View>
  );
}
