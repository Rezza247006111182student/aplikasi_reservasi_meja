"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AdminShell from "../../../_components/AdminShell";
import CustomSelect from "../../../_components/CustomSelect";
import FieldInput from "../../../_components/FieldInput";
import { apiFetch } from "../../../_lib/api";

const floorOptions = [
  { label: "Semua lantai", value: "all" },
  { label: "Lantai 1", value: "Lantai 1" },
  { label: "Lantai 2", value: "Lantai 2" },
];

const statusOptions = [
  { label: "Semua status", value: "all" },
  { label: "Aktif", value: "active" },
  { label: "Maintenance", value: "maintenance" },
  { label: "Nonaktif", value: "inactive" },
];

const editStatusOptions = statusOptions.filter((option) => option.value !== "all");

const statusClass = {
  active: "bg-green-100 text-green-700",
  maintenance: "bg-amber-100 text-amber-700",
  inactive: "bg-slate-100 text-slate-700",
};

const statusLabels = {
  active: "Aktif",
  maintenance: "Maintenance",
  inactive: "Nonaktif",
};

const emptyZone = {
  id: "",
  code: "",
  floor: "Lantai 1",
  room: "",
  type: "Indoor",
  capacity: 0,
  status: "active",
};

export default function AdminZonesPage() {
  const [zones, setZones] = useState([]);
  const [tables, setTables] = useState([]);
  const [floorFilter, setFloorFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editingZone, setEditingZone] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState({ type: "", message: "" });

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [zoneData, tableData] = await Promise.all([
        apiFetch("/api/zones"),
        apiFetch("/api/tables"),
      ]);
      setZones(zoneData);
      setTables(tableData);
      setNotice({ type: "", message: "" });
    } catch (error) {
      setNotice({ type: "error", message: error.message });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(loadData);
  }, [loadData]);

  const zonesWithTableCount = useMemo(
    () =>
      zones.map((zone) => ({
        ...zone,
        tables: tables.filter((table) => Number(table.zoneId) === Number(zone.id)).length,
      })),
    [tables, zones],
  );

  const filteredZones = useMemo(() => {
    return zonesWithTableCount.filter((zone) => {
      const matchFloor = floorFilter === "all" || zone.floor === floorFilter;
      const matchStatus = statusFilter === "all" || zone.status === statusFilter;
      return matchFloor && matchStatus;
    });
  }, [floorFilter, statusFilter, zonesWithTableCount]);

  const stats = [
    ["Total Zona", zones.length, "fa-solid fa-layer-group"],
    ["Total Meja", tables.length, "fa-solid fa-chair"],
    ["Kapasitas", zones.reduce((total, zone) => total + Number(zone.capacity || 0), 0), "fa-solid fa-users"],
    ["Maintenance", zones.filter((zone) => zone.status === "maintenance").length, "fa-solid fa-screwdriver-wrench"],
  ];

  const saveZone = async () => {
    setIsSaving(true);
    setNotice({ type: "", message: "" });

    try {
      const payload = {
        code: editingZone.code,
        floor: editingZone.floor,
        room: editingZone.room,
        type: editingZone.type,
        capacity: Number(editingZone.capacity || 0),
        status: editingZone.status,
      };

      if (editingZone.id) {
        await apiFetch(`/api/admin/zones/${editingZone.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch("/api/admin/zones", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      setEditingZone(null);
      await loadData();
      setNotice({ type: "success", message: "Zona berhasil disimpan." });
    } catch (error) {
      setNotice({ type: "error", message: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleStatus = async (zone) => {
    const nextStatus = zone.status === "active" ? "maintenance" : "active";
    try {
      await apiFetch(`/api/admin/zones/${zone.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      await loadData();
    } catch (error) {
      setNotice({ type: "error", message: error.message });
    }
  };

  return (
    <AdminShell
      title="Zona & Lantai"
      description="Kelola struktur lantai, ruangan, zona, kapasitas, dan status area restoran untuk mendukung editor denah."
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

      <section className="mt-6 grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-bold text-slate-950">Struktur Restoran</h3>
          <p className="mt-1 text-sm text-slate-500">
            Struktur lantai dan ruangan dari backend.
          </p>

          <div className="mt-6 grid gap-4">
            {["Lantai 1", "Lantai 2"].map((floor) => (
              <div key={floor} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-md bg-white text-teal-700 shadow-sm">
                    <i className="fa-solid fa-building" aria-hidden="true" />
                  </span>
                  <h4 className="font-semibold text-slate-950">{floor}</h4>
                </div>
                <div className="mt-4 grid gap-2">
                  {zonesWithTableCount
                    .filter((zone) => zone.floor === floor)
                    .map((zone) => (
                      <div
                        key={zone.id}
                        className="flex items-center justify-between rounded-md bg-white px-3 py-2 text-sm"
                      >
                        <span className="font-medium text-slate-700">{zone.room}</span>
                        <span className="text-xs text-slate-500">{zone.tables} meja</span>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-4 border-b border-slate-200 p-5 lg:grid-cols-[1fr_170px_170px_auto] lg:items-end">
            <div>
              <h3 className="font-bold text-slate-950">Daftar Zona</h3>
              <p className="mt-1 text-sm text-slate-500">
                Atur metadata area sebelum meja ditempatkan pada denah.
              </p>
            </div>
            <CustomSelect label="Lantai" value={floorFilter} onChange={setFloorFilter} options={floorOptions} />
            <CustomSelect label="Status" value={statusFilter} onChange={setStatusFilter} options={statusOptions} />
            <button
              type="button"
              onClick={() => setEditingZone(emptyZone)}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-teal-600 px-5 text-sm font-semibold text-white transition hover:bg-teal-700"
            >
              <i className="fa-solid fa-plus" aria-hidden="true" />
              Tambah Zona
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Kode</th>
                  <th className="px-5 py-3 font-semibold">Ruangan</th>
                  <th className="px-5 py-3 font-semibold">Tipe</th>
                  <th className="px-5 py-3 font-semibold">Meja</th>
                  <th className="px-5 py-3 font-semibold">Kapasitas</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {isLoading ? (
                  <tr>
                    <td colSpan="7" className="px-5 py-8 text-center font-semibold text-slate-500">
                      Memuat data zona...
                    </td>
                  </tr>
                ) : null}

                {!isLoading &&
                  filteredZones.map((zone) => (
                    <tr key={zone.id}>
                      <td className="px-5 py-4 font-bold text-slate-950">{zone.code}</td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-900">{zone.room}</p>
                        <p className="mt-1 text-xs text-slate-500">{zone.floor}</p>
                      </td>
                      <td className="px-5 py-4 text-slate-600">{zone.type}</td>
                      <td className="px-5 py-4 text-slate-600">{zone.tables}</td>
                      <td className="px-5 py-4 text-slate-600">{zone.capacity} orang</td>
                      <td className="px-5 py-4">
                        <span className={`rounded-md px-3 py-1 text-xs font-semibold ${statusClass[zone.status]}`}>
                          {statusLabels[zone.status] ?? zone.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingZone(zone)}
                            className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-teal-300 hover:text-teal-700"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleStatus(zone)}
                            className="rounded-md bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
                          >
                            Toggle
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {editingZone ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-5">
          <div className="w-full max-w-xl rounded-lg bg-white p-6 shadow-2xl shadow-slate-950/20">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase text-teal-700">Form Zona</p>
                <h2 className="mt-2 text-2xl font-bold text-slate-950">
                  {editingZone.id ? `Edit ${editingZone.room}` : "Tambah Zona"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setEditingZone(null)}
                className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-100 text-slate-700 transition hover:bg-slate-200"
                aria-label="Tutup form zona"
              >
                <i className="fa-solid fa-xmark" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <FieldInput
                label="Kode zona"
                icon="fa-solid fa-hashtag"
                value={editingZone.code}
                onChange={(event) => setEditingZone({ ...editingZone, code: event.target.value })}
                placeholder="Z-01"
              />
              <FieldInput
                label="Nama ruangan"
                icon="fa-regular fa-square"
                value={editingZone.room}
                onChange={(event) => setEditingZone({ ...editingZone, room: event.target.value })}
                placeholder="Main Hall"
              />
              <FieldInput
                label="Tipe zona"
                icon="fa-solid fa-tag"
                value={editingZone.type}
                onChange={(event) => setEditingZone({ ...editingZone, type: event.target.value })}
                placeholder="Indoor"
              />
              <FieldInput
                label="Kapasitas"
                type="number"
                icon="fa-solid fa-users"
                value={editingZone.capacity}
                onChange={(event) => setEditingZone({ ...editingZone, capacity: event.target.value })}
              />
              <CustomSelect
                label="Lantai"
                value={editingZone.floor}
                onChange={(floor) => setEditingZone((current) => ({ ...current, floor }))}
                options={floorOptions.filter((option) => option.value !== "all")}
              />
              <CustomSelect
                label="Status"
                value={editingZone.status}
                onChange={(status) => setEditingZone((current) => ({ ...current, status }))}
                options={editStatusOptions}
              />
            </div>

            <button
              type="button"
              disabled={isSaving}
              onClick={saveZone}
              className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-md bg-teal-600 px-5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isSaving ? "Menyimpan..." : "Simpan ke Backend"}
            </button>
          </div>
        </div>
      ) : null}
    </AdminShell>
  );
}
