import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiSave, FiTrash2, FiDatabase } from 'react-icons/fi';
import client from '../api/client';
import AdminLayout from '../components/AdminLayout';

const SETTING_KEYS = [
  ['site_name', 'Site Name'],
  ['site_tagline', 'Tagline'],
  ['phone', 'Phone Number'],
  ['whatsapp', 'WhatsApp Number'],
  ['email', 'Email'],
  ['address', 'Address'],
  ['logo_url', 'Logo URL'],
  ['years_experience', 'Years of Experience (display)'],
  ['happy_patients', 'Happy Patients (display)'],
  ['patient_satisfaction', 'Patient Satisfaction (display)'],
  ['visit_timer_minutes', 'Reception Visit Timer (minutes, default 40)']
];

export default function Settings() {
  const [tab, setTab] = useState('general');
  const [settings, setSettings] = useState({});
  const [saving, setSaving] = useState(false);

  const [seoForm, setSeoForm] = useState({ entity_type: 'custom', path: '', meta_title: '', meta_description: '', og_image: '', canonical_url: '' });
  const [clearingCache, setClearingCache] = useState(false);

  const load = async () => {
    const res = await client.get('/settings');
    const map = {};
    res.data.settings.forEach((s) => { map[s.setting_key] = s.setting_value; });
    setSettings(map);
  };
  useEffect(() => { load(); }, []);

  const saveSetting = async (key) => {
    setSaving(true);
    try {
      await client.put('/settings', { key, value: settings[key] || '', type: 'text' });
      toast.success('Saved');
    } catch (e) { toast.error('Failed to save'); }
    setSaving(false);
  };

  const saveAllGeneral = async () => {
    setSaving(true);
    try {
      await Promise.all(SETTING_KEYS.map(([key]) => client.put('/settings', { key, value: settings[key] || '', type: 'text' })));
      toast.success('All settings saved');
    } catch (e) { toast.error('Failed to save some settings'); }
    setSaving(false);
  };

  const saveSeo = async () => {
    try {
      await client.put('/seo', seoForm);
      toast.success('SEO meta saved');
    } catch (e) { toast.error('Failed to save SEO'); }
  };

  const clearCache = async () => {
    if (!confirm('This will clear all server-side cache (OTP sessions, etc). Continue?')) return;
    setClearingCache(true);
    try {
      const res = await client.post('/cache/clear');
      toast.success(res.data.message || 'Cache cleared');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to clear cache');
    }
    setClearingCache(false);
  };

  return (
    <AdminLayout title="Settings & SEO">
      <div className="flex gap-2 mb-6">
        {['general', 'seo', 'maintenance'].map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${tab === t ? 'bg-brand-600 text-white' : 'bg-white border'}`}>{t}</button>
        ))}
      </div>

      {tab === 'general' && (
        <div className="card p-6 max-w-2xl">
          <h3 className="font-bold text-slate-900 mb-5">Site Settings</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {SETTING_KEYS.map(([key, label]) => (
              <div key={key} className={key === 'address' ? 'sm:col-span-2' : ''}>
                <label className="label">{label}</label>
                {key === 'address' ? (
                  <textarea className="input" rows={2} value={settings[key] || ''} onChange={(e) => setSettings({ ...settings, [key]: e.target.value })} />
                ) : (
                  <input className="input" value={settings[key] || ''} onChange={(e) => setSettings({ ...settings, [key]: e.target.value })} />
                )}
              </div>
            ))}
          </div>
          <button onClick={saveAllGeneral} disabled={saving} className="btn-primary mt-6"><FiSave /> {saving ? 'Saving...' : 'Save All Settings'}</button>
        </div>
      )}

      {tab === 'seo' && (
        <div className="card p-6 max-w-2xl">
          <h3 className="font-bold text-slate-900 mb-1">Custom Page SEO Override</h3>
          <p className="text-xs text-slate-500 mb-5">Use this for standalone pages (e.g. home, about, contact). For doctors/services/blogs, SEO is managed on their own edit forms.</p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className="label">Entity Type</label>
              <select className="input" value={seoForm.entity_type} onChange={(e) => setSeoForm({ ...seoForm, entity_type: e.target.value })}>
                <option value="custom">Custom Path</option>
                <option value="clinic">Clinic</option>
              </select>
            </div>
            <div><label className="label">Path (e.g. /about)</label><input className="input" value={seoForm.path} onChange={(e) => setSeoForm({ ...seoForm, path: e.target.value })} /></div>
            <div className="sm:col-span-2"><label className="label">Meta Title</label><input className="input" value={seoForm.meta_title} onChange={(e) => setSeoForm({ ...seoForm, meta_title: e.target.value })} /></div>
            <div className="sm:col-span-2"><label className="label">Meta Description</label><textarea className="input" rows={2} value={seoForm.meta_description} onChange={(e) => setSeoForm({ ...seoForm, meta_description: e.target.value })} /></div>
            <div><label className="label">OG Image URL</label><input className="input" value={seoForm.og_image} onChange={(e) => setSeoForm({ ...seoForm, og_image: e.target.value })} /></div>
            <div><label className="label">Canonical URL</label><input className="input" value={seoForm.canonical_url} onChange={(e) => setSeoForm({ ...seoForm, canonical_url: e.target.value })} /></div>
          </div>
          <button onClick={saveSeo} className="btn-primary mt-6"><FiSave /> Save SEO Meta</button>
        </div>
      )}

      {tab === 'maintenance' && (
        <div className="card p-6 max-w-2xl">
          <h3 className="font-bold text-slate-900 mb-1 flex items-center gap-2"><FiDatabase /> Cache</h3>
          <p className="text-xs text-slate-500 mb-5">
            Clears server-side cache (OTP sessions and any Redis-backed lookups). Use this if you're seeing stale
            data after making changes, or if OTP login is misbehaving. This does not affect your database — only
            temporary cached data.
          </p>
          <button onClick={clearCache} disabled={clearingCache} className="btn-danger">
            <FiTrash2 /> {clearingCache ? 'Clearing...' : 'Clear All Cache'}
          </button>
        </div>
      )}
    </AdminLayout>
  );
}
