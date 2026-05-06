"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import AdminShell from "../../_components/AdminShell";
import { apiFetch, reservationStatusLabels, tableStatusLabels } from "../../_lib/api";

const statusClass = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  completed: "bg-slate-100 text-slate-700",
};

const formatTime = (value) => {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
};

const today = () => new Date().toISOString().slice(0, 10);

export default function AdminDashboardPage() {
  const [reservations, setReservations] = useState([]);
  const [tables, setTables] = useState([]);
  const [users, setUsers] = useState([]);
  const [report, setReport] = useState({ zones: [], reservationStatus: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState("");

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    try {
      const [reservationData, tableData, userData, reportData] = await Promise.all([
        apiFetch(`/api/admin/reservations?date=${today()}`),
        apiFetch("/api/tables"),
        apiFetch("/api/admin/users"),
        apiFetch("/api/admin/reports/occupancy"),
      ]);

      setReservations(reservationData);
      setTables(tableData);
      setUsers(userData);
      setReport(reportData);
      setNotice("");
    } catch (error) {
      setNotice(error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(loadDashboard);
  }, [loadDashboard]);

  const activeTables = tables.filter((table) => table.status !== "inactive");
  const availableTables = tables.filter((table) => table.status === "available");
  const occupiedTables = activeTables.length - availableTables.length;
  const occupancyPercent = activeTables.length
    ? Math.round((occupiedTables / activeTables.length) * 100)
    : 0;

  const summaryCards = [
    {
      title: "Reservasi Hari Ini",
      value: reservations.length,
      helper: "Dari tabel reservations",
      icon: "fa-regular fa-calendar-check",
      color: "bg-teal-50 text-teal-700",
    },
    {
      title: "Okupansi Meja",
      value: `${occupancyPercent}%`,
      helper: `${occupiedTables} dari ${activeTables.length} meja aktif`,
      icon: "fa-solid fa-chart-pie",
      color: "bg-amber-50 text-amber-700",
    },
    {
      title: "Meja Tersedia",
      value: availableTables.length,
      helper: tableStatusLabels.available,
      icon: "fa-solid fa-chair",
      color: "bg-green-50 text-green-700",
    },
    {
      title: "Pengguna Terdaftar",
      value: users.length,
      helper: "Dari tabel users",
      icon: "fa-regular fa-user",
      color: "bg-rose-50 text-rose-700",
    },
  ];

  const recentReservations = reservations.slice(0, 6);
  const occupancy = useMemo(
    () =>
      [...(report.zones || [])]
        .map((item) => ({
          area: item.zone,
          floor: item.floor,
          value: Number(item.occupancy || 0),
        }))
        .sort((a, b) => b.value - a.value),
    [report.zones],
  );

  return (
    <AdminShell
      title="Dashboard Admin"
      description="Ringkasan aktivitas reservasi, status meja, okupansi ruangan, dan aktivitas terbaru Nusantara Table dari backend."
    >
      {notice ? (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {notice}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <article key={card.title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">{card.title}</p>
                <h3 className="mt-2 text-3xl font-bold text-slate-950">{isLoading ? "..." : card.value}</h3>
                <p className="mt-2 text-xs font-medium text-slate-500">{card.helper}</p>
              </div>
              <span className={`flex h-11 w-11 items-center justify-center rounded-lg ${card.color}`}>
                <i className={card.icon} aria-hidden="true" />
              </span>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 p-5">
            <div>
              <h3 className="font-bold text-slate-950">Reservasi Hari Ini</h3>
              <p className="mt-1 text-sm text-slate-500">Data terbaru dari backend.</p>
            </div>
            <Link
              href="/admin/reservasi"
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-teal-300 hover:text-teal-700"
            >
              Lihat Semua
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Kode</th>
                  <th className="px-5 py-3 font-semibold">Pelanggan</th>
                  <th className="px-5 py-3 font-semibold">Meja</th>
                  <th className="px-5 py-3 font-semibold">Waktu</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {isLoading ? (
                  <tr>
                    <td colSpan="5" className="px-5 py-8 text-center font-semibold text-slate-500">
                      Memuat dashboard...
                    </td>
                  </tr>
                ) : null}

                {!isLoading &&
                  recentReservations.map((reservation) => (
                    <tr key={reservation.id}>
                      <td className="px-5 py-4 font-semibold text-slate-950">{reservation.code}</td>
                      <td className="px-5 py-4 text-slate-600">{reservation.customerName}</td>
                      <td className="px-5 py-4 text-slate-600">{reservation.tableCode}</td>
                      <td className="px-5 py-4 text-slate-600">{formatTime(reservation.startTime)}</td>
                      <td className="px-5 py-4">
                        <span className={`rounded-md px-3 py-1 text-xs font-semibold ${statusClass[reservation.status]}`}>
                          {reservationStatusLabels[reservation.status] ?? reservation.status}
                        </span>
                      </td>
                    </tr>
                  ))}

                {!isLoading && recentReservations.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-5 py-8 text-center font-semibold text-slate-500">
                      Belum ada reservasi hari ini.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-bold text-slate-950">Okupansi Ruangan</h3>
          <p className="mt-1 text-sm text-slate-500">Persentase per area dari laporan backend.</p>

          <div className="mt-6 grid gap-5">
            {occupancy.map((item) => (
              <div key={`${item.floor}-${item.area}`}>
                <div className="flex items-center justify-between gap-4 text-sm">
                  <div>
                    <span className="font-semibold text-slate-700">{item.area}</span>
                    <p className="mt-1 text-xs text-slate-500">{item.floor}</p>
                  </div>
                  <span className="font-bold text-teal-700">{item.value}%</span>
                </div>
                <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-teal-600" style={{ width: `${item.value}%` }} />
                </div>
              </div>
            ))}

            {!isLoading && occupancy.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-sm font-semibold text-slate-500">
                Data okupansi belum tersedia.
              </p>
            ) : null}
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {[
          ["Kelola Meja", "Tambah, ubah, aktifkan, atau nonaktifkan meja restoran.", "fa-solid fa-chair", "/admin/meja"],
          ["Editor Denah", "Atur posisi meja pada floor plan berbasis koordinat.", "fa-solid fa-object-group", "/admin/denah"],
          ["Laporan", "Pantau okupansi dan performa reservasi restoran.", "fa-solid fa-chart-line", "/admin/laporan"],
        ].map(([title, desc, icon, href]) => (
          <Link key={title} href={href} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-teal-300">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-50 text-teal-700">
              <i className={icon} aria-hidden="true" />
            </span>
            <h3 className="mt-4 font-bold text-slate-950">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{desc}</p>
          </Link>
        ))}
      </div>
    </AdminShell>
  );
}
