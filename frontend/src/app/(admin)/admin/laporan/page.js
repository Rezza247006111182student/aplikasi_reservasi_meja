"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AdminShell from "../../../_components/AdminShell";
import CustomSelect from "../../../_components/CustomSelect";
import FieldInput from "../../../_components/FieldInput";
import { apiFetch } from "../../../_lib/api";

const periodOptions = [
  { label: "Hari ini", value: "today" },
  { label: "7 hari terakhir", value: "week" },
  { label: "30 hari terakhir", value: "month" },
];

const statusClass = {
  "Paling ramai": "bg-teal-100 text-teal-700",
  Stabil: "bg-green-100 text-green-700",
  "Perlu dipantau": "bg-amber-100 text-amber-700",
};

const dayLabels = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

const toDateKey = (value) => new Date(value).toISOString().slice(0, 10);

const getRangeStart = (period, date) => {
  const end = date ? new Date(date) : new Date();
  const start = new Date(end);

  if (period === "week") start.setDate(end.getDate() - 6);
  if (period === "month") start.setDate(end.getDate() - 29);

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

const getOccupancyStatus = (value) => {
  if (value >= 80) return "Paling ramai";
  if (value >= 55) return "Stabil";
  return "Perlu dipantau";
};

export default function AdminOccupancyReportPage() {
  const [period, setPeriod] = useState("week");
  const [floor, setFloor] = useState("all");
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().slice(0, 10));
  const [tables, setTables] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState("");

  const loadReports = useCallback(async () => {
    setIsLoading(true);
    try {
      const [tableData, reservationData] = await Promise.all([
        apiFetch("/api/tables"),
        apiFetch("/api/admin/reservations"),
      ]);

      setTables(tableData);
      setReservations(reservationData);
      setNotice("");
    } catch (error) {
      setNotice(error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(loadReports);
  }, [loadReports]);

  const floorOptions = useMemo(() => {
    const floors = [...new Set(tables.map((table) => table.floor).filter(Boolean))];
    return [{ label: "Semua lantai", value: "all" }, ...floors.map((item) => ({ label: item, value: item }))];
  }, [tables]);

  const filteredReservations = useMemo(() => {
    const { start, end } = getRangeStart(period, dateFilter);
    return reservations.filter((reservation) => {
      const date = new Date(reservation.startTime || reservation.reservationDate);
      const matchRange = date >= start && date <= end;
      const matchFloor = floor === "all" || reservation.floor === floor;
      return matchRange && matchFloor && ["pending", "confirmed", "completed"].includes(reservation.status);
    });
  }, [dateFilter, floor, period, reservations]);

  const filteredTables = useMemo(
    () => tables.filter((table) => floor === "all" || table.floor === floor),
    [floor, tables],
  );

  const zoneReports = useMemo(() => {
    const baseZones = [...new Set(filteredTables.map((table) => `${table.floor}|${table.room}`))];

    return baseZones.map((key) => {
      const [zoneFloor, zone] = key.split("|");
      const zoneTables = filteredTables.filter((table) => table.floor === zoneFloor && table.room === zone);
      const zoneReservations = filteredReservations.filter(
        (reservation) => reservation.floor === zoneFloor && reservation.room === zone,
      );
      const occupancy = zoneTables.length
        ? Math.min(100, Math.round((zoneReservations.length / zoneTables.length) * 25))
        : 0;

      return {
        zone,
        floor: zoneFloor,
        tables: zoneTables.length,
        reservations: zoneReservations.length,
        occupancy,
      };
    });
  }, [filteredReservations, filteredTables]);

  const averageOccupancy = zoneReports.length
    ? Math.round(zoneReports.reduce((total, item) => total + item.occupancy, 0) / zoneReports.length)
    : 0;

  const totalReservations = filteredReservations.length;
  const activeTables = filteredTables.filter((table) => table.status !== "inactive").length;
  const bestZone = [...zoneReports].sort((a, b) => b.occupancy - a.occupancy)[0];

  const stats = [
    ["Rata-rata Okupansi", `${averageOccupancy}%`, "fa-solid fa-chart-pie", "bg-teal-50 text-teal-700"],
    ["Total Reservasi", totalReservations, "fa-regular fa-calendar-check", "bg-amber-50 text-amber-700"],
    ["Meja Aktif", activeTables, "fa-solid fa-chair", "bg-green-50 text-green-700"],
    ["Zona Teramai", bestZone?.zone || "-", "fa-solid fa-ranking-star", "bg-rose-50 text-rose-700"],
  ];

  const dailyReports = useMemo(() => {
    const { start, end } = getRangeStart(period, dateFilter);
    const days = [];
    const cursor = new Date(start);

    while (cursor <= end) {
      const key = toDateKey(cursor);
      const total = filteredReservations.filter((reservation) => toDateKey(reservation.startTime) === key).length;
      const value = activeTables ? Math.min(100, Math.round((total / activeTables) * 25)) : 0;
      days.push({ day: dayLabels[cursor.getDay()], value, key });
      cursor.setDate(cursor.getDate() + 1);
    }

    return days.slice(-7);
  }, [activeTables, dateFilter, filteredReservations, period]);

  const peakHours = useMemo(() => {
    const buckets = new Map();

    filteredReservations.forEach((reservation) => {
      const hour = new Date(reservation.startTime).getHours();
      const key = `${String(hour).padStart(2, "0")}.00`;
      buckets.set(key, (buckets.get(key) || 0) + 1);
    });

    const max = Math.max(...buckets.values(), 1);
    return [...buckets.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([time, total]) => ({ time, value: Math.round((total / max) * 100), total }));
  }, [filteredReservations]);

  const tablePerformance = useMemo(() => {
    return filteredTables
      .map((table) => {
        const usage = filteredReservations.filter((reservation) => Number(reservation.tableId) === Number(table.id)).length;
        const occupancy = usage ? Math.min(100, Math.round((usage / Math.max(totalReservations, 1)) * 100)) : 0;
        return {
          table: table.code,
          zone: table.room,
          capacity: table.capacity,
          usage,
          occupancy,
          status: getOccupancyStatus(occupancy),
        };
      })
      .sort((a, b) => b.usage - a.usage)
      .slice(0, 8);
  }, [filteredReservations, filteredTables, totalReservations]);

  return (
    <AdminShell
      title="Laporan Okupansi"
      description="Analisis tingkat keterisian meja, performa zona, jam ramai, dan pemanfaatan meja restoran berdasarkan data backend."
    >
      {notice ? (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {notice}
        </div>
      ) : null}

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr] xl:items-end">
          <div>
            <h3 className="font-bold text-slate-950">Filter Laporan</h3>
            <p className="mt-1 text-sm text-slate-500">
              Pilih periode dan lantai untuk melihat ringkasan okupansi.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <CustomSelect label="Periode" value={period} onChange={setPeriod} options={periodOptions} />
            <CustomSelect label="Lantai" value={floor} onChange={setFloor} options={floorOptions} />
            <FieldInput
              label="Tanggal akhir"
              type="date"
              icon="fa-regular fa-calendar"
              value={dateFilter}
              onChange={(event) => setDateFilter(event.target.value)}
            />
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map(([label, value, icon, color]) => (
          <article key={label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">{label}</p>
                <p className="mt-2 text-3xl font-bold text-slate-950">{isLoading ? "..." : value}</p>
              </div>
              <span className={`flex h-11 w-11 items-center justify-center rounded-lg ${color}`}>
                <i className={icon} aria-hidden="true" />
              </span>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
            <div>
              <h3 className="font-bold text-slate-950">Tren Okupansi</h3>
              <p className="mt-1 text-sm text-slate-500">Persentase keterisian meja dari reservasi tersimpan.</p>
            </div>
            <span className="inline-flex w-fit rounded-md bg-teal-50 px-3 py-2 text-xs font-bold text-teal-700">
              {periodOptions.find((item) => item.value === period)?.label}
            </span>
          </div>

          <div className="mt-8 flex h-72 items-end gap-3 rounded-lg bg-slate-50 p-4 sm:gap-5">
            {dailyReports.map((item) => (
              <div key={item.key} className="flex h-full flex-1 flex-col justify-end">
                <div className="flex flex-1 items-end">
                  <div className="w-full rounded-t-md bg-teal-600 transition-all" style={{ height: `${item.value}%` }} title={`${item.value}%`} />
                </div>
                <div className="mt-3 text-center">
                  <p className="text-xs font-bold text-slate-950">{item.value}%</p>
                  <p className="mt-1 text-xs text-slate-500">{item.day}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-bold text-slate-950">Jam Reservasi Teramai</h3>
          <p className="mt-1 text-sm text-slate-500">Distribusi reservasi berdasarkan jam kedatangan.</p>

          <div className="mt-6 grid gap-4">
            {peakHours.map((item) => (
              <div key={item.time}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-700">{item.time}</span>
                  <span className="font-bold text-teal-700">{item.total} reservasi</span>
                </div>
                <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-amber-500" style={{ width: `${item.value}%` }} />
                </div>
              </div>
            ))}

            {!isLoading && peakHours.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-sm font-semibold text-slate-500">
                Belum ada data jam reservasi.
              </p>
            ) : null}
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-bold text-slate-950">Okupansi Per Zona</h3>
          <p className="mt-1 text-sm text-slate-500">
            Perbandingan area berdasarkan filter lantai.
          </p>

          <div className="mt-6 grid gap-5">
            {zoneReports.map((item) => (
              <div key={`${item.floor}-${item.zone}`}>
                <div className="flex items-center justify-between gap-4 text-sm">
                  <div>
                    <p className="font-semibold text-slate-950">{item.zone}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {item.floor} - {item.tables} meja - {item.reservations} reservasi
                    </p>
                  </div>
                  <span className="font-bold text-teal-700">{item.occupancy}%</span>
                </div>
                <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-teal-600" style={{ width: `${item.occupancy}%` }} />
                </div>
              </div>
            ))}

            {!isLoading && zoneReports.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-sm font-semibold text-slate-500">
                Belum ada data zona.
              </p>
            ) : null}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center">
            <div>
              <h3 className="font-bold text-slate-950">Performa Meja</h3>
              <p className="mt-1 text-sm text-slate-500">
                Meja yang paling sering dipakai dari data reservasi.
              </p>
            </div>
            <button
              type="button"
              onClick={loadReports}
              className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 transition hover:border-teal-300 hover:text-teal-700"
            >
              Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Meja</th>
                  <th className="px-5 py-3 font-semibold">Zona</th>
                  <th className="px-5 py-3 font-semibold">Kapasitas</th>
                  <th className="px-5 py-3 font-semibold">Dipakai</th>
                  <th className="px-5 py-3 font-semibold">Okupansi</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {tablePerformance.map((item) => (
                  <tr key={item.table}>
                    <td className="px-5 py-4 font-bold text-slate-950">{item.table}</td>
                    <td className="px-5 py-4 text-slate-600">{item.zone}</td>
                    <td className="px-5 py-4 text-slate-600">{item.capacity} orang</td>
                    <td className="px-5 py-4 text-slate-600">{item.usage} kali</td>
                    <td className="px-5 py-4 font-semibold text-teal-700">{item.occupancy}%</td>
                    <td className="px-5 py-4">
                      <span className={`rounded-md px-3 py-1 text-xs font-semibold ${statusClass[item.status]}`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}

                {!isLoading && tablePerformance.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-5 py-8 text-center font-semibold text-slate-500">
                      Belum ada data performa meja.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
