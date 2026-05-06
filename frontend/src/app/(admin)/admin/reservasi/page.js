"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AdminShell from "../../../_components/AdminShell";
import CustomSelect from "../../../_components/CustomSelect";
import FieldInput from "../../../_components/FieldInput";
import { apiFetch, reservationStatusLabels } from "../../../_lib/api";

const statusOptions = [
  { label: "Semua status", value: "all" },
  { label: "Menunggu", value: "pending" },
  { label: "Dikonfirmasi", value: "confirmed" },
  { label: "Dibatalkan", value: "cancelled" },
  { label: "Selesai", value: "completed" },
];

const updateStatusOptions = statusOptions.filter((option) => option.value !== "all");

const statusClass = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  completed: "bg-slate-100 text-slate-700",
};

const formatDate = (value) => {
  if (!value) return "-";
  return new Date(value).toISOString().slice(0, 10);
};

const formatTimeRange = (start, end) => {
  if (!start || !end) return "-";
  const startDate = new Date(start);
  const endDate = new Date(end);
  const formatter = new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Jakarta",
  });
  return `${formatter.format(startDate)} - ${formatter.format(endDate)}`;
};

export default function AdminReservationsPage() {
  const [reservations, setReservations] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState({ type: "", message: "" });

  const loadReservations = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (dateFilter) params.set("date", dateFilter);
      const query = params.toString();
      const data = await apiFetch(`/api/admin/reservations${query ? `?${query}` : ""}`);
      setReservations(data);
      setNotice({ type: "", message: "" });
    } catch (error) {
      setNotice({ type: "error", message: error.message });
    } finally {
      setIsLoading(false);
    }
  }, [dateFilter, statusFilter]);

  useEffect(() => {
    void Promise.resolve().then(loadReservations);
  }, [loadReservations]);

  const stats = useMemo(
    () => [
      ["Total Reservasi", reservations.length, "fa-regular fa-calendar-check"],
      ["Menunggu", reservations.filter((item) => item.status === "pending").length, "fa-regular fa-clock"],
      ["Dikonfirmasi", reservations.filter((item) => item.status === "confirmed").length, "fa-regular fa-circle-check"],
      ["Selesai", reservations.filter((item) => item.status === "completed").length, "fa-solid fa-check-double"],
    ],
    [reservations],
  );

  const updateReservationStatus = async (id, nextStatus) => {
    try {
      await apiFetch(`/api/admin/reservations/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });

      setReservations((current) =>
        current.map((reservation) =>
          reservation.id === id ? { ...reservation, status: nextStatus } : reservation,
        ),
      );
      setSelectedReservation((current) =>
        current?.id === id ? { ...current, status: nextStatus } : current,
      );
      setNotice({ type: "success", message: "Status reservasi berhasil diperbarui." });
    } catch (error) {
      setNotice({ type: "error", message: error.message });
    }
  };

  return (
    <AdminShell
      title="Data Reservasi"
      description="Pantau seluruh reservasi pelanggan, filter berdasarkan status, dan ubah status reservasi dari backend."
    >
      {notice.message ? (
        <div
          className={`mb-5 rounded-lg border px-4 py-3 text-sm font-semibold ${
            notice.type === "success"
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
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
        <div className="grid gap-4 border-b border-slate-200 p-5 lg:grid-cols-[1fr_180px_180px_auto] lg:items-end">
          <div>
            <h3 className="font-bold text-slate-950">Daftar Reservasi</h3>
            <p className="mt-1 text-sm text-slate-500">
              Data reservasi diambil langsung dari TiDB.
            </p>
          </div>
          <CustomSelect
            label="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={statusOptions}
          />
          <FieldInput
            label="Tanggal"
            type="date"
            icon="fa-regular fa-calendar"
            value={dateFilter}
            onChange={(event) => setDateFilter(event.target.value)}
          />
          <button
            type="button"
            onClick={loadReservations}
            className="inline-flex h-12 items-center justify-center rounded-md border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-800 transition hover:border-teal-300 hover:text-teal-700"
          >
            Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3 font-semibold">Kode</th>
                <th className="px-5 py-3 font-semibold">Pelanggan</th>
                <th className="px-5 py-3 font-semibold">Meja</th>
                <th className="px-5 py-3 font-semibold">Tanggal</th>
                <th className="px-5 py-3 font-semibold">Waktu</th>
                <th className="px-5 py-3 font-semibold">Tamu</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {isLoading ? (
                <tr>
                  <td colSpan="8" className="px-5 py-8 text-center font-semibold text-slate-500">
                    Memuat data reservasi...
                  </td>
                </tr>
              ) : null}

              {!isLoading &&
                reservations.map((reservation) => (
                  <tr key={reservation.id}>
                    <td className="px-5 py-4 font-semibold text-slate-950">{reservation.code}</td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-900">{reservation.customerName}</p>
                      <p className="mt-1 text-xs text-slate-500">{reservation.customerPhone}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-900">{reservation.tableCode}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {reservation.floor} - {reservation.room}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-slate-600">{formatDate(reservation.reservationDate)}</td>
                    <td className="px-5 py-4 text-slate-600">
                      {formatTimeRange(reservation.startTime, reservation.endTime)}
                    </td>
                    <td className="px-5 py-4 text-slate-600">{reservation.guestCount}</td>
                    <td className="px-5 py-4">
                      <span className={`rounded-md px-3 py-1 text-xs font-semibold ${statusClass[reservation.status]}`}>
                        {reservationStatusLabels[reservation.status] ?? reservation.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => setSelectedReservation(reservation)}
                        className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-teal-300 hover:text-teal-700"
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                ))}

              {!isLoading && reservations.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-5 py-8 text-center font-semibold text-slate-500">
                    Belum ada reservasi.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      {selectedReservation ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-5">
          <div className="w-full max-w-xl rounded-lg bg-white p-6 shadow-2xl shadow-slate-950/20">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase text-teal-700">Detail Reservasi</p>
                <h2 className="mt-2 text-2xl font-bold text-slate-950">
                  {selectedReservation.code}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReservation(null)}
                className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-100 text-slate-700 transition hover:bg-slate-200"
                aria-label="Tutup detail reservasi"
              >
                <i className="fa-solid fa-xmark" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-5 grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
              {[
                ["Pelanggan", selectedReservation.customerName],
                ["Telepon", selectedReservation.customerPhone],
                ["Meja", `${selectedReservation.tableCode} - ${selectedReservation.floor} - ${selectedReservation.room}`],
                ["Tanggal", formatDate(selectedReservation.reservationDate)],
                ["Waktu", formatTimeRange(selectedReservation.startTime, selectedReservation.endTime)],
                ["Jumlah tamu", `${selectedReservation.guestCount} orang`],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-4">
                  <span className="text-slate-600">{label}</span>
                  <span className="text-right font-semibold text-slate-950">{value}</span>
                </div>
              ))}
            </div>

            <div className="mt-5">
              <CustomSelect
                label="Update Status"
                value={selectedReservation.status}
                onChange={(nextStatus) => updateReservationStatus(selectedReservation.id, nextStatus)}
                options={updateStatusOptions}
              />
            </div>

            <button
              type="button"
              onClick={() => setSelectedReservation(null)}
              className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-md bg-teal-600 px-5 text-sm font-semibold text-white transition hover:bg-teal-700"
            >
              Tutup
            </button>
          </div>
        </div>
      ) : null}
    </AdminShell>
  );
}
