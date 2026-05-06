"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AdminShell from "../../../_components/AdminShell";
import CustomSelect from "../../../_components/CustomSelect";
import FieldInput from "../../../_components/FieldInput";
import { apiFetch, tableStatusLabels } from "../../../_lib/api";

const statusOptions = [
  { label: "Aktif", value: "active" },
  { label: "Maintenance", value: "maintenance" },
  { label: "Nonaktif", value: "inactive" },
];

const tableStatusOptions = [
  { label: "Tersedia", value: "available" },
  { label: "Telah dipesan", value: "reserved" },
  { label: "Tidak aktif", value: "inactive" },
];

const shapeOptions = [
  { label: "Bundar", value: "round" },
  { label: "Persegi", value: "square" },
  { label: "Persegi panjang", value: "rectangle" },
];

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

const tablePillClass = {
  available: "bg-green-100 text-green-700",
  reserved: "bg-amber-100 text-amber-700",
  booked: "bg-red-100 text-red-700",
  inactive: "bg-slate-100 text-slate-700",
};

const slugCode = (value, fallback) =>
  String(value || fallback)
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 16);

const emptyRoom = {
  id: "",
  code: "",
  floor: "Lantai 1",
  room: "",
  type: "Indoor",
  capacity: 0,
  status: "active",
};

const emptyTable = {
  code: "",
  zoneId: "",
  capacity: 4,
  shape: "round",
  status: "available",
};

const defaultLayout = {
  hasCashier: false,
  cashierX: 330,
  cashierY: 260,
  doorX: 54,
  doorY: 48,
};

