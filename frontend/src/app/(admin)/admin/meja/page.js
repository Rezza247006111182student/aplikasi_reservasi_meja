"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AdminShell from "../../../_components/AdminShell";
import CustomSelect from "../../../_components/CustomSelect";
import FieldInput from "../../../_components/FieldInput";
import { apiFetch, tableStatusLabels } from "../../../_lib/api";

const allOption = { label: "Semua", value: "all" };

const statusOptions = [
  { label: "Semua status", value: "all" },
  { label: "Tersedia", value: "available" },
  { label: "Telah dipesan", value: "reserved" },
  { label: "Tidak aktif", value: "inactive" },
];

const editStatusOptions = statusOptions.filter((option) => option.value !== "all");

const shapeOptions = [
  { label: "Bundar", value: "round" },
  { label: "Persegi", value: "square" },
  { label: "Persegi panjang", value: "rectangle" },
];

const statusClass = {
  available: "bg-green-100 text-green-700",
  reserved: "bg-amber-100 text-amber-700",
  booked: "bg-red-100 text-red-700",
  unavailable: "bg-slate-100 text-slate-700",
  inactive: "bg-slate-100 text-slate-700",
};

const shapeLabels = {
  round: "Bundar",
  square: "Persegi",
  rectangle: "Persegi panjang",
};

const emptyTable = {
  id: "",
  code: "",
  zoneId: "",
  floor: "Lantai 1",
  room: "",
  capacity: 4,
  shape: "round",
  x: 140,
  y: 120,
  width: 68,
  height: 68,
  rotation: 0,
  status: "available",
};

