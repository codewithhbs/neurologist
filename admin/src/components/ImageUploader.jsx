import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { FiUpload, FiX, FiLoader } from 'react-icons/fi';
import { getAdminToken } from '../api/client';

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.dentalhealthcareandimplantcentre.in/api/admin';

/**
 * <ImageUploader value={form.photo_url} onChange={(url) => setForm({...form, photo_url: url})} folder="doctors" />
 * Uploads the picked file straight to Cloudinary via the backend's /upload/:folder endpoint
 * and hands the resulting secure URL back through onChange — same field either way,
 * so existing URL-paste forms keep working untouched.
 */
export default function ImageUploader({ value, onChange, folder = 'misc', label }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const pickFile = () => inputRef.current?.click();

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      toast.error('Image must be under 8MB');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_BASE}/upload/${folder}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getAdminToken()}` },
        body: formData
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Upload failed');
      onChange(data.url);
      toast.success('Image uploaded');
    } catch (err) {
      toast.error(err.message || 'Upload failed');
    }
    setUploading(false);
    e.target.value = '';
  };

  return (
    <div>
      {label && <label className="label">{label}</label>}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

      {value ? (
        <div className="relative w-28 h-28 rounded-lg overflow-hidden border border-slate-200 group">
          <img src={value} alt="preview" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <FiX size={14} />
          </button>
          <button
            type="button"
            onClick={pickFile}
            className="absolute inset-x-0 bottom-0 bg-black/50 text-white text-[10px] py-1 text-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            Replace
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={pickFile}
          disabled={uploading}
          className="w-28 h-28 rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-1 text-slate-400 hover:border-brand-400 hover:text-brand-600 transition-colors"
        >
          {uploading ? <FiLoader className="animate-spin" size={18} /> : <FiUpload size={18} />}
          <span className="text-[10px] font-medium">{uploading ? 'Uploading...' : 'Upload'}</span>
        </button>
      )}

      {/* Fallback: still allow pasting a direct URL (e.g. from an existing CDN) */}
      <input
        type="text"
        placeholder="or paste an image URL"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="input mt-2 !text-xs"
      />
    </div>
  );
}
