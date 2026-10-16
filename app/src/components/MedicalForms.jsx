import { useState } from 'react';
import { View, Text, TextInput, Pressable, Image, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import client from '../api/client';
import Button from './Button';

async function uploadAsset(folder, asset, setUploading) {
  setUploading(true);
  try {
    const formData = new FormData();
    formData.append('file', {
      uri: asset.uri,
      name: asset.fileName || `${folder}-${Date.now()}.jpg`,
      type: asset.mimeType || 'image/jpeg',
    });
    const res = await client.post(`/admin/upload/${folder}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.url;
  } catch (e) {
    Toast.show({ type: 'error', text1: 'Image upload failed' });
    return null;
  } finally {
    setUploading(false);
  }
}

async function pickFromGallery(folder, setUploading) {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    Toast.show({ type: 'error', text1: 'Gallery permission needed' });
    return null;
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.7,
  });
  if (result.canceled) return null;
  return uploadAsset(folder, result.assets[0], setUploading);
}

async function captureFromCamera(folder, setUploading) {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) {
    Toast.show({ type: 'error', text1: 'Camera permission needed' });
    return null;
  }
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.7,
  });
  if (result.canceled) return null;
  return uploadAsset(folder, result.assets[0], setUploading);
}

function AttachmentPicker({ folder, urls, setUrls }) {
  const [uploading, setUploading] = useState(false);

  const fromCamera = async () => {
    const url = await captureFromCamera(folder, setUploading);
    if (url) setUrls((prev) => [...prev, url]);
  };

  const fromGallery = async () => {
    const url = await pickFromGallery(folder, setUploading);
    if (url) setUrls((prev) => [...prev, url]);
  };

  const removeImage = (url) => setUrls((prev) => prev.filter((u) => u !== url));

  return (
    <View className="mb-3">
      <Text className="text-xs font-semibold text-slate-500 uppercase mb-1.5">Attach Photo (optional)</Text>
      <View className="flex-row flex-wrap gap-2 mb-2">
        {urls.map((url) => (
          <View key={url} className="relative">
            <Image source={{ uri: url }} style={{ width: 64, height: 64, borderRadius: 10 }} />
            <Pressable
              onPress={() => removeImage(url)}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 items-center justify-center"
            >
              <Ionicons name="close" size={12} color="#fff" />
            </Pressable>
          </View>
        ))}
      </View>

      {uploading ? (
        <View className="flex-row items-center gap-2 py-2">
          <ActivityIndicator size="small" color="#1d4ed8" />
          <Text className="text-slate-400 text-xs">Uploading...</Text>
        </View>
      ) : (
        <View className="flex-row gap-2">
          <Pressable onPress={fromCamera} className="flex-1 flex-row items-center justify-center gap-2 border-2 border-dashed border-slate-300 rounded-xl py-3 bg-slate-50">
            <Ionicons name="camera" size={16} color="#1d4ed8" />
            <Text className="text-brand-700 text-xs font-semibold">Take Photo</Text>
          </Pressable>
          <Pressable onPress={fromGallery} className="flex-1 flex-row items-center justify-center gap-2 border-2 border-dashed border-slate-300 rounded-xl py-3 bg-slate-50">
            <Ionicons name="image" size={16} color="#1d4ed8" />
            <Text className="text-brand-700 text-xs font-semibold">Gallery</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

export function HistoryForm({ patientId, appointmentId, doctorId, onDone }) {
  const [title, setTitle] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [attachmentUrls, setAttachmentUrls] = useState([]);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await client.post('/admin/medical-history', {
        patient_id: patientId,
        appointment_id: appointmentId || undefined,
        doctor_id: doctorId || undefined,
        title, diagnosis, treatment_notes: notes,
        attachment_urls: attachmentUrls,
        visit_date: new Date().toISOString().split('T')[0],
      });
      Toast.show({ type: 'success', text1: 'Medical history added' });
      onDone();
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Failed to save' });
    }
    setSaving(false);
  };

  return (
    <View className="bg-slate-50 rounded-2xl p-4 mb-5">
      <Text className="font-bold text-slate-800 text-sm mb-3">New Medical History Entry</Text>
      <TextInput placeholder="Title (e.g. Root Canal)" value={title} onChangeText={setTitle} placeholderTextColor="#94a3b8" className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm mb-2" />
      <TextInput placeholder="Diagnosis" value={diagnosis} onChangeText={setDiagnosis} placeholderTextColor="#94a3b8" className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm mb-2" multiline />
      <TextInput placeholder="Treatment notes" value={notes} onChangeText={setNotes} placeholderTextColor="#94a3b8" className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm mb-3" multiline />
      <AttachmentPicker folder="medical-history" urls={attachmentUrls} setUrls={setAttachmentUrls} />
      <Button label="Save Entry" onPress={save} loading={saving} />
    </View>
  );
}

export function PrescriptionForm({ patientId, appointmentId, doctorId, onDone }) {
  const [medicines, setMedicines] = useState('');
  const [notes, setNotes] = useState('');
  const [attachmentUrls, setAttachmentUrls] = useState([]);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const medicines_json = medicines.split('\n').filter(Boolean).map((line) => ({ name: line.trim() }));
      await client.post('/admin/prescriptions', {
        patient_id: patientId,
        appointment_id: appointmentId || undefined,
        doctor_id: doctorId || undefined,
        medicines_json, notes,
        attachment_urls: attachmentUrls,
        prescribed_date: new Date().toISOString().split('T')[0],
      });
      Toast.show({ type: 'success', text1: 'Prescription added' });
      onDone();
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Failed to save' });
    }
    setSaving(false);
  };

  return (
    <View className="bg-slate-50 rounded-2xl p-4 mb-5">
      <Text className="font-bold text-slate-800 text-sm mb-3">New Prescription</Text>
      <TextInput placeholder={'One medicine per line\ne.g. Amoxicillin 500mg - 3x/day'} value={medicines} onChangeText={setMedicines} placeholderTextColor="#94a3b8" className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm mb-2" multiline numberOfLines={4} />
      <TextInput placeholder="Notes" value={notes} onChangeText={setNotes} placeholderTextColor="#94a3b8" className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm mb-3" multiline />
      <AttachmentPicker folder="prescriptions" urls={attachmentUrls} setUrls={setAttachmentUrls} />
      <Button label="Save Prescription" onPress={save} loading={saving} />
    </View>
  );
}