export default function AdminZonesPage() {
  const [zones, setZones] = useState([]);
  const [tables, setTables] = useState([]);
  const [layouts, setLayouts] = useState([]);
  const [selectedFloor, setSelectedFloor] = useState("all");
  const [roomForm, setRoomForm] = useState(null);
  const [tableForm, setTableForm] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState({ type: "", message: "" });

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [zoneData, tableData, layoutData] = await Promise.all([
        apiFetch("/api/zones"),
        apiFetch("/api/tables"),
        apiFetch("/api/room-layouts"),
      ]);
      setZones(zoneData);
      setTables(tableData);
      setLayouts(layoutData);
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

  const layoutByZoneId = useMemo(() => {
    const map = new Map();
    layouts.forEach((layout) => map.set(Number(layout.zoneId), layout));
    return map;
  }, [layouts]);

  const zonesWithTables = useMemo(
    () =>
      zones.map((zone) => {
        const zoneTables = tables.filter((table) => Number(table.zoneId) === Number(zone.id));

        return {
          ...zone,
          layout: layoutByZoneId.get(Number(zone.id)) ?? defaultLayout,
          tables: zoneTables,
          tableCount: zoneTables.length,
        };
      }),
    [layoutByZoneId, tables, zones],
  );

  const floors = useMemo(() => {
    const grouped = new Map();

    zonesWithTables.forEach((zone) => {
      if (!grouped.has(zone.floor)) grouped.set(zone.floor, []);
      grouped.get(zone.floor).push(zone);
    });

    return [...grouped.entries()]
      .map(([floor, rooms]) => ({
        floor,
        rooms: rooms.sort((a, b) => a.room.localeCompare(b.room)),
        tableCount: rooms.reduce((total, room) => total + room.tableCount, 0),
      }))
      .filter((item) => selectedFloor === "all" || item.floor === selectedFloor)
      .sort((a, b) => a.floor.localeCompare(b.floor));
  }, [selectedFloor, zonesWithTables]);

  const floorOptions = useMemo(() => {
    const list = [...new Set(zones.map((zone) => zone.floor).filter(Boolean))].sort();
    return [{ label: "Semua lantai", value: "all" }, ...list.map((floor) => ({ label: floor, value: floor }))];
  }, [zones]);

  const stats = [
    ["Total Lantai", new Set(zones.map((zone) => zone.floor)).size, "fa-solid fa-building"],
    ["Total Ruangan", zones.length, "fa-solid fa-door-open"],
    ["Total Meja", tables.length, "fa-solid fa-chair"],
    ["Ruangan Kasir", layouts.filter((layout) => layout.hasCashier).length, "fa-solid fa-cash-register"],
  ];

  const openFloorModal = () => {
    setRoomForm({
      ...emptyRoom,
      mode: "floor",
      floor: `Lantai ${new Set(zones.map((zone) => zone.floor)).size + 1}`,
      room: "Ruangan Baru",
    });
  };

  const openRoomModal = (floor = zones[0]?.floor || "Lantai 1") => {
    setRoomForm({
      ...emptyRoom,
      floor,
      mode: "room",
    });
  };

  const openTableModal = (zone, table = null) => {
    if (table) {
      setTableForm({
        id: table.id,
        zoneId: String(zone.id),
        floor: zone.floor,
        room: zone.room,
        code: table.code,
        capacity: table.capacity,
        shape: table.shape,
        status: table.status,
        x: table.x,
        y: table.y,
        width: table.width,
        height: table.height,
        rotation: table.rotation,
      });
      return;
    }

    setTableForm({
      ...emptyTable,
      zoneId: String(zone.id),
      floor: zone.floor,
      room: zone.room,
      code: `${slugCode(zone.room, "T")}-${zone.tableCount + 1}`,
    });
  };

  const saveRoom = async () => {
    setIsSaving(true);
    setNotice({ type: "", message: "" });

    try {
      const payload = {
        code: roomForm.code || slugCode(`${roomForm.floor}-${roomForm.room}`, "ZONE"),
        floor: roomForm.floor,
        room: roomForm.room,
        type: roomForm.type,
        capacity: Number(roomForm.capacity || 0),
        status: roomForm.status,
      };

      if (roomForm.id) {
        await apiFetch(`/api/admin/zones/${roomForm.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch("/api/admin/zones", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      setRoomForm(null);
      await loadData();
      setNotice({ type: "success", message: "Data lantai dan ruangan berhasil disimpan." });
    } catch (error) {
      setNotice({ type: "error", message: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const saveTable = async () => {
    const zone = zones.find((item) => String(item.id) === String(tableForm.zoneId));

    if (!zone) {
      setNotice({ type: "error", message: "Pilih ruangan terlebih dahulu." });
      return;
    }

    setIsSaving(true);
    setNotice({ type: "", message: "" });

    try {
      const existingCount = tables.filter((table) => Number(table.zoneId) === Number(zone.id)).length;
      const payload = {
        code: tableForm.code,
        zoneId: Number(zone.id),
        floor: zone.floor,
        room: zone.room,
        capacity: Number(tableForm.capacity || 1),
        shape: tableForm.shape,
        x: Number(tableForm.x ?? 120 + (existingCount % 3) * 86),
        y: Number(tableForm.y ?? 110 + Math.floor(existingCount / 3) * 82),
        width: Number(tableForm.width ?? (tableForm.shape === "rectangle" ? 72 : 48)),
        height: Number(tableForm.height ?? 48),
        rotation: Number(tableForm.rotation || 0),
        status: tableForm.status,
      };

      if (tableForm.id) {
        await apiFetch(`/api/admin/tables/${tableForm.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch("/api/admin/tables", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      setTableForm(null);
      await loadData();
      setNotice({ type: "success", message: "Data meja berhasil disimpan." });
    } catch (error) {
      setNotice({ type: "error", message: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleRoomStatus = async (zone) => {
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
      description="Kelola struktur lantai, ruangan, dan meja. Pengaturan posisi visual dilakukan penuh dari Editor Denah."
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
        <div className="grid gap-4 border-b border-slate-200 p-5 lg:grid-cols-[1fr_190px_auto_auto] lg:items-end">
          <div>
            <h3 className="font-bold text-slate-950">Struktur Lantai dan Ruangan</h3>
            <p className="mt-1 text-sm text-slate-500">
              Setiap lantai berisi ruangan, dan setiap ruangan memiliki daftar meja yang bisa ditambah atau diedit.
            </p>
          </div>
          <CustomSelect label="Filter Lantai" value={selectedFloor} onChange={setSelectedFloor} options={floorOptions} />
          <button
            type="button"
            onClick={openFloorModal}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-800 transition hover:border-teal-300 hover:text-teal-700"
          >
            <i className="fa-solid fa-building-circle-arrow-right" aria-hidden="true" />
            Tambah Lantai
          </button>
          <button
            type="button"
            onClick={() => openRoomModal(selectedFloor === "all" ? zones[0]?.floor : selectedFloor)}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-teal-600 px-5 text-sm font-semibold text-white transition hover:bg-teal-700"
          >
            <i className="fa-solid fa-plus" aria-hidden="true" />
            Tambah Ruangan
          </button>
        </div>

        <div className="grid gap-5 p-5">
          {isLoading ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center font-semibold text-slate-500">
              Memuat struktur restoran...
            </div>
          ) : null}

          {!isLoading &&
            floors.map((floor) => (
              <article key={floor.floor} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-white text-teal-700 shadow-sm">
                      <i className="fa-solid fa-building" aria-hidden="true" />
                    </span>
                    <div>
                      <h4 className="font-bold text-slate-950">{floor.floor}</h4>
                      <p className="mt-1 text-sm text-slate-500">
                        {floor.rooms.length} ruangan - {floor.tableCount} meja
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => openRoomModal(floor.floor)}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 transition hover:border-teal-300 hover:text-teal-700"
                  >
                    <i className="fa-solid fa-door-open" aria-hidden="true" />
                    Tambah Ruangan
                  </button>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  {floor.rooms.map((room) => (
                    <section key={room.id} className="rounded-lg border border-slate-200 bg-white p-4">
                      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h5 className="font-bold text-slate-950">{room.room}</h5>
                            <span className={`rounded-md px-2 py-1 text-xs font-semibold ${statusClass[room.status]}`}>
                              {statusLabels[room.status] ?? room.status}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-slate-500">
                            {room.code} - {room.type} - {room.tableCount} meja
                          </p>
                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            Kasir: {room.layout.hasCashier ? "Ada" : "Tidak ada"} - Pintu ({room.layout.doorX}, {room.layout.doorY})
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setRoomForm({ ...room, mode: "edit" })}
                            className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 transition hover:border-teal-300 hover:text-teal-700"
                            aria-label="Edit ruangan"
                          >
                            <i className="fa-regular fa-pen-to-square" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleRoomStatus(room)}
                            className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-100 text-slate-700 transition hover:bg-slate-200"
                            aria-label="Toggle status ruangan"
                          >
                            <i className="fa-solid fa-repeat" aria-hidden="true" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-2">
                        {room.tables.slice(0, 4).map((table) => (
                          <div key={table.id} className="flex items-center justify-between gap-3 rounded-md bg-slate-50 px-3 py-2 text-sm">
                            <span className="font-semibold text-slate-800">{table.code}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-500">{table.capacity} kursi</span>
                              <span className={`rounded-md px-2 py-1 text-[11px] font-semibold ${tablePillClass[table.status] ?? tablePillClass.inactive}`}>
                                {tableStatusLabels[table.status] ?? table.status}
                              </span>
                              <button
                                type="button"
                                onClick={() => openTableModal(room, table)}
                                className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 transition hover:border-teal-300 hover:text-teal-700"
                                aria-label={`Edit meja ${table.code}`}
                              >
                                <i className="fa-regular fa-pen-to-square text-xs" aria-hidden="true" />
                              </button>
                            </div>
                          </div>
                        ))}
                        {room.tables.length > 4 ? (
                          <p className="text-xs font-semibold text-slate-500">
                            +{room.tables.length - 4} meja lainnya
                          </p>
                        ) : null}
                      </div>

                      <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => openTableModal(room)}
                          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-teal-600 px-4 text-sm font-semibold text-white transition hover:bg-teal-700"
                        >
                          <i className="fa-solid fa-chair" aria-hidden="true" />
                          Tambah Meja
                        </button>
                        <a
                          href="/admin/denah"
                          className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 transition hover:border-teal-300 hover:text-teal-700"
                        >
                          <i className="fa-solid fa-object-group" aria-hidden="true" />
                          Editor Denah
                        </a>
                      </div>
                    </section>
                  ))}
                </div>
              </article>
            ))}

          {!isLoading && floors.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <p className="font-semibold text-slate-950">Belum ada lantai atau ruangan</p>
              <p className="mt-2 text-sm text-slate-500">Tambahkan lantai pertama untuk mulai menyusun struktur restoran.</p>
            </div>
          ) : null}
        </div>
      </section>

      {roomForm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-5 py-8">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-lg bg-white p-6 shadow-2xl shadow-slate-950/20">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase text-teal-700">Form Ruangan</p>
                <h2 className="mt-2 text-2xl font-bold text-slate-950">
                  {roomForm.id ? `Edit ${roomForm.room}` : roomForm.mode === "floor" ? "Tambah Lantai" : "Tambah Ruangan"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setRoomForm(null)}
                className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-100 text-slate-700 transition hover:bg-slate-200"
                aria-label="Tutup form ruangan"
              >
                <i className="fa-solid fa-xmark" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <FieldInput
                label="Nama lantai"
                icon="fa-solid fa-building"
                value={roomForm.floor}
                onChange={(event) => setRoomForm({ ...roomForm, floor: event.target.value })}
                placeholder="Lantai 1"
              />
              <FieldInput
                label="Nama ruangan"
                icon="fa-solid fa-door-open"
                value={roomForm.room}
                onChange={(event) => setRoomForm({ ...roomForm, room: event.target.value })}
                placeholder="Main Hall"
              />
              <FieldInput
                label="Kode ruangan"
                icon="fa-solid fa-hashtag"
                value={roomForm.code}
                onChange={(event) => setRoomForm({ ...roomForm, code: event.target.value })}
                placeholder="LT1-MAIN"
              />
              <FieldInput
                label="Tipe ruangan"
                icon="fa-solid fa-tag"
                value={roomForm.type}
                onChange={(event) => setRoomForm({ ...roomForm, type: event.target.value })}
                placeholder="Indoor"
              />
              <FieldInput
                label="Kapasitas"
                type="number"
                icon="fa-solid fa-users"
                value={roomForm.capacity}
                onChange={(event) => setRoomForm({ ...roomForm, capacity: event.target.value })}
              />
              <CustomSelect
                label="Status"
                value={roomForm.status}
                onChange={(status) => setRoomForm((current) => ({ ...current, status }))}
                options={statusOptions}
              />
            </div>

            <button
              type="button"
              disabled={isSaving}
              onClick={saveRoom}
              className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-md bg-teal-600 px-5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isSaving ? "Menyimpan..." : "Simpan Ruangan"}
            </button>
          </div>
        </div>
      ) : null}

      {tableForm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-5 py-8">
          <div className="w-full max-w-xl rounded-lg bg-white p-6 shadow-2xl shadow-slate-950/20">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase text-teal-700">Form Meja</p>
                <h2 className="mt-2 text-2xl font-bold text-slate-950">
                  {tableForm.id ? "Edit Meja" : "Tambah Meja"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">{tableForm.floor} - {tableForm.room}</p>
              </div>
              <button
                type="button"
                onClick={() => setTableForm(null)}
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
                value={tableForm.code}
                onChange={(event) => setTableForm({ ...tableForm, code: event.target.value })}
                placeholder="A-01"
              />
              <FieldInput
                label="Kapasitas"
                type="number"
                icon="fa-solid fa-users"
                value={tableForm.capacity}
                onChange={(event) => setTableForm({ ...tableForm, capacity: event.target.value })}
              />
              <CustomSelect
                label="Bentuk"
                value={tableForm.shape}
                onChange={(shape) => setTableForm((current) => ({ ...current, shape }))}
                options={shapeOptions}
              />
              <CustomSelect
                label="Status"
                value={tableForm.status}
                onChange={(status) => setTableForm((current) => ({ ...current, status }))}
                options={tableStatusOptions}
              />
              <FieldInput
                label="Posisi X"
                type="number"
                icon="fa-solid fa-arrows-left-right"
                value={tableForm.x ?? ""}
                onChange={(event) => setTableForm({ ...tableForm, x: event.target.value })}
              />
              <FieldInput
                label="Posisi Y"
                type="number"
                icon="fa-solid fa-arrows-up-down"
                value={tableForm.y ?? ""}
                onChange={(event) => setTableForm({ ...tableForm, y: event.target.value })}
              />
            </div>

            <button
              type="button"
              disabled={isSaving}
              onClick={saveTable}
              className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-md bg-teal-600 px-5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isSaving ? "Menyimpan..." : tableForm.id ? "Simpan Perubahan Meja" : "Tambah Meja"}
            </button>
          </div>
        </div>
      ) : null}

    </AdminShell>
  );
}
