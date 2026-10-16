import { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import Constants from "expo-constants";
import client from "../src/api/client";
import { useAuth } from "../src/context/AuthContext";
import AppHeader from "../src/components/AppHeader";
import Button from "../src/components/Button";
import GuestGate from "../src/components/GuestGate";
import { PatientFamilyPicker } from "../src/components/FamilyMembers";
import { payWithRazorpay } from "./RazorpayCheckout";

const STEPS = ["Doctor", "Date & Time", "Confirm"];
const RAZORPAY_KEY_FALLBACK =
  Constants.expoConfig?.extra?.razorpayKeyId || "rzp_test_xxxxxxxx";

function nextNDays(n) {
  const days = [];
  for (let i = 0; i < n; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    days.push(d);
  }
  return days;
}

export default function Appointment() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { isAuthenticated, isGuest, patient } = useAuth();

  const [step, setStep] = useState(1);
  const [clinic, setClinic] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [couponCode, setCouponCode] = useState(params.coupon || "");
  const [couponResult, setCouponResult] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("online"); // 'online' | 'pay_at_clinic'
  const [loading, setLoading] = useState(false);
  const [appointment, setAppointment] = useState(null);
  const [payAtClinicConfirmed, setPayAtClinicConfirmed] = useState(false);
  const [bookFor, setBookFor] = useState(null); // self or family member patient id

  const dateOptions = useMemo(() => nextNDays(21), []);

  useEffect(() => {
    (async () => {
      try {
        const [docRes, clinicRes] = await Promise.all([
          client.get("/doctors"),
          client.get("/clinics"),
        ]);
        const docs = docRes.data.doctors || [];
        setDoctors(docs);
        setClinic((clinicRes.data.clinics || [])[0] || null);

        if (params.doctor) {
          const found = docs.find((d) => d.slug === params.doctor);
          if (found) {
            setSelectedDoctor(found);
            setStep(2);
          }
        }
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
    async (date) => {
      if (!selectedDoctor || !clinic) return;
      setSlotsLoading(true);
      setSlots([]);
      setSelectedSlot("");
      try {
        const dateStr = date.toISOString().split("T")[0];
        const res = await client.get("/appointments/available-slots", {
          params: {
            doctor_id: selectedDoctor.id,
            clinic_id: clinic.id,
            date: dateStr,
          },
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

  const applyCoupon = async () => {
    setCouponError("");
    setCouponResult(null);
    if (!couponCode) return;
    if (!isAuthenticated) {
      setCouponError("Please login to apply a coupon");
      return;
    }
    try {
      const res = await client.post("/patients/coupons/validate", {
        code: couponCode,
        amount: fee,
      });
      setCouponResult(res.data);
    } catch (e) {
      setCouponError(e.response?.data?.message || "Invalid coupon");
    }
  };

  const verifyPayment = async (response) => {
    await client.post("/patients/payments/verify", {
      razorpay_order_id: response.razorpay_order_id,
      razorpay_payment_id: response.razorpay_payment_id,
      razorpay_signature: response.razorpay_signature,
    });
  };

  const confirmBooking = async () => {
    setLoading(true);
    try {
      const dateStr = selectedDate.toISOString().split("T")[0];
      const res = await client.post("/patients/appointments/book", {
        clinic_id: clinic.id,
        doctor_id: selectedDoctor.id,
        appointment_date: dateStr,
        start_time: selectedSlot,
        booked_via: "app",
        coupon_code: couponResult ? couponCode : undefined,
        payment_method: finalAmount === 0 ? undefined : paymentMethod,
        member_patient_id: bookFor || undefined,
      });
      const appt = res.data.appointment;
      setAppointment(appt);

      if (res.data.requiresPayment) {
        const orderRes = await client.post("/patients/payments/create-order", {
          appointment_id: appt.id,
        });

        try {
          const paymentResponse = await payWithRazorpay({
            order: orderRes.data.order,
            keyId: orderRes.data.key_id || RAZORPAY_KEY_FALLBACK,
            description: `Consultation with ${selectedDoctor.name}`,
            prefill: { name: patient?.name, contact: patient?.mobile },
          });

          await verifyPayment(paymentResponse);
          setStep(4);
        } catch (payErr) {
          // user closed checkout or payment failed
          Toast.show({
            type: "info",
            text1: payErr?.description || "Payment cancelled",
          });
        }
      } else {
        setPayAtClinicConfirmed(!!res.data.payAtClinic);
        setStep(4);
      }
    } catch (e) {
      Toast.show({
        type: "error",
        text1: e.response?.data?.message || "Booking failed. Try another slot.",
      });
    }
    setLoading(false);
  };

  const fee = selectedDoctor
    ? parseFloat(selectedDoctor.consultation_fee || 0)
    : 0;
  const discount = couponResult?.discount || 0;
  const finalAmount = Math.max(0, fee - discount);

  return (
    <SafeAreaView
      style={{ flex: 1 }}
      className="flex-1 bg-white"
      edges={["top"]}
    >
      <AppHeader
        title="Book Appointment"
        subtitle="Quick, easy, confirmed in minutes"
      />

      {step < 4 && (
        <View className="flex-row items-center px-5 pt-4 pb-2">
          {STEPS.map((label, i) => {
            const num = i + 1;
            const active = num === step;
            const done = num < step;
            return (
              <View key={label} className="flex-1 flex-row items-center">
                <View
                  className={`w-7 h-7 rounded-full items-center justify-center ${done || active ? "bg-brand-600" : "bg-slate-200"}`}
                >
                  {done ? (
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
                    className={`flex-1 h-0.5 ${done ? "bg-brand-600" : "bg-slate-200"}`}
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
              Choose Your Doctor
            </Text>
            {doctorsLoading && <ActivityIndicator color="#1d4ed8" />}
            {!doctorsLoading && doctors.length === 0 && (
              <Text className="text-slate-400 text-sm">
                No doctors available right now. Please call the clinic.
              </Text>
            )}
            {doctors.map((d) => (
              <Pressable
                key={d.id}
                onPress={() => selectDoctor(d)}
                className="flex-row items-center gap-3 bg-white border-2 border-slate-100 rounded-2xl px-4 py-3"
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
                  Available Time Slots
                </Text>
                {slotsLoading ? (
                  <ActivityIndicator color="#1d4ed8" />
                ) : slots.length === 0 ? (
                  <Text className="text-red-500 text-sm">
                    No slots available for this date. Please try another date.
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
                    : Toast.show({
                        type: "error",
                        text1: "Please select a time slot",
                      })
                }
                className="flex-1"
              />
            </View>
          </View>
        )}

        {step === 3 &&
          (!isAuthenticated ? (
            <GuestGate message="Please login with your mobile number to confirm this appointment." />
          ) : (
            <View>
              <Text className="font-bold text-slate-900 text-base mb-4">
                Review & Confirm
              </Text>
              <PatientFamilyPicker value={bookFor} onChange={setBookFor} />
              <View className="bg-slate-50 rounded-2xl p-4 mb-4">
                <Row label="Doctor" value={selectedDoctor.name} />
                <Row
                  label="Date & Time"
                  value={`${selectedDate.toLocaleDateString("en-IN")} at ${selectedSlot}`}
                />
                <Row label="Consultation Fee" value={`₹${fee}`} />
                {couponResult && (
                  <Row label="Discount" value={`- ₹${discount}`} />
                )}
                <View className="flex-row justify-between pt-3 mt-2 border-t border-slate-200">
                  <Text className="font-bold text-slate-900">
                    Total Payable
                  </Text>
                  <Text className="font-bold text-brand-700 text-base">
                    {finalAmount === 0 ? "Free" : `₹${finalAmount}`}
                  </Text>
                </View>
              </View>

              <View className="flex-row gap-2 mb-2">
                <TextInput
                  placeholder="Coupon code (optional)"
                  value={couponCode}
                  autoCapitalize="characters"
                  onChangeText={(t) => setCouponCode(t.toUpperCase())}
                  className="flex-1 border border-slate-200 rounded-xl px-4 py-3 text-sm"
                />
                <Pressable
                  onPress={applyCoupon}
                  className="border-2 border-brand-600 rounded-xl px-4 items-center justify-center"
                >
                  <Text className="text-brand-700 font-semibold text-xs">
                    Apply
                  </Text>
                </Pressable>
              </View>
              {couponError ? (
                <Text className="text-red-500 text-xs mb-3">{couponError}</Text>
              ) : null}
              {couponResult ? (
                <Text className="text-green-600 text-xs mb-3">
                  Coupon applied! You saved ₹{discount}
                </Text>
              ) : null}

              {finalAmount > 0 && (
                <View className="mb-2">
                  <Text className="text-xs font-semibold text-slate-500 uppercase mb-2">
                    Payment Option
                  </Text>
                  <View className="gap-2">
                    {/* <Pressable
                      onPress={() => setPaymentMethod("online")}
                      className={`flex-row items-center gap-3 px-4 py-3 rounded-xl border-2 ${paymentMethod === "online" ? "bg-brand-50 border-brand-600" : "border-slate-200"}`}
                    >
                      <Ionicons
                        name="card"
                        size={18}
                        color={
                          paymentMethod === "online" ? "#1d4ed8" : "#94a3b8"
                        }
                      />
                      <View className="flex-1">
                        <Text
                          className={`text-sm font-medium ${paymentMethod === "online" ? "text-brand-700" : "text-slate-600"}`}
                        >
                          Pay Online Now
                        </Text>
                        <Text className="text-slate-400 text-[11px]">
                          UPI, card or netbanking via Razorpay
                        </Text>
                      </View>
                    </Pressable> */}
                    <Pressable
                      onPress={() => setPaymentMethod("pay_at_clinic")}
                      className={`flex-row items-center gap-3 px-4 py-3 rounded-xl border-2 ${paymentMethod === "pay_at_clinic" ? "bg-brand-50 border-brand-600" : "border-slate-200"}`}
                    >
                      <Ionicons
                        name="business"
                        size={18}
                        color={
                          paymentMethod === "pay_at_clinic"
                            ? "#1d4ed8"
                            : "#94a3b8"
                        }
                      />
                      <View className="flex-1">
                        <Text
                          className={`text-sm font-medium ${paymentMethod === "pay_at_clinic" ? "text-brand-700" : "text-slate-600"}`}
                        >
                          Pay at Clinic
                        </Text>
                        <Text className="text-slate-400 text-[11px]">
                          Cash, card or UPI when you visit
                        </Text>
                      </View>
                    </Pressable>
                  </View>
                </View>
              )}

              <View className="flex-row gap-3 mt-4">
                <Button
                  label="Back"
                  variant="outline"
                  onPress={() => setStep(2)}
                  className="flex-1"
                />
                <Button
                  label={
                    finalAmount === 0
                      ? "Confirm Free Appointment"
                      : paymentMethod === "pay_at_clinic"
                        ? "Confirm Booking"
                        : `Pay ₹${finalAmount}`
                  }
                  icon={
                    finalAmount === 0 || paymentMethod === "pay_at_clinic"
                      ? "checkmark-circle"
                      : "card"
                  }
                  onPress={confirmBooking}
                  loading={loading}
                  className="flex-1"
                />
              </View>
            </View>
          ))}

        {step === 4 && appointment && (
          <View className="items-center py-10">
            <View className="w-20 h-20 rounded-full bg-green-100 items-center justify-center mb-5">
              <Ionicons name="checkmark-circle" size={44} color="#16a34a" />
            </View>
            <Text className="text-xl font-extrabold text-slate-900 mb-1">
              Appointment Confirmed!
            </Text>
            <Text className="text-slate-500 text-sm mb-6 text-center">
              {payAtClinicConfirmed
                ? "Your appointment is booked. Please pay at the clinic during your visit."
                : "Your appointment has been booked successfully."}
            </Text>

            <View className="bg-slate-50 rounded-2xl p-4 w-full mb-6">
              <Row
                label="Appointment ID"
                value={appointment.appointment_code}
              />
              {appointment.patient_name ? (
                <Row label="Patient" value={appointment.patient_name} />
              ) : null}
              <Row
                label="Date & Time"
                value={`${appointment.appointment_date} ${appointment.start_time}`}
              />
              <Row label="Amount" value={`₹${appointment.final_amount}`} />
            </View>

            <Button
              label="View My Appointments"
              icon="calendar"
              onPress={() => router.replace("/(tabs)/profile")}
              className="w-full"
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
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
