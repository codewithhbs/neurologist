// src/pages/Appointments.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FiPlus,
  FiFilter,
  FiRefreshCw,
  FiEye,
  FiX,
  FiCalendar,
  FiClock,
  FiPhone,
  FiCreditCard,
  FiActivity,
  FiChevronLeft,
  FiChevronRight,
  FiSearch,
} from "react-icons/fi";

import client from "../api/client";
import AdminLayout from "../components/AdminLayout";
import DataTable from "../components/DataTable";
import Modal from "../components/Modal";
import FamilyMemberSelect from "../components/FamilyMemberSelect";
import cofounderClient from "../api/cofounderClient";

const STATUS_COLORS = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  no_show: "bg-slate-200 text-slate-600",
};

const PAYMENT_COLORS = {
  not_required: "bg-slate-100 text-slate-600",
  pending: "bg-amber-100 text-amber-700",
  paid: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
  refunded: "bg-purple-100 text-purple-700",
};

const emptyFilters = {
  search: "",
  date: "",
  from: "",
  to: "",
  status: "",
  payment_status: "",
  doctor_id: "",
  clinic_id: "",
  booked_via: "",
};

const emptyForm = {
  patient_name: "",
  patient_mobile: "",
  clinic_id: "",
  doctor_id: "",
  service_id: "",
  appointment_date: "",
  start_time: "",
  end_time: "",
  is_free: false,
  reason: "",
  notes: "",
  payment_method: "cash",
};

function formatTime(time) {
  if (!time) return "-";
  return String(time).slice(0, 5);
}

function formatMoney(value) {
  const amount = Number(value || 0);
  return `₹${amount.toFixed(2)}`;
}

function formatBookedVia(value) {
  if (!value) return "-";
  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDate(value) {
  if (!value) return "-";
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return value;
  }
}

