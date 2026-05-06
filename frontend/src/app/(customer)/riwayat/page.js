"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import SiteFooter from "../../_components/SiteFooter";
import SiteHeader from "../../_components/SiteHeader";
import { apiFetch, reservationStatusLabels } from "../../_lib/api";

const statusClass = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  completed: "bg-slate-100 text-slate-700",
};

const formatDate = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const formatTimeRange = (start, end) => {
  if (!start || !end) return "-";
  const formatter = new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Jakarta",
  });
  return `${formatter.format(new Date(start))} - ${formatter.format(new Date(end))}`;
};

export default function RiwayatPage() {
  const [user, setUser] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState({ type: "", message: "" });

  const loadReservations = async (activeUser) => {
    if (!activeUser?.id) return;

    setIsLoading(true);
    try {
      const data = await apiFetch(`/api/reservations/user/${activeUser.id}`);
      setReservations(data);
    } catch (error) {
      setNotice({ type: "error", message: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(() => {
      const auth = JSON.parse(localStorage.getItem("nusantara_auth") || "{}");
      setUser(auth.user ?? null);
      return loadReservations(auth.user);
    });
  }, []);

  const stats = useMemo(
    () => ({
      total: reservations.length,
      active: reservations.filter((item) => ["pending", "confirmed"].includes(item.status)).length,
      completed: reservations.filter((item) => item.status === "completed").length,
    }),
    [reservations],
  );

  const cancelReservation = async (reservation) => {
    try {
      await apiFetch(`/api/reservations/${reservation.id}/cancel`, {
        method: "PATCH",
      });
      setReservations((current) =>
        current.map((item) =>
          item.id === reservation.id ? { ...item, status: "cancelled" } : item,
        ),
      );
      setNotice({ type: "success", message: "Reservasi berhasil dibatalkan." });
    } catch (error) {
      setNotice({ type: "error", message: error.message });
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <SiteHeader />

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col justify-between gap-6 px-5 py-12 md:flex-row md:items-end md:py-16">
          <div>
            <p className="text-sm font-semibold uppercase text-teal-700">
              Riwayat Reservasi
            </p>
            <h1 className="mt-3 text-4xl font-bold leading-tight text-slate-950 sm:text-5xl">
              Pantau semua reservasi meja
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">
              Riwayat reservasi milik {user?.name || "pelanggan"} diambil
              langsung dari backend.
            </p>
          </div>
          <Link
            href="/reservasi"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-teal-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"
          >
            <i className="fa-solid fa-plus" aria-hidden="true" />
            Reservasi Baru
          </Link>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto w-full max-w-6xl px-5">
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

          <div className="mb-6 grid gap-4 md:grid-cols-3">
            {[
              ["Total Reservasi", stats.total],
              ["Aktif", stats.active],
              ["Selesai", stats.completed],
            ].map(([label, value]) => (
              <article key={label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-medium text-slate-500">{label}</p>
                <p className="mt-2 text-3xl font-bold text-slate-950">{value}</p>
              </article>
            ))}
          </div>

          <div className="grid gap-4">
            {isLoading ? (
              <div className="rounded-lg border border-slate-200 bg-white p-8 text-center font-semibold text-slate-500">
                Memuat riwayat reservasi...
              </div>
            ) : null}

            {!isLoading && reservations.map((reservation) => (
              <article
                key={reservation.id}
                className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-lg font-bold text-slate-950">
                        {reservation.code}
                      </h2>
                      <span className={`rounded-md px-3 py-1 text-xs font-semibold ${statusClass[reservation.status]}`}>
                        {reservationStatusLabels[reservation.status] ?? reservation.status}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      Meja {reservation.tableCode} - {reservation.floor} - {reservation.room}
                    </p>
                  </div>

                  <div className="grid gap-3 text-sm sm:grid-cols-3 md:text-right">
                    <div>
                      <p className="text-slate-500">Tanggal</p>
                      <p className="font-semibold text-slate-900">{formatDate(reservation.reservationDate)}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Waktu</p>
                      <p className="font-semibold text-slate-900">
                        {formatTimeRange(reservation.startTime, reservation.endTime)}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500">Tamu</p>
                      <p className="font-semibold text-slate-900">{reservation.guestCount} orang</p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row">
                  <button className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 transition hover:border-teal-300 hover:text-teal-700">
                    Lihat Detail
                  </button>
                  {["pending", "confirmed"].includes(reservation.status) ? (
                    <button
                      type="button"
                      onClick={() => cancelReservation(reservation)}
                      className="inline-flex h-10 items-center justify-center rounded-md bg-red-50 px-4 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                    >
                      Batalkan Reservasi
                    </button>
                  ) : null}
                </div>
              </article>
            ))}

            {!isLoading && reservations.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
                <p className="font-semibold text-slate-950">Belum ada reservasi</p>
                <p className="mt-2 text-sm text-slate-500">
                  Buat reservasi pertama dari halaman denah interaktif.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
