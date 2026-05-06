"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AdminShell from "../../../_components/AdminShell";
import CustomSelect from "../../../_components/CustomSelect";
import FieldInput from "../../../_components/FieldInput";
import { apiFetch } from "../../../_lib/api";

const statusOptions = [
  { label: "Semua status", value: "all" },
  { label: "Aktif", value: "active" },
  { label: "Dibatasi", value: "restricted" },
  { label: "Nonaktif", value: "inactive" },
];

const statusLabels = {
  active: "Aktif",
  restricted: "Dibatasi",
  inactive: "Nonaktif",
};

const statusClass = {
  active: "bg-green-100 text-green-700",
  restricted: "bg-amber-100 text-amber-700",
  inactive: "bg-slate-100 text-slate-700",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState({ type: "", message: "" });

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      const data = await apiFetch(`/api/admin/users?${params.toString()}`);
      setUsers(data);
      setNotice({ type: "", message: "" });
    } catch (error) {
      setNotice({ type: "error", message: error.message });
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void Promise.resolve().then(loadUsers);
  }, [loadUsers]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const keyword = query.toLowerCase();
      return (
        user.name.toLowerCase().includes(keyword) ||
        user.email.toLowerCase().includes(keyword)
      );
    });
  }, [query, users]);

  const stats = [
    ["Total Pengguna", users.length, "fa-regular fa-user"],
    ["Pengguna Aktif", users.filter((user) => user.status === "active").length, "fa-regular fa-circle-check"],
    ["Reservasi Dibuat", users.reduce((total, user) => total + Number(user.reservation_count || 0), 0), "fa-regular fa-calendar-check"],
    ["Akun Dibatasi", users.filter((user) => user.status === "restricted").length, "fa-solid fa-user-lock"],
  ];

  return (
    <AdminShell
      title="Data Pengguna"
      description="Pantau pelanggan terdaftar, kontak, role, status akun, dan jumlah reservasi dari backend."
    >
      {notice.message ? (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {notice.message}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map(([label, value, icon]) => (
          <article key={label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">{label}</p>
                <p className="mt-2 text-3xl font-bold text-slate-950">{value}</p>
              </div>
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                <i className={icon} aria-hidden="true" />
              </span>
            </div>
          </article>
        ))}
      </div>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-4 border-b border-slate-200 p-5 lg:grid-cols-[1fr_220px_180px] lg:items-end">
          <div>
            <h3 className="font-bold text-slate-950">Daftar Pengguna</h3>
            <p className="mt-1 text-sm text-slate-500">
              Data pengguna diambil dari tabel users.
            </p>
          </div>
          <FieldInput
            label="Cari pengguna"
            icon="fa-solid fa-magnifying-glass"
            placeholder="Nama atau email"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <CustomSelect label="Status" value={statusFilter} onChange={setStatusFilter} options={statusOptions} />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3 font-semibold">ID</th>
                <th className="px-5 py-3 font-semibold">Pengguna</th>
                <th className="px-5 py-3 font-semibold">Kontak</th>
                <th className="px-5 py-3 font-semibold">Tanggal Daftar</th>
                <th className="px-5 py-3 font-semibold">Reservasi</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="px-5 py-8 text-center font-semibold text-slate-500">
                    Memuat data pengguna...
                  </td>
                </tr>
              ) : null}

              {!isLoading && filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td className="px-5 py-4 font-bold text-slate-950">USR-{user.id}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-50 text-sm font-bold text-teal-700">
                        {user.name.split(" ").map((part) => part[0]).slice(0, 2).join("")}
                      </span>
                      <div>
                        <p className="font-semibold text-slate-950">{user.name}</p>
                        <p className="mt-1 text-xs text-slate-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-600">{user.phone || "-"}</td>
                  <td className="px-5 py-4 text-slate-600">
                    {new Date(user.created_at).toISOString().slice(0, 10)}
                  </td>
                  <td className="px-5 py-4 text-slate-600">{user.reservation_count || 0} kali</td>
                  <td className="px-5 py-4">
                    <span className={`rounded-md px-3 py-1 text-xs font-semibold ${statusClass[user.status]}`}>
                      {statusLabels[user.status] ?? user.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <button
                      type="button"
                      onClick={() => setSelectedUser(user)}
                      className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-teal-300 hover:text-teal-700"
                    >
                      Detail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {selectedUser ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-5">
          <div className="w-full max-w-xl rounded-lg bg-white p-6 shadow-2xl shadow-slate-950/20">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase text-teal-700">Detail Pengguna</p>
                <h2 className="mt-2 text-2xl font-bold text-slate-950">{selectedUser.name}</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-100 text-slate-700 transition hover:bg-slate-200"
                aria-label="Tutup detail pengguna"
              >
                <i className="fa-solid fa-xmark" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-5 grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
              {[
                ["ID", `USR-${selectedUser.id}`],
                ["Email", selectedUser.email],
                ["Telepon", selectedUser.phone || "-"],
                ["Role", selectedUser.role],
                ["Tanggal daftar", new Date(selectedUser.created_at).toISOString().slice(0, 10)],
                ["Total reservasi", `${selectedUser.reservation_count || 0} kali`],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-4">
                  <span className="text-slate-600">{label}</span>
                  <span className="text-right font-semibold text-slate-950">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </AdminShell>
  );
}
