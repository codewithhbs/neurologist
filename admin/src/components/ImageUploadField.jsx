import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { FiUpload, FiLoader } from 'react-icons/fi';
import client from '../api/client';

// Works regardless of whether the backend is using Cloudinary or local-disk fallback —
// the backend's /upload/:folder endpoint abstracts that and always returns a usable `url`.
export default function ImageUploadField({ label = 'Image', value, onChange, folder = 'misc' }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    setUploading(true);
    try {
      const res = await client.post(`/upload/${folder}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onChange(res.data.url);
      toast.success(res.data.storage === 'local' ? 'Uploaded (local storage)' : 'Uploaded to Cloudinary');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    }
    setUploading(false);
    e.target.value = '';
  };

  return (
    <div>
      <label className="label">{label}</label>
      <div className="flex gap-2 mb-2">
        <input className="input flex-1" placeholder="Paste image URL, or upload below" value={value || ''} onChange={(e) => onChange(e.target.value)} />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="btn-outline shrink-0 !px-3"
        >
          {uploading ? <FiLoader className="animate-spin" /> : <FiUpload />}
        </button>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>
      {value && <img src={value} alt="preview" className="w-20 h-20 object-cover rounded-lg border border-slate-200" />}
    </div>
  );
}
