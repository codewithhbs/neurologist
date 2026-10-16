import { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, TextInput, ActivityIndicator, ScrollView, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import client from "../api/client";
import { RELATIONS, relationLabel, ageFromDob } from "../utils/family";

const inputCls = "border border-slate-200 bg-white rounded-xl px-4 py-3 text-sm text-slate-900";

// ---------------------------------------------------------------
// Member form (name, relation, gender, dob) — controlled
// ---------------------------------------------------------------
export function MemberFields({ value, onChange }) {
  const set = (k, v) => onChange({ ...value, [k]: v });
  return (
    <View style={{ gap: 10 }}>
      <View>
        <Text className="text-xs font-semibold text-slate-600 mb-1">Full name *</Text>
        <TextInput
          value={value.name}
          onChangeText={(t) => set("name", t)}
          placeholder="Family member name"
          placeholderTextColor="#94a3b8"
          className={inputCls}
        />
      </View>
      <View>
        <Text className="text-xs font-semibold text-slate-600 mb-1">Relation</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {RELATIONS.map(([v, l]) => {
            const active = value.relation === v;
            return (
              <Pressable
                key={v}
                onPress={() => set("relation", v)}
                className={`mr-2 px-3 py-2 rounded-full border ${active ? "bg-brand-600 border-brand-600" : "bg-white border-slate-200"}`}
              >
                <Text className={`text-xs font-semibold ${active ? "text-white" : "text-slate-700"}`}>{l}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
      <View>
        <Text className="text-xs font-semibold text-slate-600 mb-1">Gender</Text>
        <View className="flex-row gap-2">
          {["male", "female", "other"].map((g) => {
            const active = value.gender === g;
            return (
              <Pressable
                key={g}
                onPress={() => set("gender", active ? "" : g)}
                className={`flex-1 py-2.5 rounded-xl border items-center ${active ? "bg-brand-50 border-brand-600" : "bg-white border-slate-200"}`}
              >
                <Text className={`text-xs font-semibold capitalize ${active ? "text-brand-700" : "text-slate-600"}`}>{g}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      <View>
        <Text className="text-xs font-semibold text-slate-600 mb-1">Date of birth (YYYY-MM-DD)</Text>
        <TextInput
          value={value.dob}
          onChangeText={(t) => set("dob", t.replace(/[^\d-]/g, "").slice(0, 10))}
          placeholder="2015-06-21"
          placeholderTextColor="#94a3b8"
          keyboardType="numbers-and-punctuation"
          className={inputCls}
        />
      </View>
    </View>
  );
}

export const emptyMember = { name: "", relation: "spouse", gender: "", dob: "" };
const validDob = (d) => !d || /^\d{4}-\d{2}-\d{2}$/.test(d);
export const cleanMember = (m) => ({
  name: m.name.trim(),
  relation: m.relation,
  gender: m.gender || null,
  dob: m.dob || null,
});

function PersonChip({ name, sub, active, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center gap-3 rounded-2xl border-2 px-3 py-3 mb-2 ${active ? "border-brand-600 bg-brand-50" : "border-slate-200 bg-white"}`}
    >
      <View className={`w-9 h-9 rounded-xl items-center justify-center ${active ? "bg-brand-600" : "bg-slate-100"}`}>
        <Text className={`font-bold ${active ? "text-white" : "text-slate-600"}`}>
          {(name || "?").trim().charAt(0).toUpperCase()}
        </Text>
      </View>
      <View className="flex-1">
        <Text className="font-semibold text-slate-900 text-sm" numberOfLines={1}>{name || "—"}</Text>
        <Text className="text-[11px] text-slate-500">{sub}</Text>
      </View>
      {active && <Ionicons name="checkmark-circle" size={20} color="#1d4ed8" />}
    </Pressable>
  );
}

// ---------------------------------------------------------------
// PATIENT: "Who is this appointment for?"  (value = patient id)
// ---------------------------------------------------------------
export function PatientFamilyPicker({ value, onChange }) {
  const [self, setSelf] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState(emptyMember);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await client.get("/patients/family");
        setSelf(res.data.self);
        setMembers(res.data.members || []);
        if (!value && res.data.self) onChange(res.data.self.id);
      } catch (e) {}
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const add = async () => {
    if (!draft.name.trim()) return Toast.show({ type: "error", text1: "Enter member name" });
    if (!validDob(draft.dob)) return Toast.show({ type: "error", text1: "DOB format YYYY-MM-DD" });
    setSaving(true);
    try {
      const res = await client.post("/patients/family", cleanMember(draft));
      setMembers((l) => [...l, res.data.member]);
      onChange(res.data.member.id);
      setAdding(false);
      setDraft(emptyMember);
    } catch (e) {
      Toast.show({ type: "error", text1: e.response?.data?.message || "Failed to add member" });
    }
    setSaving(false);
  };

  if (loading) return <ActivityIndicator color="#1d4ed8" style={{ marginVertical: 12 }} />;
  if (!self) return null;

  return (
    <View className="mb-4">
      <Text className="font-bold text-slate-900 mb-1">Who is this appointment for?</Text>
      <Text className="text-xs text-slate-500 mb-3">Book for yourself or a family member.</Text>
      <PersonChip
        name={self.name || "Me"}
        sub="Myself"
        active={String(value) === String(self.id)}
        onPress={() => onChange(self.id)}
      />
      {members.map((m) => {
        const age = ageFromDob(m.dob);
        return (
          <PersonChip
            key={m.id}
            name={m.name}
            sub={`${relationLabel(m.relation)}${age !== null ? ` · ${age} yrs` : ""}`}
            active={String(value) === String(m.id)}
            onPress={() => onChange(m.id)}
          />
        );
      })}
      {adding ? (
        <View className="bg-slate-50 rounded-2xl p-3 border border-slate-200">
          <MemberFields value={draft} onChange={setDraft} />
          <View className="flex-row gap-2 mt-3">
            <Pressable onPress={() => setAdding(false)} className="flex-1 border border-slate-200 rounded-xl py-3 items-center bg-white">
              <Text className="text-slate-600 font-semibold text-sm">Cancel</Text>
            </Pressable>
            <Pressable onPress={add} disabled={saving} className="flex-1 bg-brand-600 rounded-xl py-3 items-center">
              {saving ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-semibold text-sm">Add & select</Text>}
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable
          onPress={() => setAdding(true)}
          className="flex-row items-center justify-center gap-2 border-2 border-dashed border-slate-300 rounded-2xl py-3"
        >
          <Ionicons name="person-add-outline" size={16} color="#1d4ed8" />
          <Text className="text-brand-700 font-semibold text-sm">Add family member</Text>
        </Pressable>
      )}
    </View>
  );
}

// ---------------------------------------------------------------
// PATIENT profile: manage family list
// ---------------------------------------------------------------
export function FamilyManager() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState(null); // null | 'add' | memberId
  const [draft, setDraft] = useState(emptyMember);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const res = await client.get("/patients/family");
      setMembers(res.data.members || []);
    } catch (e) {}
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const open = (m) => {
    setMode(m ? m.id : "add");
    setDraft(
      m
        ? { name: m.name || "", relation: m.relation || "other", gender: m.gender || "", dob: m.dob ? String(m.dob).slice(0, 10) : "" }
        : emptyMember,
    );
  };

  const save = async () => {
    if (!draft.name.trim()) return Toast.show({ type: "error", text1: "Enter member name" });
    if (!validDob(draft.dob)) return Toast.show({ type: "error", text1: "DOB format YYYY-MM-DD" });
    setSaving(true);
    try {
      if (mode === "add") {
        const res = await client.post("/patients/family", cleanMember(draft));
        setMembers((l) => [...l, res.data.member]);
      } else {
        const res = await client.put(`/patients/family/${mode}`, cleanMember(draft));
        setMembers((l) => l.map((x) => (x.id === mode ? res.data.member : x)));
      }
      Toast.show({ type: "success", text1: "Saved" });
      setMode(null);
    } catch (e) {
      Toast.show({ type: "error", text1: e.response?.data?.message || "Failed to save" });
    }
    setSaving(false);
  };

  const remove = (m) =>
    Alert.alert("Remove member?", m.name, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            await client.delete(`/patients/family/${m.id}`);
            setMembers((l) => l.filter((x) => x.id !== m.id));
          } catch (e) {
            Toast.show({ type: "error", text1: e.response?.data?.message || "Failed to remove" });
          }
        },
      },
    ]);

  return (
    <View>
      {loading ? (
        <ActivityIndicator color="#1d4ed8" />
      ) : (
        <>
          {members.length === 0 && mode === null && (
            <Text className="text-slate-400 text-sm text-center py-4">
              No family members yet. Add spouse, kids or parents to book for them.
            </Text>
          )}
          {members.map((m) =>
            mode === m.id ? null : (
              <View key={m.id} className="flex-row items-center gap-3 bg-white border border-slate-100 rounded-2xl p-3 mb-2">
                <View className="w-10 h-10 rounded-xl bg-brand-50 items-center justify-center">
                  <Text className="font-bold text-brand-700">{(m.name || "?").charAt(0).toUpperCase()}</Text>
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-slate-900">{m.name}</Text>
                  <Text className="text-[11px] text-slate-500">
                    {relationLabel(m.relation)}
                    {ageFromDob(m.dob) !== null ? ` · ${ageFromDob(m.dob)} yrs` : ""}
                  </Text>
                </View>
                <Pressable onPress={() => open(m)} className="p-2">
                  <Ionicons name="create-outline" size={18} color="#334155" />
                </Pressable>
                <Pressable onPress={() => remove(m)} className="p-2">
                  <Ionicons name="trash-outline" size={18} color="#dc2626" />
                </Pressable>
              </View>
            ),
          )}
          {mode !== null ? (
            <View className="bg-slate-50 rounded-2xl p-3 border border-slate-200 mt-1">
              <Text className="font-bold text-slate-900 mb-2">{mode === "add" ? "Add member" : "Edit member"}</Text>
              <MemberFields value={draft} onChange={setDraft} />
              <View className="flex-row gap-2 mt-3">
                <Pressable onPress={() => setMode(null)} className="flex-1 border border-slate-200 rounded-xl py-3 items-center bg-white">
                  <Text className="text-slate-600 font-semibold text-sm">Cancel</Text>
                </Pressable>
                <Pressable onPress={save} disabled={saving} className="flex-1 bg-brand-600 rounded-xl py-3 items-center">
                  {saving ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-semibold text-sm">Save</Text>}
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable
              onPress={() => open(null)}
              className="flex-row items-center justify-center gap-2 border-2 border-dashed border-slate-300 rounded-2xl py-3 mt-1"
            >
              <Ionicons name="person-add-outline" size={16} color="#1d4ed8" />
              <Text className="text-brand-700 font-semibold text-sm">Add family member</Text>
            </Pressable>
          )}
        </>
      )}
    </View>
  );
}

// ---------------------------------------------------------------
// RECEPTION: pick holder / member / new member for a mobile number
// value = { member_patient_id, new_member, _adding }
// ---------------------------------------------------------------
export function ReceptionFamilySelect({ mobile, value, onChange, onHolder }) {
  const [holder, setHolder] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState(emptyMember);
  const req = useRef(0);
  const valid = /^[6-9]\d{9}$/.test(mobile || "");

  useEffect(() => {
    setHolder(null);
    setMembers([]);
    setDraft(emptyMember);
    onChange({ member_patient_id: "", new_member: null, _adding: false });
    if (!valid) return;
    const id = ++req.current;
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await client.get("/admin/patients/family-lookup", { params: { mobile } });
        if (id !== req.current) return;
        setHolder(res.data.holder || null);
        setMembers(res.data.members || []);
        onHolder?.(res.data.holder || null);
      } catch (e) {}
      if (id === req.current) setLoading(false);
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mobile]);

  if (!valid) return null;

  const adding = !!value?._adding;
  const selected = value?.member_patient_id || "";
  const pick = (id, label = "") =>
    onChange({ member_patient_id: id, new_member: null, _adding: false, _label: label });
  const setD = (d) => {
    setDraft(d);
    onChange({
      member_patient_id: "",
      _adding: true,
      new_member: d.name.trim() && validDob(d.dob) ? cleanMember(d) : null,
    });
  };

  return (
    <View className="bg-slate-50 rounded-2xl border border-slate-200 p-3 mb-4">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="font-bold text-slate-900 text-sm">Appointment for</Text>
        {loading ? (
          <ActivityIndicator size="small" color="#1d4ed8" />
        ) : (
          <Text className={`text-[11px] ${holder ? "text-slate-500" : "text-amber-600"}`}>
            {holder ? `${members.length} family member(s)` : "New number"}
          </Text>
        )}
      </View>
      <PersonChip
        name={holder?.name || "Mobile owner"}
        sub="Self (account holder)"
        active={!adding && !selected}
        onPress={() => pick("")}
      />
      {members.map((m) => (
        <PersonChip
          key={m.id}
          name={m.name}
          sub={`${relationLabel(m.relation)}${m.patient_id ? ` · ID ${m.patient_id}` : ""}`}
          active={!adding && String(selected) === String(m.id)}
          onPress={() => pick(m.id, `${m.name} (${relationLabel(m.relation)})`)}
        />
      ))}
      {adding ? (
        <View className="bg-white rounded-2xl p-3 border border-slate-200">
          <MemberFields value={draft} onChange={setD} />
          <Pressable onPress={() => pick("")} className="items-center mt-3">
            <Text className="text-slate-400 text-xs">Cancel new member</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          onPress={() => {
            setDraft(emptyMember);
            onChange({ member_patient_id: "", new_member: null, _adding: true });
          }}
          className="flex-row items-center justify-center gap-2 border-2 border-dashed border-slate-300 rounded-2xl py-3"
        >
          <Ionicons name="person-add-outline" size={16} color="#1d4ed8" />
          <Text className="text-brand-700 font-semibold text-sm">Add family member</Text>
        </Pressable>
      )}
      <Text className="text-[10px] text-slate-400 mt-2">
        Name/details below are for the mobile owner (account holder).
      </Text>
    </View>
  );
}
