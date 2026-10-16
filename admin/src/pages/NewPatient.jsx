import { useEffect, useState, useCallback } from "react";
import {
  FiSearch,
  FiEye,
  FiChevronLeft,
  FiChevronRight,
  FiX,
} from "react-icons/fi";

import AdminLayout from "../components/AdminLayout";
import DataTable from "../components/DataTable";
import cofounderClient from "../api/cofounderClient";

export default function NewPatient() {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState("");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
const [selectedPatient, setSelectedPatient] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const [loading, setLoading] = useState(false);

  const loadPatients = useCallback(async () => {
    try {
      setLoading(true);

      const res = await cofounderClient.get("/patients", {
        params: {
          search: search.trim(),
          patient_type: "old",
          page,
          limit,
        },
      });

      const data = res.data;

      setPatients(data?.patients || []);

      setPagination(
        data?.pagination || {
          page,
          limit,
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        }
      );
    } catch (error) {
      console.error("Failed to load patients:", error);

      setPatients([]);

      setPagination({
        page,
        limit,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      });
    } finally {
      setLoading(false);
    }
  }, [search, page, limit]);

  // Search change hone par page 1
  useEffect(() => {
    setPage(1);
  }, [search]);

  // Search / page / limit change hone par API call
  useEffect(() => {
    const timer = setTimeout(() => {
      loadPatients();
    }, 300);

    return () => clearTimeout(timer);
  }, [loadPatients]);

  const handleLimitChange = (e) => {
    const newLimit = Number(e.target.value);

    setLimit(newLimit);
    setPage(1);
  };

  const goToPreviousPage = () => {
    if (!loading && pagination.hasPreviousPage) {
      setPage((prev) => Math.max(prev - 1, 1));
    }
  };

  const goToNextPage = () => {
    if (!loading && pagination.hasNextPage) {
      setPage((prev) => prev + 1);
    }
  };

  const startItem =
    pagination.total > 0
      ? (pagination.page - 1) * pagination.limit + 1
      : 0;

  const endItem =
    pagination.total > 0
      ? Math.min(
          pagination.page * pagination.limit,
          pagination.total
        )
      : 0;

  return (
    <AdminLayout title="Patients">
      {/* Search + Limit */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        {/* Search */}
        <div className="flex items-center gap-2 max-w-sm w-full">
          <FiSearch className="text-slate-400 shrink-0" />

          <input
            type="text"
            className="input w-full"
            placeholder="Search by mobile and ID and Address"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Limit */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">
            Show
          </span>

          <select
            value={limit}
            onChange={handleLimitChange}
            className="h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm outline-none focus:border-red-500"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={30}>30</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>

          <span className="text-sm text-slate-500">
            per page
          </span>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={[
          {
            key: "id",
            label: "ID",
            render: (row) => row.patient_id || "-",
          },

          {
            key: "name",
            label: "Name",
            render: (row) => row.name?.trim() || "—",
          },

          {
            key: "mobile",
            label: "Mobile",
            render: (row) => row.mobile || "—",
          },
           {
            key: "address",
            label: "Address",
            render: (r) => r.address || "—",
          },
          {
            key: "email",
            label: "Email",
            render: (row) => row.email || "—",
          },

          {
            key: "created_at",
            label: "Registered On",
            render: (row) =>
              row.created_at
                ? new Date(row.created_at).toLocaleDateString("en-IN")
                : "—",
          },
        ]}
        rows={patients}
        loading={loading}
      actions={(row) => (
  <button
    type="button"
    onClick={() => setSelectedPatient(row)}
    className="btn-outline !px-2 !py-1"
    title="View Patient"
  >
    <FiEye />
  </button>
)}
      />

{/* Patient Details Modal */}
{selectedPatient && (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    onClick={() => setSelectedPatient(null)}
  >
    <div
      className="w-full max-w-2xl bg-white rounded-xl shadow-xl overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">
            Patient Details
          </h2>

          <p className="text-sm text-slate-500 mt-1">
            {selectedPatient.patient_id || "-"}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setSelectedPatient(null)}
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700"
        >
          <FiX size={20} />
        </button>
      </div>

      {/* Body */}
      <div className="p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Patient ID */}
          <div>
            <p className="text-xs text-slate-500 mb-1">
              Patient ID
            </p>

            <p className="font-medium text-slate-800">
              {selectedPatient.patient_id || "—"}
            </p>
          </div>

          {/* Name */}
          <div>
            <p className="text-xs text-slate-500 mb-1">
              Name
            </p>

            <p className="font-medium text-slate-800">
              {selectedPatient.name?.trim() || "—"}
            </p>
          </div>

          {/* Mobile */}
          <div>
            <p className="text-xs text-slate-500 mb-1">
              Mobile
            </p>

            <p className="font-medium text-slate-800">
              {selectedPatient.mobile || "—"}
            </p>
          </div>

          {/* Email */}
          <div>
            <p className="text-xs text-slate-500 mb-1">
              Email
            </p>

            <p className="font-medium text-slate-800 break-all">
              {selectedPatient.email || "—"}
            </p>
          </div>

          {/* Gender */}
          <div>
            <p className="text-xs text-slate-500 mb-1">
              Gender
            </p>

            <p className="font-medium text-slate-800 capitalize">
              {selectedPatient.gender || "—"}
            </p>
          </div>

          {/* Date of Birth */}
          <div>
            <p className="text-xs text-slate-500 mb-1">
              Date of Birth
            </p>

            <p className="font-medium text-slate-800">
              {selectedPatient.dob
                ? new Date(
                    selectedPatient.dob
                  ).toLocaleDateString("en-IN")
                : "—"}
            </p>
          </div>

          {/* Patient Type */}
          <div>
            <p className="text-xs text-slate-500 mb-1">
              Patient Type
            </p>

            <p className="font-medium text-slate-800 capitalize">
              {selectedPatient.patient_type || "—"}
            </p>
          </div>

          {/* Status */}
          <div>
            <p className="text-xs text-slate-500 mb-1">
              Status
            </p>

            <span
              className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                selectedPatient.is_active
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {selectedPatient.is_active
                ? "Active"
                : "Inactive"}
            </span>
          </div>

          {/* Registered On */}
          <div>
            <p className="text-xs text-slate-500 mb-1">
              Registered On
            </p>

            <p className="font-medium text-slate-800">
              {selectedPatient.created_at
                ? new Date(
                    selectedPatient.created_at
                  ).toLocaleString("en-IN")
                : "—"}
            </p>
          </div>

          {/* Updated On */}
          <div>
            <p className="text-xs text-slate-500 mb-1">
              Updated On
            </p>

            <p className="font-medium text-slate-800">
              {selectedPatient.updated_at
                ? new Date(
                    selectedPatient.updated_at
                  ).toLocaleString("en-IN")
                : "—"}
            </p>
          </div>

          {/* Address */}
          <div className="sm:col-span-2">
            <p className="text-xs text-slate-500 mb-1">
              Address
            </p>

            <p className="font-medium text-slate-800">
              {selectedPatient.address || "—"}
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end px-5 py-4 border-t border-slate-200">
        <button
          type="button"
          onClick={() => setSelectedPatient(null)}
          className="px-4 py-2 rounded-lg bg-slate-800 text-white text-sm hover:bg-slate-700"
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}


      {/* Pagination */}
      {pagination.total > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
          {/* Showing */}
          <div className="text-sm text-slate-500">
            Showing{" "}
            <span className="font-medium text-slate-700">
              {startItem}
            </span>
            {" - "}
            <span className="font-medium text-slate-700">
              {endItem}
            </span>
            {" of "}
            <span className="font-medium text-slate-700">
              {pagination.total}
            </span>
            {" patients"}
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goToPreviousPage}
              disabled={
                !pagination.hasPreviousPage || loading
              }
              className="flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
            >
              <FiChevronLeft />
              Previous
            </button>

            <div className="px-3 py-2 text-sm font-medium text-slate-700">
              Page {pagination.page} of{" "}
              {pagination.totalPages}
            </div>

            <button
              type="button"
              onClick={goToNextPage}
              disabled={
                !pagination.hasNextPage || loading
              }
              className="flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
            >
              Next
              <FiChevronRight />
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && patients.length === 0 && (
        <div className="text-center py-8 text-sm text-slate-400">
          No patients found.
        </div>
      )}
    </AdminLayout>
  );
}
