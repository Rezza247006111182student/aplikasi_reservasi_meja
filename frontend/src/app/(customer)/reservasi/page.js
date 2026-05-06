"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import InteractiveFloorPlan from "../../_components/InteractiveFloorPlan";
import ReservationFilterForm from "../../_components/ReservationFilterForm";
import SiteFooter from "../../_components/SiteFooter";
import SiteHeader from "../../_components/SiteHeader";
import { apiFetch } from "../../_lib/api";

const toSqlDateTime = (date, time, addHours = 0) => {
  const value = new Date(`${date}T${time}:00`);
  value.setHours(value.getHours() + addHours);

  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  const hour = String(value.getHours()).padStart(2, "0");
  const minute = String(value.getMinutes()).padStart(2, "0");
  const second = String(value.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
};

export default function ReservasiPage() {
  const [selectedTable, setSelectedTable] = useState(null);
  const [confirmationTable, setConfirmationTable] = useState(null);
  const [availabilityQuery, setAvailabilityQuery] = useState(null);
  const [availabilityMessage, setAvailabilityMessage] = useState("");
  const [availabilitySummary, setAvailabilitySummary] = useState(null);
  const [zones, setZones] = useState([]);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [form, setForm] = useState({
    date: "",
    time: "",
    guestCount: "2",
    floor: "all",
    room: "all",
  });
  const [submitStatus, setSubmitStatus] = useState({ type: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    apiFetch("/api/zones")
      .then((data) => {
        if (isMounted) setZones(data);
      })
      .catch(() => {
        if (isMounted) setZones([]);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const floorOptions = useMemo(() => {
    const floors = [...new Set(zones.map((zone) => zone.floor).filter(Boolean))];
    return [
      { label: "Semua lantai", value: "all" },
      ...floors.map((floor) => ({ label: floor, value: floor })),
    ];
  }, [zones]);

  const roomOptions = useMemo(() => {
    const rooms = [
      ...new Set(
        zones
          .filter((zone) => form.floor === "all" || zone.floor === form.floor)
          .map((zone) => zone.room)
          .filter(Boolean),
      ),
    ];

    return [
      { label: "Semua ruangan", value: "all" },
      ...rooms.map((room) => ({ label: room, value: room })),
    ];
  }, [form.floor, zones]);

  const handleFormChange = useCallback((updater) => {
    setForm((current) => {
      const next = typeof updater === "function" ? updater(current) : updater;

      if (next.floor !== current.floor) {
        return { ...next, room: "all" };
      }

      return next;
    });
    setSelectedTable(null);
    setConfirmationTable(null);
    setAvailabilitySummary(null);
    setAvailabilityMessage("");
  }, []);

  const checkAvailability = () => {
    if (!form.date || !form.time || !form.guestCount) {
      setSubmitStatus({
        type: "error",
        message: "Isi tanggal, waktu, dan jumlah tamu sebelum mengecek ketersediaan.",
      });
      return;
    }

    setIsCheckingAvailability(true);
    setSubmitStatus({ type: "", message: "" });
    setSelectedTable(null);
    setConfirmationTable(null);
    setAvailabilitySummary(null);
    setAvailabilityQuery({
      startTime: toSqlDateTime(form.date, form.time),
      endTime: toSqlDateTime(form.date, form.time, 2),
      guestCount: form.guestCount,
      floor: form.floor,
      room: form.room,
      checkedAt: Date.now(),
    });
    setAvailabilityMessage(`Ketersediaan meja diperiksa untuk ${form.date}, pukul ${form.time}.`);
    window.setTimeout(() => setIsCheckingAvailability(false), 350);
  };

  const handleAvailabilityChange = useCallback(
    (summary) => {
      setAvailabilitySummary(summary);
      if (availabilityQuery) {
        const floorText = form.floor === "all" ? "semua lantai" : form.floor;
        const roomText = form.room === "all" ? "semua ruangan" : form.room;

        setAvailabilityMessage(
          `${summary.available} dari ${summary.total} meja tersedia di ${floorText}, ${roomText} untuk ${form.date}, pukul ${form.time}.`,
        );
        setIsCheckingAvailability(false);
      }
    },
    [availabilityQuery, form.date, form.floor, form.room, form.time],
  );

  const createReservation = async () => {
    if (!confirmationTable?.tableId) {
      setSubmitStatus({ type: "error", message: "Pilih meja dari denah terlebih dahulu." });
      return;
    }

    if (!form.date || !form.time || !form.guestCount) {
      setSubmitStatus({ type: "error", message: "Tanggal, waktu, dan jumlah tamu wajib diisi." });
      return;
    }

    const startTime = toSqlDateTime(form.date, form.time);
    const endTime = toSqlDateTime(form.date, form.time, 2);

    setIsSubmitting(true);
    setSubmitStatus({ type: "", message: "" });

    try {
      const auth = JSON.parse(localStorage.getItem("nusantara_auth") || "{}");

      if (!auth.user?.id) {
        setSubmitStatus({ type: "error", message: "Silakan login terlebih dahulu." });
        setIsSubmitting(false);
        return;
      }

      const result = await apiFetch("/api/reservations", {
        method: "POST",
        body: JSON.stringify({
          tableId: confirmationTable.tableId,
          customerName: auth.user.name,
          customerPhone: auth.user.phone,
          reservationDate: form.date,
          startTime,
          endTime,
          guestCount: Number(form.guestCount),
          note: "Reservasi dari frontend pelanggan.",
        }),
      });

      setSubmitStatus({
        type: "success",
        message: `Reservasi berhasil dibuat dengan kode ${result.code}.`,
      });
      setConfirmationTable(null);
      setAvailabilityQuery((current) =>
        current
          ? {
              ...current,
              checkedAt: Date.now(),
            }
          : current,
      );
    } catch (error) {
      setSubmitStatus({ type: "error", message: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <SiteHeader />

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-12 md:py-16 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div className="animate-fade-up">
            <p className="text-sm font-semibold uppercase text-teal-700">
              Reservasi
            </p>
            <h1 className="mt-3 text-4xl font-bold leading-tight text-slate-950 sm:text-5xl">
              Pilih jadwal dan meja Nusantara Table
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">
              Pilih tanggal, waktu, jumlah tamu, lalu pilih meja dari denah
              interaktif yang terhubung ke backend.
            </p>
          </div>

          <ReservationFilterForm
            selectedTable={selectedTable}
            form={form}
            floorOptions={floorOptions}
            roomOptions={roomOptions}
            onFormChange={handleFormChange}
            onCheckAvailability={checkAvailability}
            isChecking={isCheckingAvailability}
            availabilityMessage={availabilityMessage}
            availabilitySummary={availabilitySummary}
          />
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto w-full max-w-6xl px-5">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-semibold uppercase text-teal-700">
                Interactive Floor Plan
              </p>
              <h2 className="mt-2 text-3xl font-bold text-slate-950">
                Pilih meja berdasarkan lantai dan ruangan
              </h2>
            </div>
            <Link
              href="/login"
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-800 transition hover:border-teal-300 hover:text-teal-700 sm:w-fit"
            >
              <i className="fa-solid fa-right-to-bracket" aria-hidden="true" />
              Login untuk Konfirmasi
            </Link>
          </div>

          <div className="mx-auto mt-8 max-w-5xl animate-fade-up-delay">
            {submitStatus.message ? (
              <div
                className={`mb-4 rounded-lg border px-4 py-3 text-sm font-semibold ${
                  submitStatus.type === "success"
                    ? "border-green-200 bg-green-50 text-green-700"
                    : "border-red-200 bg-red-50 text-red-700"
                }`}
              >
                {submitStatus.message}
              </div>
            ) : null}
            <InteractiveFloorPlan
              availabilityQuery={availabilityQuery}
              onAvailabilityChange={handleAvailabilityChange}
              onSelectionChange={setSelectedTable}
              onConfirmSelection={setConfirmationTable}
            />
          </div>
        </div>
      </section>

      {confirmationTable ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-5">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-2xl shadow-slate-950/20">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase text-teal-700">
                  Konfirmasi Reservasi
                </p>
                <h2 className="mt-2 text-2xl font-bold text-slate-950">
                  Pastikan detail meja sudah benar
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setConfirmationTable(null)}
                className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-100 text-slate-700 transition hover:bg-slate-200"
                aria-label="Tutup modal konfirmasi"
              >
                <i className="fa-solid fa-xmark" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-5 grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
              {[
                ["Meja", confirmationTable.id],
                ["Lokasi", `${confirmationTable.floor} - ${confirmationTable.room}`],
                ["Kapasitas", `${confirmationTable.seats} orang`],
                ["Status", confirmationTable.statusLabel],
                ["Jadwal", form.date && form.time ? `${form.date}, ${form.time}` : "Belum diisi"],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-4">
                  <span className="text-slate-600">{label}</span>
                  <span className="font-semibold text-slate-950">{value}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setConfirmationTable(null)}
                className="inline-flex h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-800 transition hover:border-teal-300 hover:text-teal-700"
              >
                Ubah Pilihan
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={createReservation}
                className="inline-flex h-11 items-center justify-center rounded-md bg-teal-600 px-5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {isSubmitting ? "Menyimpan..." : "Konfirmasi Reservasi"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <SiteFooter />
    </main>
  );
}