function useDebouncedValue(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function NewAppointment() {
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]); // one row per patient (grouped)
  const [filters, setFilters] = useState(emptyFilters);
  const debouncedSearch = useDebouncedValue(filters.search, 400);

  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);

  const [createModal, setCreateModal] = useState(false);

  // patient detail (shows every appointment of that one patient)
  const [patientModal, setPatientModal] = useState(false);
  const [patientDetail, setPatientDetail] = useState(null);
  const [patientDetailLoading, setPatientDetailLoading] = useState(false);

  const [clinics, setClinics] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [services, setServices] = useState([]);
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const [form, setForm] = useState(emptyForm);
  const [familySel, setFamilySel] = useState({ member_patient_id: "", new_member: null, _adding: false });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const load = async (page = pagination.page) => {
    try {
      setTableLoading(true);

      const params = {
        page,
        limit: pagination.limit,
      };

      if (filters.date) params.date = filters.date;
      if (filters.from) params.from = filters.from;
      if (filters.to) params.to = filters.to;
      if (filters.status) params.status = filters.status;
      if (debouncedSearch) params.search = debouncedSearch;
      if (filters.doctor_id) params.doctor_id = filters.doctor_id;
      if (filters.clinic_id) params.clinic_id = filters.clinic_id;
      if (filters.booked_via) params.booked_via = filters.booked_via;
      if (filters.payment_status)
        params.payment_status = filters.payment_status;

      const res = await client.get("/appointments/grouped?patient_type=old", {
        params,
      });

      setAppointments(res.data.patients || []);
      setPagination((prev) => ({
        ...prev,
        ...res.data.pagination,
      }));
    } catch (error) {
      console.error("Failed to load appointments:", error);
      toast.error("Failed to load appointments");
    } finally {
      setTableLoading(false);
    }
  };

  useEffect(() => {
    setPagination((prev) => (prev.page === 1 ? prev : { ...prev, page: 1 }));
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.date,
    filters.from,
    filters.to,
    filters.status,
    filters.payment_status,
    filters.doctor_id,
    filters.clinic_id,
    filters.booked_via,
    debouncedSearch,
  ]);

  const goToPage = (page) => {
    if (page < 1 || page > pagination.totalPages || page === pagination.page)
      return;
    setPagination((prev) => ({ ...prev, page }));
    load(page);
  };

  const changeLimit = (limit) => {
    setPagination((prev) => ({ ...prev, limit, page: 1 }));
    setTimeout(() => load(1), 0);
  };

  useEffect(() => {
    const loadMasterData = async () => {
      try {
        const [clinicRes, doctorRes, serviceRes] = await Promise.all([
          client.get("/clinics"),
          client.get("/doctors"),
          client.get("/services"),
        ]);

        setClinics(clinicRes.data?.clinics || []);
        setDoctors(doctorRes.data?.doctors || []);
        setServices(serviceRes.data?.services || []);
      } catch (error) {
        console.error("Failed to load appointment master data:", error);
        toast.error("Failed to load clinics, doctors or services");
      }
    };

    loadMasterData();
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateForm = (field, value) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const updateFilter = (field, value) => {
    setFilters((previous) => ({ ...previous, [field]: value }));
  };

  const clearFilters = () => {
    setFilters(emptyFilters);
  };

  const activeFilterCount = useMemo(
    () => Object.values(filters).filter((v) => v !== "").length,
    [filters],
  );

  const fetchSlots = async () => {
    if (!form.doctor_id || !form.clinic_id || !form.appointment_date) {
      setSlots([]);
      return;
    }

    try {
      setSlotsLoading(true);

      const publicBase =
        import.meta.env.VITE_API_URL?.replace("/admin", "") ||
        "https://api.drneerajkumarneurologist.com/api";

      const params = new URLSearchParams({
        doctor_id: String(form.doctor_id),
        clinic_id: String(form.clinic_id),
        date: form.appointment_date,
      });

      if (form.service_id) {
        params.append("service_id", String(form.service_id));
      }

      const response = await fetch(
        `${publicBase}/appointments/available-slots?${params.toString()}`,
      );

      if (!response.ok) throw new Error(`Slot API failed: ${response.status}`);

      const data = await response.json();
      setSlots(data?.slots || []);
    } catch (error) {
      console.error("Failed to fetch slots:", error);
      setSlots([]);
      toast.error("Failed to load available slots");
    } finally {
      setSlotsLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.doctor_id, form.clinic_id, form.appointment_date, form.service_id]);

  const normalizeSlot = (slot) => {
    if (typeof slot === "string") return { start_time: slot, end_time: "" };
    return {
      start_time: slot?.start_time || slot?.start || slot?.time || "",
      end_time: slot?.end_time || slot?.end || "",
    };
  };

  const selectSlot = (slot) => {
    const normalized = normalizeSlot(slot);
    updateForm("start_time", normalized.start_time);
    updateForm("end_time", normalized.end_time);
  };

  const createWalkIn = async () => {
    if (!form.patient_name.trim())
      return toast.error("Patient name is required");
    if (!form.patient_mobile.trim())
      return toast.error("Patient mobile number is required");
    if (!form.clinic_id) return toast.error("Please select a clinic");
    if (!form.doctor_id) return toast.error("Please select a doctor");
    if (!form.appointment_date)
      return toast.error("Please select appointment date");
    if (!form.start_time) return toast.error("Please select a time slot");

    try {
      setLoading(true);

      if (familySel._adding && !familySel.new_member) {
        setLoading(false);
        return toast.error("Enter the family member's name");
      }
      await client.post("/appointments", {
        ...form,
        member_patient_id: familySel.member_patient_id || undefined,
        new_member: familySel.new_member || undefined,
        booked_via: "admin",
      });

      toast.success("Appointment created successfully");
      setCreateModal(false);
      setForm(emptyForm);
      setFamilySel({ member_patient_id: "", new_member: null, _adding: false });
      setSlots([]);

      setPagination((prev) => ({ ...prev, page: 1 }));
      await load(1);
    } catch (error) {
      console.error("Failed to create appointment:", error);
      toast.error(
        error.response?.data?.message || "Failed to create appointment",
      );
    } finally {
      setLoading(false);
    }
  };

  // open a patient row -> load ALL of that patient's appointments
  const openPatient = async (uniqueId) => {
    setPatientModal(true);
    setPatientDetail(null);
    setPatientDetailLoading(true);
    try {
      const res = await cofounderClient.get(
        `/cofounder/patients/${uniqueId}?patient_type=old`,
      );
      setPatientDetail(res.data);
    } catch (error) {
      console.error("Failed to load patient appointments:", error);
      toast.error("Failed to load patient's appointments");
      setPatientModal(false);
    } finally {
      setPatientDetailLoading(false);
    }
  };

  // status update for one appointment, used inside the patient detail modal
  const updateStatus = async (appointmentId, status) => {
    const prevDetail = patientDetail;

    setPatientDetail((prev) =>
      prev
        ? {
            ...prev,
            appointments: prev.appointments.map((item) =>
              item.id === appointmentId ? { ...item, status } : item,
            ),
          }
        : prev,
    );

    try {
      await client.put(`/appointments/${appointmentId}/status`, { status });
      toast.success("Status updated");
      load(pagination.page); // refresh counts on the grouped list behind the modal
    } catch (error) {
      console.error("Failed to update appointment status:", error);
      toast.error(error.response?.data?.message || "Failed to update status");
      setPatientDetail(prevDetail);
    }
  };

  const summary = useMemo(() => {
    const totalPatients = appointments.length;
    const totalAppointments = appointments.reduce(
      (sum, i) => sum + Number(i.appointment_count || 0),
      0,
    );
    const pending = appointments.reduce(
      (sum, i) => sum + Number(i.pending_count || 0),
      0,
    );
    const confirmed = appointments.reduce(
      (sum, i) => sum + Number(i.confirmed_count || 0),
      0,
    );
    const completed = appointments.reduce(
      (sum, i) => sum + Number(i.completed_count || 0),
      0,
    );
    const revenue = appointments.reduce(
      (sum, i) => sum + Number(i.total_amount || 0),
      0,
    );

    return {
      totalPatients,
      totalAppointments,
      pending,
      confirmed,
      completed,
      revenue,
    };
  }, [appointments]);

  const rangeStart =
    pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const rangeEnd = Math.min(
    pagination.page * pagination.limit,
    pagination.total,
  );

  const pageNumbers = useMemo(() => {
    const total = pagination.totalPages || 1;
    const current = pagination.page;
    const delta = 1;
    const pages = [];

    for (let p = 1; p <= total; p++) {
      if (
        p === 1 ||
        p === total ||
        (p >= current - delta && p <= current + delta)
      ) {
        pages.push(p);
      } else if (pages[pages.length - 1] !== "...") {
        pages.push("...");
      }
    }
    return pages;
  }, [pagination.page, pagination.totalPages]);

  return (
    <AdminLayout title="Appointments">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Appointments</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage patient appointments, payments, doctors, slots and booking
            information.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => load(pagination.page)}
            className="btn-secondary"
            disabled={tableLoading}
          >
            <FiRefreshCw className={tableLoading ? "animate-spin" : ""} />
            Refresh
          </button>

          <button
            type="button"
            onClick={() => {
              setForm(emptyForm);
              setSlots([]);
              setCreateModal(true);
            }}
            className="btn-primary"
          >
            <FiPlus />
            Walk-in / Phone Booking
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-6">
        <SummaryCard
          title="Patients (page)"
          value={summary.totalPatients}
          icon={<FiCalendar />}
        />
        <SummaryCard
          title="Appointments (page)"
          value={summary.totalAppointments}
          icon={<FiCalendar />}
        />
        <SummaryCard
          title="Pending"
          value={summary.pending}
          icon={<FiClock />}
        />
        <SummaryCard
          title="Confirmed"
          value={summary.confirmed}
          icon={<FiActivity />}
        />
        <SummaryCard
          title="Completed"
          value={summary.completed}
          icon={<FiActivity />}
        />
        <SummaryCard
          title="Revenue (page)"
          value={formatMoney(summary.revenue)}
          icon={<FiCreditCard />}
        />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex items-center gap-2 text-slate-500">
            <FiFilter />
            <span className="font-medium text-sm">Filters</span>
            {activeFilterCount > 0 && (
              <span className="badge bg-brand-100 text-brand-700">
                {activeFilterCount}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-[180px]">
            <label className="label">Search</label>
            <div className="relative">
              {/* <FiSearch
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={14}
              /> */}
              <input
                type="text"
                className="input pl-8"
                placeholder="Name, mobile, patient ID (PT-23)..."
                value={filters.search}
                onChange={(e) => updateFilter("search", e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 min-w-[150px]">
            <label className="label">Appointment Date</label>
            <input
              type="date"
              className="input"
              value={filters.date}
              onChange={(e) => updateFilter("date", e.target.value)}
            />
          </div>

          <div className="flex-1 min-w-[150px]">
            <label className="label">Clinic</label>
            <select
              className="input"
              value={filters.clinic_id}
              onChange={(e) => updateFilter("clinic_id", e.target.value)}
            >
              <option value="">All Clinics</option>
              {clinics.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[150px]">
            <label className="label">Doctor</label>
            <select
              className="input"
              value={filters.doctor_id}
              onChange={(e) => updateFilter("doctor_id", e.target.value)}
            >
              <option value="">All Doctors</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[150px]">
            <label className="label">Appointment Status</label>
            <select
              className="input"
              value={filters.status}
              onChange={(e) => updateFilter("status", e.target.value)}
            >
              <option value="">All Status</option>
              {[
                "pending",
                "confirmed",
                "completed",
                "cancelled",
                "no_show",
              ].map((s) => (
                <option key={s} value={s}>
                  {formatBookedVia(s)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[150px]">
            <label className="label">Payment Status</label>
            <select
              className="input"
              value={filters.payment_status}
              onChange={(e) => updateFilter("payment_status", e.target.value)}
            >
              <option value="">All Payments</option>
              {["not_required", "pending", "paid", "failed", "refunded"].map(
                (s) => (
                  <option key={s} value={s}>
                    {formatBookedVia(s)}
                  </option>
                ),
              )}
            </select>
          </div>

          <div className="flex-1 min-w-[150px]">
            <label className="label">Booked Via</label>
            <select
              className="input"
              value={filters.booked_via}
              onChange={(e) => updateFilter("booked_via", e.target.value)}
            >
              <option value="">All Sources</option>
              {["website", "app", "reception", "admin"].map((s) => (
                <option key={s} value={s}>
                  {formatBookedVia(s)}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            className="btn-secondary"
            onClick={clearFilters}
            disabled={activeFilterCount === 0}
          >
            <FiX />
            Clear
          </button>
        </div>
      </div>

      <div className="relative">
        {tableLoading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-xl">
            <FiRefreshCw className="animate-spin text-brand-600" size={22} />
          </div>
        )}

        <DataTable
          columns={[
            {
              key: "unique_id",
              label: "Patient",
              render: (row) => (
                <div>
                  <div className="font-semibold text-slate-800">
                    {row.patient_name || "-"}
                    {row.patient_parent_id ? (
                      <span className="ml-1.5 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold capitalize text-violet-700">
                        {row.patient_relation || "family"}
                      </span>
                    ) : null}
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    ID: {row.patient_id}
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-1">
                    <FiPhone size={11} />
                    {row.patient_mobile || "-"}
                  </div>
                </div>
              ),
            },
            {
              key: "appointment_count",
              label: "No Of Appointments",
              render: (row) => (
                <span className="badge bg-brand-100 text-brand-700 font-bold">
                  {row.appointment_count}
                </span>
              ),
            },
            {
              key: "last_appointment_date",
              label: "Last Visit",
              render: (row) => (
                <div className="whitespace-nowrap font-medium">
                  {formatDate(row.last_appointment_date)}
                </div>
              ),
            },
            {
              key: "pending_count",
              label: "Pending",
              render: (row) => (
                <span className={`badge ${STATUS_COLORS.pending}`}>
                  {Number(row.pending_count ?? 0)}
                </span>
              ),
            },
            {
              key: "confirmed_count",
              label: "Confirmed",
              render: (row) => (
                <span className={`badge ${STATUS_COLORS.confirmed}`}>
                  {Number(row.confirmed_count ?? 0)}
                </span>
              ),
            },
            {
              key: "completed_count",
              label: "Completed",
              render: (row) => (
                <span className={`badge ${STATUS_COLORS.completed}`}>
                  {Number(row.completed_count ?? 0)}
                </span>
              ),
            },
            {
              key: "total_amount",
              label: "Total Amount",
              render: (row) => (
                <div className="font-bold whitespace-nowrap">
                  {formatMoney(row.total_amount)}
                </div>
              ),
            },
          ]}
          rows={appointments.map((row) => ({ ...row, id: row.unique_id }))}
          emptyState={
            <div className="py-12 text-center text-sm text-slate-500">
              No appointments match these filters.
            </div>
          }
          actions={(row) => (
            <button
              type="button"
              onClick={() => openPatient(row.unique_id)}
              className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"
              title="View all appointments of this patient"
            >
              <FiEye size={15} />
            </button>
          )}
        />
      </div>

      {pagination.total > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4 px-1">
          <div className="text-sm text-slate-500">
            Showing{" "}
            <span className="font-medium text-slate-700">{rangeStart}</span>–
            <span className="font-medium text-slate-700">{rangeEnd}</span> of{" "}
            <span className="font-medium text-slate-700">
              {pagination.total}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <select
              className="input !py-1.5 !w-auto text-sm"
              value={pagination.limit}
              onChange={(e) => changeLimit(Number(e.target.value))}
            >
              {[10, 20, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n} / page
                </option>
              ))}
            </select>

            <div className="flex items-center gap-1">
              <button
                type="button"
                className="p-2 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
                onClick={() => goToPage(pagination.page - 1)}
                disabled={!pagination.hasPreviousPage || tableLoading}
              >
                <FiChevronLeft size={16} />
              </button>

              {pageNumbers.map((p, idx) =>
                p === "..." ? (
                  <span
                    key={`dots-${idx}`}
                    className="px-2 text-slate-400 text-sm"
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    type="button"
                    onClick={() => goToPage(p)}
                    disabled={tableLoading}
                    className={`min-w-[32px] h-8 px-2 rounded-lg text-sm font-medium ${
                      p === pagination.page
                        ? "bg-brand-600 text-white"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {p}
                  </button>
                ),
              )}

              <button
                type="button"
                className="p-2 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
                onClick={() => goToPage(pagination.page + 1)}
                disabled={!pagination.hasNextPage || tableLoading}
              >
                <FiChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      <Modal
        open={createModal}
        onClose={() => {
          setCreateModal(false);
          setSlots([]);
          setFamilySel({ member_patient_id: "", new_member: null, _adding: false });
        }}
        title="Walk-in / Phone Booking"
        wide
      >
        <div className="mb-5">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center">
              <FiCalendar size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">
                Create Appointment
              </h3>
              <p className="text-xs text-slate-500">
                Create a walk-in or phone appointment
              </p>
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="label">Patient Name *</label>
            <input
              className="input"
              placeholder="Enter patient name"
              value={form.patient_name}
              onChange={(e) => updateForm("patient_name", e.target.value)}
            />
          </div>

          <div>
            <label className="label">Mobile Number *</label>
            <input
              className="input"
              type="tel"
              placeholder="Enter mobile number"
              value={form.patient_mobile}
              onChange={(e) => updateForm("patient_mobile", e.target.value)}
            />
          </div>

          <FamilyMemberSelect
            className="sm:col-span-2 lg:col-span-3"
            client={client}
            mobile={form.patient_mobile}
            value={familySel}
            onChange={setFamilySel}
            onHolder={(h) => {
              if (h?.name) setForm((f) => (f.patient_name ? f : { ...f, patient_name: h.name }));
            }}
          />

          <div>
            <label className="label">Clinic *</label>
            <select
              className="input"
              value={form.clinic_id}
              onChange={(e) => updateForm("clinic_id", e.target.value)}
            >
              <option value="">-- Select Clinic --</option>
              {clinics.map((clinic) => (
                <option key={clinic.id} value={clinic.id}>
                  {clinic.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Doctor *</label>
            <select
              className="input"
              value={form.doctor_id}
              onChange={(e) => updateForm("doctor_id", e.target.value)}
            >
              <option value="">-- Select Doctor --</option>
              {doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Service (optional)</label>
            <select
              className="input"
              value={form.service_id}
              onChange={(e) => updateForm("service_id", e.target.value)}
            >
              <option value="">-- No specific service --</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Appointment Date *</label>
            <input
              type="date"
              className="input"
              value={form.appointment_date}
              onChange={(e) => updateForm("appointment_date", e.target.value)}
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-3">
            <label className="label">Available Time Slots *</label>

            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
              {slotsLoading && (
                <div className="flex items-center justify-center py-6 text-sm text-slate-500">
                  Loading available slots...
                </div>
              )}

              {!slotsLoading && slots.length === 0 && (
                <div className="text-center py-6">
                  <FiClock className="mx-auto text-slate-300 mb-2" size={28} />
                  <p className="text-sm text-slate-500">
                    Select clinic, doctor and date to see available slots.
                  </p>
                </div>
              )}

              {!slotsLoading && slots.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {slots.map((slot, index) => {
                    const normalized = normalizeSlot(slot);
                    const selected = form.start_time === normalized.start_time;

                    return (
                      <button
                        key={`${normalized.start_time}-${index}`}
                        type="button"
                        onClick={() => selectSlot(slot)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${
                          selected
                            ? "bg-brand-600 text-white border-brand-600 shadow-sm"
                            : "bg-white text-slate-700 border-slate-200 hover:border-brand-400 hover:text-brand-600"
                        }`}
                      >
                        {formatTime(normalized.start_time)}
                        {normalized.end_time && (
                          <> - {formatTime(normalized.end_time)}</>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="label">Payment Method</label>
            <select
              className="input"
              value={form.payment_method}
              onChange={(e) => updateForm("payment_method", e.target.value)}
            >
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="card">Card</option>
              <option value="online">Online</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="flex items-end">
            <label className="flex items-center gap-3 cursor-pointer border border-slate-200 rounded-xl px-4 py-3 w-full">
              <input
                type="checkbox"
                className="w-4 h-4"
                checked={form.is_free}
                onChange={(e) => updateForm("is_free", e.target.checked)}
              />
              <div>
                <div className="text-sm font-medium text-slate-700">
                  Mark as Free
                </div>
                <div className="text-xs text-slate-400">
                  No payment required
                </div>
              </div>
            </label>
          </div>

          <div className="sm:col-span-2">
            <label className="label">Reason</label>
            <input
              className="input"
              placeholder="Reason for appointment"
              value={form.reason}
              onChange={(e) => updateForm("reason", e.target.value)}
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-3">
            <label className="label">Notes</label>
            <textarea
              className="input min-h-[100px] resize-y"
              placeholder="Additional appointment notes..."
              value={form.notes}
              onChange={(e) => updateForm("notes", e.target.value)}
            />
          </div>
        </div>

        {form.start_time && (
          <div className="mt-5 p-4 rounded-xl bg-brand-50 border border-brand-100">
            <div className="flex items-center gap-3">
              <FiClock className="text-brand-600" />
              <div>
                <div className="text-xs text-brand-600 font-medium">
                  Selected Appointment
                </div>
                <div className="font-semibold text-brand-800">
                  {formatDate(form.appointment_date)} •{" "}
                  {formatTime(form.start_time)}
                  {form.end_time && <> - {formatTime(form.end_time)}</>}
                </div>
              </div>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={createWalkIn}
          disabled={loading}
          className="btn-primary w-full mt-6 justify-center disabled:opacity-60"
        >
          <FiPlus />
          {loading ? "Creating Appointment..." : "Create Appointment"}
        </button>
      </Modal>

      <Modal
        open={patientModal}
        onClose={() => {
          setPatientModal(false);
          setPatientDetail(null);
        }}
        title="Patient Appointments"
        wide
      >
        {patientDetailLoading && (
          <div className="py-10 text-center text-sm text-slate-500">
            Loading patient's appointments...
          </div>
        )}

        {!patientDetailLoading && patientDetail && (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <div className="font-bold text-slate-800">
                  {patientDetail.patient.name || "-"}
                </div>
                <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                  <FiPhone size={11} /> {patientDetail.patient.mobile || "-"}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-400 uppercase">
                  Patient ID
                </div>
                <div className="font-semibold text-brand-700">
                  PT-{patientDetail.patient.id}
                </div>
              </div>
              <div className="badge bg-brand-100 text-brand-700 font-bold">
                {patientDetail.appointments.length} Appointment
                {patientDetail.appointments.length === 1 ? "" : "s"}
              </div>
            </div>

            <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
              {patientDetail.appointments.length === 0 && (
                <div className="py-8 text-center text-sm text-slate-500">
                  No appointments found for this patient.
                </div>
              )}

              {patientDetail.appointments.map((appt) => (
                <div
                  key={appt.id}
                  onClick={() => {
                    setPatientModal(false);
                    navigate(`/appointments/new/${appt.id}`);
                  }}
                  className="group border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 cursor-pointer hover:border-brand-300 hover:bg-brand-50/40 hover:shadow-sm transition"
                  title="Click to open full appointment details"
                >
                  <div className="min-w-[160px]">
                    <div className="font-medium text-slate-800 flex items-center gap-1 group-hover:text-brand-700">
                      <FiCalendar size={13} />
                      {formatDate(appt.appointment_date)}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <FiClock size={11} />
                      {formatTime(appt.start_time)} -{" "}
                      {formatTime(appt.end_time)}
                    </div>
                  </div>

                  <div className="min-w-[140px] text-sm text-slate-600">
                    <div>{appt.doctor_name || "-"}</div>
                    <div className="text-xs text-slate-400">
                      {appt.service_name || "-"}
                    </div>
                  </div>

                  <div className="min-w-[90px]">
                    <span
                      className={`badge ${PAYMENT_COLORS[appt.payment_status] || "bg-slate-100 text-slate-600"}`}
                    >
                      {formatBookedVia(appt.payment_status)}
                    </span>
                  </div>

                  <div className="font-bold text-sm whitespace-nowrap">
                    {formatMoney(appt.final_amount)}
                  </div>

                  <select
                    value={appt.status}
                    onChange={(e) => updateStatus(appt.id, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className={`input !py-1 !w-auto text-xs font-medium border-0 ${STATUS_COLORS[appt.status] || "bg-slate-100 text-slate-600"}`}
                  >
                    {[
                      "pending",
                      "confirmed",
                      "completed",
                      "cancelled",
                      "no_show",
                    ].map((status) => (
                      <option key={status} value={status}>
                        {formatBookedVia(status)}
                      </option>
                    ))}
                  </select>

                  <FiEye
                    size={16}
                    className="text-slate-300 group-hover:text-brand-500 transition"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
}

function SummaryCard({ title, value, icon }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500">{title}</p>
          <p className="text-xl font-bold text-slate-800 mt-1">{value}</p>
        </div>
        <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
          {icon}
        </div>
      </div>
    </div>
  );
}