export default function AdminTablesPage() {
  const [tables, setTables] = useState([]);
  const [zones, setZones] = useState([]);
  const [roomFilter, setRoomFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editingTable, setEditingTable] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState({ type: "", message: "" });

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [tableData, zoneData] = await Promise.all([
        apiFetch("/api/tables"),
        apiFetch("/api/zones"),
      ]);

      setTables(tableData);
      setZones(zoneData);
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

  const roomOptions = useMemo(() => {
    const rooms = [...new Set(zones.map((zone) => zone.room).filter(Boolean))];
    return [allOption, ...rooms.map((room) => ({ label: room, value: room }))];
  }, [zones]);

  const zoneOptions = useMemo(
    () =>
      zones.map((zone) => ({
        label: `${zone.code} - ${zone.room} (${zone.floor})`,
        value: String(zone.id),
      })),
    [zones],
  );

  const filteredTables = useMemo(() => {
    return tables.filter((table) => {
      const matchRoom = roomFilter === "all" || table.room === roomFilter;
      const matchStatus = statusFilter === "all" || table.status === statusFilter;
      return matchRoom && matchStatus;
    });
  }, [roomFilter, statusFilter, tables]);

  const stats = [
    ["Total Meja", tables.length, "fa-solid fa-chair"],
    ["Aktif", tables.filter((table) => table.status !== "inactive").length, "fa-regular fa-circle-check"],
    ["Tersedia", tables.filter((table) => table.status === "available").length, "fa-solid fa-check"],
    ["Dipakai/Dipesan", tables.filter((table) => ["reserved", "booked"].includes(table.status)).length, "fa-regular fa-clock"],
  ];

  const openCreateModal = () => {
    const firstZone = zones[0];
    setEditingTable({
      ...emptyTable,
      zoneId: firstZone ? String(firstZone.id) : "",
      floor: firstZone?.floor || "Lantai 1",
      room: firstZone?.room || "",
    });
  };

  const handleZoneChange = (zoneId) => {
    const selectedZone = zones.find((zone) => String(zone.id) === String(zoneId));
    setEditingTable((current) => ({
      ...current,
      zoneId,
      floor: selectedZone?.floor || current.floor,
      room: selectedZone?.room || current.room,
    }));
  };

  const saveTable = async () => {
    setIsSaving(true);
    setNotice({ type: "", message: "" });

    try {
      const payload = {
        code: editingTable.code,
        zoneId: Number(editingTable.zoneId),
        floor: editingTable.floor,
        room: editingTable.room,
        capacity: Number(editingTable.capacity || 0),
        shape: editingTable.shape,
        x: Number(editingTable.x || 0),
        y: Number(editingTable.y || 0),
        width: Number(editingTable.width || 0),
        height: Number(editingTable.height || 0),
        rotation: Number(editingTable.rotation || 0),
        status: editingTable.status,
      };

      if (editingTable.id) {
        await apiFetch(`/api/admin/tables/${editingTable.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch("/api/admin/tables", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      setEditingTable(null);
      await loadData();
      setNotice({ type: "success", message: "Data meja berhasil disimpan." });
    } catch (error) {
      setNotice({ type: "error", message: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleActive = async (table) => {
    const nextStatus = table.status === "inactive" ? "available" : "inactive";
    try {
      await apiFetch(`/api/admin/tables/${table.id}`, {
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
      title="Kelola Meja"
      description="Kelola data meja restoran, kapasitas, ruangan, bentuk meja, dan status aktif/nonaktif dari backend."
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
                <p className="mt-2 text-3xl font-bold text-slate-950">{isLoading ? "..." : value}</p>
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
            <h3 className="font-bold text-slate-950">Daftar Meja</h3>
            <p className="mt-1 text-sm text-slate-500">
              Data meja diambil langsung dari tabel tables.
            </p>
          </div>
          <CustomSelect label="Ruangan" value={roomFilter} onChange={setRoomFilter} options={roomOptions} />
          <CustomSelect label="Status" value={statusFilter} onChange={setStatusFilter} options={statusOptions} />
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-teal-600 px-5 text-sm font-semibold text-white transition hover:bg-teal-700"
          >
            <i className="fa-solid fa-plus" aria-hidden="true" />
            Tambah Meja
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3 font-semibold">Kode Meja</th>
                <th className="px-5 py-3 font-semibold">Lokasi</th>
                <th className="px-5 py-3 font-semibold">Kapasitas</th>
                <th className="px-5 py-3 font-semibold">Bentuk</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Aktif</th>
                <th className="px-5 py-3 font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="px-5 py-8 text-center font-semibold text-slate-500">
                    Memuat data meja...
                  </td>
                </tr>
              ) : null}

              {!isLoading &&
                filteredTables.map((table) => (
                  <tr key={table.id}>
                    <td className="px-5 py-4 font-bold text-slate-950">{table.code}</td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-900">{table.floor}</p>
                      <p className="mt-1 text-xs text-slate-500">{table.room}</p>
                    </td>
                    <td className="px-5 py-4 text-slate-600">{table.capacity} orang</td>
                    <td className="px-5 py-4 text-slate-600">{shapeLabels[table.shape] ?? table.shape}</td>
                    <td className="px-5 py-4">
                      <span className={`rounded-md px-3 py-1 text-xs font-semibold ${statusClass[table.status]}`}>
                        {tableStatusLabels[table.status] ?? table.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => toggleActive(table)}
                        className={`relative h-6 w-11 rounded-full transition ${
                          table.status !== "inactive" ? "bg-teal-600" : "bg-slate-300"
                        }`}
                        aria-label="Toggle status aktif meja"
                      >
                        <span
                          className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                            table.status !== "inactive" ? "left-6" : "left-1"
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => setEditingTable({ ...table, zoneId: String(table.zoneId || "") })}
                        className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-teal-300 hover:text-teal-700"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}

              {!isLoading && filteredTables.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-5 py-8 text-center font-semibold text-slate-500">
                    Belum ada meja sesuai filter.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      {editingTable ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-5 py-8">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-2xl shadow-slate-950/20">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase text-teal-700">Form Meja</p>
                <h2 className="mt-2 text-2xl font-bold text-slate-950">
                  {editingTable.id ? `Edit ${editingTable.code}` : "Tambah Meja"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setEditingTable(null)}
                className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-100 text-slate-700 transition hover:bg-slate-200"
                aria-label="Tutup form meja"
              >
                <i className="fa-solid fa-xmark" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <FieldInput
                label="Kode meja"
                icon="fa-solid fa-hashtag"
                value={editingTable.code}
                onChange={(event) => setEditingTable({ ...editingTable, code: event.target.value })}
                placeholder="A-01"
              />
              <FieldInput
                label="Kapasitas"
                type="number"
                min="1"
                icon="fa-solid fa-user-group"
                value={editingTable.capacity}
                onChange={(event) => setEditingTable({ ...editingTable, capacity: event.target.value })}
              />
              <CustomSelect
                label="Zona"
                value={String(editingTable.zoneId || "")}
                onChange={handleZoneChange}
                options={zoneOptions.length ? zoneOptions : [{ label: "Belum ada zona", value: "" }]}
              />
              <CustomSelect
                label="Bentuk"
                value={editingTable.shape}
                onChange={(shape) => setEditingTable((current) => ({ ...current, shape }))}
                options={shapeOptions}
              />
              <CustomSelect
                label="Status"
                value={editingTable.status}
                onChange={(status) => setEditingTable((current) => ({ ...current, status }))}
                options={editStatusOptions}
              />
              <FieldInput
                label="Rotasi"
                type="number"
                icon="fa-solid fa-rotate"
                value={editingTable.rotation}
                onChange={(event) => setEditingTable({ ...editingTable, rotation: event.target.value })}
              />
              <FieldInput
                label="Posisi X"
                type="number"
                icon="fa-solid fa-arrows-left-right"
                value={editingTable.x}
                onChange={(event) => setEditingTable({ ...editingTable, x: event.target.value })}
              />
              <FieldInput
                label="Posisi Y"
                type="number"
                icon="fa-solid fa-arrows-up-down"
                value={editingTable.y}
                onChange={(event) => setEditingTable({ ...editingTable, y: event.target.value })}
              />
              <FieldInput
                label="Lebar"
                type="number"
                icon="fa-solid fa-left-right"
                value={editingTable.width}
                onChange={(event) => setEditingTable({ ...editingTable, width: event.target.value })}
              />
              <FieldInput
                label="Tinggi"
                type="number"
                icon="fa-solid fa-up-down"
                value={editingTable.height}
                onChange={(event) => setEditingTable({ ...editingTable, height: event.target.value })}
              />
            </div>

            <button
              type="button"
              disabled={isSaving}
              onClick={saveTable}
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
