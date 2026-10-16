import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import client from '../api/client';
import AdminLayout from '../components/AdminLayout';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import ImageUploader from '../components/ImageUploader';

const emptyCoupon = { code: '', title: '', description: '', discount_type: 'percent', discount_value: '', max_discount: '', min_amount: 0, usage_limit: '', per_patient_limit: 1, valid_from: '', valid_till: '' };
const emptyOffer = { title: '', description: '', image_url: '', coupon_id: '', valid_from: '', valid_till: '' };

export default function Coupons() {
  const [tab, setTab] = useState('coupons');
  const [coupons, setCoupons] = useState([]);
  const [offers, setOffers] = useState([]);
  const [couponModal, setCouponModal] = useState(false);
  const [offerModal, setOfferModal] = useState(false);
  const [couponForm, setCouponForm] = useState(emptyCoupon);
  const [offerForm, setOfferForm] = useState(emptyOffer);

  const load = () => {
    client.get('/coupons').then((res) => setCoupons(res.data.coupons));
    client.get('/offers').then((res) => setOffers(res.data.offers));
  };
  useEffect(() => { load(); }, []);

  const saveCoupon = async () => {
    try {
      await client.post('/coupons', couponForm);
      toast.success('Coupon created');
      setCouponModal(false);
      setCouponForm(emptyCoupon);
      load();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to save'); }
  };

  const deleteCoupon = async (id) => { await client.delete(`/coupons/${id}`); load(); };

  const saveOffer = async () => {
    try {
      await client.post('/offers', offerForm);
      toast.success('Offer created');
      setOfferModal(false);
      setOfferForm(emptyOffer);
      load();
    } catch (e) { toast.error('Failed to save'); }
  };
  const deleteOffer = async (id) => { await client.delete(`/offers/${id}`); load(); };

  return (
    <AdminLayout title="Coupons & Offers">
      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab('coupons')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'coupons' ? 'bg-brand-600 text-white' : 'bg-white border'}`}>Coupons</button>
        <button onClick={() => setTab('offers')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'offers' ? 'bg-brand-600 text-white' : 'bg-white border'}`}>Offers</button>
      </div>

      {tab === 'coupons' && (
        <>
          <div className="flex justify-end mb-4"><button onClick={() => setCouponModal(true)} className="btn-primary"><FiPlus /> Add Coupon</button></div>
          <DataTable
            columns={[
              { key: 'code', label: 'Code' },
              { key: 'title', label: 'Title' },
              { key: 'discount_value', label: 'Discount', render: (r) => r.discount_type === 'flat' ? `₹${r.discount_value}` : `${r.discount_value}%` },
              { key: 'used_count', label: 'Used', render: (r) => `${r.used_count}${r.usage_limit ? ` / ${r.usage_limit}` : ''}` },
              { key: 'valid_till', label: 'Valid Till', render: (r) => r.valid_till || '—' }
            ]}
            rows={coupons}
            actions={(row) => <button onClick={() => deleteCoupon(row.id)} className="btn-danger !px-2 !py-1"><FiTrash2 /></button>}
          />
        </>
      )}

      {tab === 'offers' && (
        <>
          <div className="flex justify-end mb-4"><button onClick={() => setOfferModal(true)} className="btn-primary"><FiPlus /> Add Offer</button></div>
          <DataTable
            columns={[
              { key: 'title', label: 'Title' },
              { key: 'description', label: 'Description' },
              { key: 'valid_till', label: 'Valid Till', render: (r) => r.valid_till || '—' }
            ]}
            rows={offers}
            actions={(row) => <button onClick={() => deleteOffer(row.id)} className="btn-danger !px-2 !py-1"><FiTrash2 /></button>}
          />
        </>
      )}

      <Modal open={couponModal} onClose={() => setCouponModal(false)} title="Add Coupon" wide>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className="label">Code</label><input className="input" value={couponForm.code} onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })} /></div>
          <div><label className="label">Title</label><input className="input" value={couponForm.title} onChange={(e) => setCouponForm({ ...couponForm, title: e.target.value })} /></div>
          <div><label className="label">Discount Type</label>
            <select className="input" value={couponForm.discount_type} onChange={(e) => setCouponForm({ ...couponForm, discount_type: e.target.value })}>
              <option value="percent">Percent %</option>
              <option value="flat">Flat ₹</option>
            </select>
          </div>
          <div><label className="label">Discount Value</label><input type="number" className="input" value={couponForm.discount_value} onChange={(e) => setCouponForm({ ...couponForm, discount_value: e.target.value })} /></div>
          <div><label className="label">Max Discount (₹, optional)</label><input type="number" className="input" value={couponForm.max_discount} onChange={(e) => setCouponForm({ ...couponForm, max_discount: e.target.value })} /></div>
          <div><label className="label">Min Amount (₹)</label><input type="number" className="input" value={couponForm.min_amount} onChange={(e) => setCouponForm({ ...couponForm, min_amount: e.target.value })} /></div>
          <div><label className="label">Usage Limit (total, optional)</label><input type="number" className="input" value={couponForm.usage_limit} onChange={(e) => setCouponForm({ ...couponForm, usage_limit: e.target.value })} /></div>
          <div><label className="label">Per Patient Limit</label><input type="number" className="input" value={couponForm.per_patient_limit} onChange={(e) => setCouponForm({ ...couponForm, per_patient_limit: e.target.value })} /></div>
          <div><label className="label">Valid From</label><input type="date" className="input" value={couponForm.valid_from} onChange={(e) => setCouponForm({ ...couponForm, valid_from: e.target.value })} /></div>
          <div><label className="label">Valid Till</label><input type="date" className="input" value={couponForm.valid_till} onChange={(e) => setCouponForm({ ...couponForm, valid_till: e.target.value })} /></div>
          <div className="sm:col-span-2"><label className="label">Description</label><textarea className="input" rows={2} value={couponForm.description} onChange={(e) => setCouponForm({ ...couponForm, description: e.target.value })} /></div>
        </div>
        <button onClick={saveCoupon} className="btn-primary w-full mt-6 justify-center">Save Coupon</button>
      </Modal>

      <Modal open={offerModal} onClose={() => setOfferModal(false)} title="Add Offer" wide>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2"><label className="label">Title</label><input className="input" value={offerForm.title} onChange={(e) => setOfferForm({ ...offerForm, title: e.target.value })} /></div>
          <div className="sm:col-span-2"><label className="label">Description</label><textarea className="input" rows={2} value={offerForm.description} onChange={(e) => setOfferForm({ ...offerForm, description: e.target.value })} /></div>
          <div className="sm:col-span-2"><ImageUploader label="Offer Image" value={offerForm.image_url} onChange={(url) => setOfferForm({ ...offerForm, image_url: url })} folder="offers" /></div>
          <div><label className="label">Linked Coupon</label>
            <select className="input" value={offerForm.coupon_id} onChange={(e) => setOfferForm({ ...offerForm, coupon_id: e.target.value })}>
              <option value="">-- none --</option>
              {coupons.map((c) => <option key={c.id} value={c.id}>{c.code}</option>)}
            </select>
          </div>
          <div><label className="label">Valid Till</label><input type="date" className="input" value={offerForm.valid_till} onChange={(e) => setOfferForm({ ...offerForm, valid_till: e.target.value })} /></div>
        </div>
        <button onClick={saveOffer} className="btn-primary w-full mt-6 justify-center">Save Offer</button>
      </Modal>
    </AdminLayout>
  );
}
