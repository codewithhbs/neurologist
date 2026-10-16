import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiSearch, FiEye, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import client from "../api/client";
import AdminLayout from "../components/AdminLayout";
import DataTable from "../components/DataTable";

export default function Patients() {
  const [patients, setPatients] = useState([]);

  const [search, setSearch] = useState("");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const [loading, setLoading] = useState(false);

  const load = () => {
    setLoading(true);

    client
      .get("/patients", {
        params: {
          search: search.trim(),
          page,
          limit,
        },
      })
      .then((res) => {
        setPatients(res.data.patients || []);

        setPagination(
          res.data.pagination || {
            page,
            limit,
            total: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        );
      })
      .catch((error) => {
        console.error("Failed to load patients:", error);
        setPatients([]);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // Search change hone par page 1 par wapas
  useEffect(() => {
    setPage(1);
  }, [search]);

  // Search/page/limit change hone par data load
  useEffect(() => {
    const t = setTimeout(() => {
      load();
    }, 300);

    return () => clearTimeout(t);
  }, [search, page, limit]);

  const handleLimitChange = (e) => {
    setLimit(Number(e.target.value));
    setPage(1);
  };

  const goToPreviousPage = () => {
    if (pagination.hasPreviousPage) {
      setPage((prev) => prev - 1);
    }
  };

  const goToNextPage = () => {
    if (pagination.hasNextPage) {
      setPage((prev) => prev + 1);
    }
  };

  return (
    <AdminLayout title="Patients">
      {/* Search + Limit */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 max-w-sm w-full">
          <FiSearch className="text-slate-400 shrink-0" />

          <input
            className="input w-full"
            placeholder="Search by mobile and ID and Address"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">Show</span>

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

          <span className="text-sm text-slate-500">per page</span>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={[
          {
            key: "id",
            label: "Id",
            render: (r) => (r.id ? `ID: PT-${r.id}` : "-"),
          },

          {
            key: "name",
            label: "Name",
            render: (r) => r.name || "—",
          },

          {
            key: "mobile",
            label: "Mobile",
            render: (r) => r.mobile || "—",
          },

          {
            key: "email",
            label: "Email",
            render: (r) => r.email || "—",
          },
          {
            key: "address",
            label: "Address",
            render: (r) => r.address || "—",
          },
          {
            key: "created_at",
            label: "Registered On",
            render: (r) =>
              r.created_at
                ? new Date(r.created_at).toLocaleDateString("en-IN")
                : "—",
          },
        ]}
        rows={patients}
        loading={loading}
        actions={(row) => (
          <Link to={`/patients/${row.id}`} className="btn-outline !px-2 !py-1">
            <FiEye />
          </Link>
        )}
      />

      {/* Pagination */}
      {pagination.total > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
          {/* Showing */}
          <div className="text-sm text-slate-500">
            Showing{" "}
            <span className="font-medium text-slate-700">
              {(pagination.page - 1) * pagination.limit + 1}
            </span>
            {" - "}
            <span className="font-medium text-slate-700">
              {Math.min(pagination.page * pagination.limit, pagination.total)}
            </span>
            {" of "}
            <span className="font-medium text-slate-700">
              {pagination.total}
            </span>
            {" patients"}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goToPreviousPage}
              disabled={!pagination.hasPreviousPage || loading}
              className="flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
            >
              <FiChevronLeft />
              Previous
            </button>

            <div className="px-3 py-2 text-sm font-medium text-slate-700">
              Page {pagination.page} of {pagination.totalPages}
            </div>

            <button
              type="button"
              onClick={goToNextPage}
              disabled={!pagination.hasNextPage || loading}
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
