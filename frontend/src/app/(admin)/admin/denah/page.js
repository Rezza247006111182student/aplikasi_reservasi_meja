"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AdminShell from "../../../_components/AdminShell";
import CustomSelect from "../../../_components/CustomSelect";
import FieldInput from "../../../_components/FieldInput";
import { apiFetch, tableStatusLabels } from "../../../_lib/api";

const statusStyles = {
  available: { fill: "#bbf7d0", stroke: "#16a34a", text: "#166534", pill: "bg-green-100 text-green-700" },
  reserved: { fill: "#fecaca", stroke: "#dc2626", text: "#991b1b", pill: "bg-red-100 text-red-700" },
  booked: { fill: "#fecaca", stroke: "#dc2626", text: "#991b1b", pill: "bg-red-100 text-red-700" },
  inactive: { fill: "#e2e8f0", stroke: "#94a3b8", text: "#475569", pill: "bg-slate-100 text-slate-700" },
};

const statusOptions = [
  { label: "Tersedia", value: "available" },
  { label: "Dipesan", value: "reserved" },
  { label: "Tidak aktif", value: "inactive" },
];

const shapeOptions = [
  { label: "Bundar", value: "round" },
  { label: "Persegi", value: "square" },
  { label: "Persegi panjang", value: "rectangle" },
];

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const getSvgPoint = (event) => {
  const svg = event.currentTarget.ownerSVGElement ?? event.currentTarget;
  const point = svg.createSVGPoint();
  point.x = event.clientX;
  point.y = event.clientY;
  return point.matrixTransform(svg.getScreenCTM().inverse());
};

export default function AdminFloorEditorPage() {
  const [tables, setTables] = useState([]);
  const [zones, setZones] = useState([]);
  const [floor, setFloor] = useState("");
  const [room, setRoom] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [draggingId, setDraggingId] = useState("");
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

      const firstTable = tableData[0];
      const firstZone = zoneData[0];
      const nextFloor = floor || firstTable?.floor || firstZone?.floor || "";
      const nextRoom = room || firstTable?.room || firstZone?.room || "";

      setFloor(nextFloor);
      setRoom(nextRoom);
      setSelectedId((current) => current || firstTable?.id || "");
      setNotice({ type: "", message: "" });
    } catch (error) {
      setNotice({ type: "error", message: error.message });
    } finally {
      setIsLoading(false);
    }
  }, [floor, room]);

  useEffect(() => {
    void Promise.resolve().then(loadData);
  }, [loadData]);

  const floorOptions = useMemo(() => {
    const floors = [...new Set([...zones.map((zone) => zone.floor), ...tables.map((table) => table.floor)].filter(Boolean))];
    return floors.map((item) => ({ label: item, value: item }));
  }, [tables, zones]);

  const roomOptions = useMemo(() => {
    const rooms = [
      ...new Set(
        [...zones, ...tables]
          .filter((item) => !floor || item.floor === floor)
          .map((item) => item.room)
          .filter(Boolean),
      ),
    ];
    return rooms.map((item) => ({ label: item, value: item }));
  }, [floor, tables, zones]);

  const visibleTables = useMemo(
    () => tables.filter((table) => table.floor === floor && table.room === room),
    [floor, room, tables],
  );

  const selectedTable =
    visibleTables.find((table) => String(table.id) === String(selectedId)) ??
    visibleTables[0] ??
    null;

  const updateSelectedTable = (patch) => {
    if (!selectedTable) return;
    setTables((current) =>
      current.map((table) =>
        String(table.id) === String(selectedTable.id) ? { ...table, ...patch } : table,
      ),
    );
  };

  const moveSelectedTable = (dx, dy) => {
    if (!selectedTable) return;
    updateSelectedTable({
      x: clamp(Number(selectedTable.x) + dx, 48, 560),
      y: clamp(Number(selectedTable.y) + dy, 56, 360),
    });
  };

  const handleFloorChange = (nextFloor) => {
    const roomForFloor =
      zones.find((zone) => zone.floor === nextFloor)?.room ||
      tables.find((table) => table.floor === nextFloor)?.room ||
      "";

    setFloor(nextFloor);
    setRoom(roomForFloor);
  };

  const handlePointerDown = (event, table) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    setSelectedId(table.id);
    setDraggingId(table.id);
  };

  const handlePointerMove = (event) => {
    if (!draggingId) return;
    const point = getSvgPoint(event);
    setTables((current) =>
      current.map((table) =>
        String(table.id) === String(draggingId)
          ? { ...table, x: clamp(point.x, 48, 560), y: clamp(point.y, 56, 360) }
          : table,
      ),
    );
  };

  const handlePointerUp = () => {
    setDraggingId("");
  };

  const saveSelectedTable = async () => {
    if (!selectedTable) return;
    setIsSaving(true);
    setNotice({ type: "", message: "" });

    try {
      await apiFetch(`/api/admin/tables/${selectedTable.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          x: Number(selectedTable.x),
          y: Number(selectedTable.y),
          width: Number(selectedTable.width),
          height: Number(selectedTable.height),
          rotation: Number(selectedTable.rotation || 0),
          capacity: Number(selectedTable.capacity),
          shape: selectedTable.shape,
          status: selectedTable.status,
        }),
      });

      setNotice({ type: "success", message: "Layout meja berhasil disimpan." });
      await loadData();
    } catch (error) {
      setNotice({ type: "error", message: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminShell
      title="Editor Layout Denah"
      description="Atur posisi meja pada denah restoran berbasis koordinat dan simpan perubahan layout ke backend."
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

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-4 border-b border-slate-200 p-5 lg:grid-cols-[1fr_180px_180px] lg:items-end">
            <div>
              <h3 className="font-bold text-slate-950">Canvas Denah</h3>
              <p className="mt-1 text-sm text-slate-500">
                Drag meja untuk mengubah koordinat, lalu simpan perubahan.
              </p>
            </div>
            <CustomSelect
              label="Lantai"
              value={floor}
              onChange={handleFloorChange}
              options={floorOptions.length ? floorOptions : [{ label: "Belum ada lantai", value: "" }]}
            />
            <CustomSelect
              label="Ruangan"
              value={room}
              onChange={setRoom}
              options={roomOptions.length ? roomOptions : [{ label: "Belum ada ruangan", value: "" }]}
            />
          </div>

          <div className="p-5">
            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 p-3">
              <svg
                className="h-auto min-w-[620px] rounded-md bg-white touch-none"
                viewBox="0 0 620 420"
                role="img"
                aria-label="Editor denah admin"
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
              >
                <rect x="18" y="18" width="584" height="384" rx="12" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" />
                <path d="M164 36V384" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="8 10" />
                <path d="M36 150H584" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="8 10" />
                <path d="M36 276H584" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="8 10" />
                <rect x="36" y="36" width="62" height="54" rx="8" fill="#fef3c7" stroke="#f59e0b" strokeWidth="2" />
                <path d="M58 78V48H80V78" fill="#fff7ed" stroke="#92400e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M80 48L88 54V84L80 78Z" fill="#fde68a" stroke="#92400e" strokeWidth="2" strokeLinejoin="round" />
                <rect x="500" y="322" width="64" height="42" rx="6" fill="#e0f2fe" stroke="#0284c7" />
                <text x="516" y="348" fontSize="10" fontWeight="700" fill="#0369a1">KASIR</text>

                {visibleTables.map((table) => {
                  const style = statusStyles[table.status] ?? statusStyles.available;
                  const isSelected = String(table.id) === String(selectedTable?.id);
                  const width = Number(table.width || 64);
                  const height = Number(table.height || 64);
                  const radius = Math.max(18, Math.min(width, height) / 2);

                  return (
                    <g
                      key={table.id}
                      onPointerDown={(event) => handlePointerDown(event, table)}
                      className="cursor-grab active:cursor-grabbing"
                      transform={`rotate(${Number(table.rotation || 0)} ${table.x} ${table.y})`}
                    >
                      <circle
                        cx={table.x}
                        cy={table.y}
                        r={radius + 10}
                        fill="#ffffff"
                        stroke={isSelected ? "#0f766e" : "#cbd5e1"}
                        strokeWidth={isSelected ? "4" : "2"}
                      />
                      {table.shape === "round" ? (
                        <circle
                          cx={table.x}
                          cy={table.y}
                          r={radius}
                          fill={style.fill}
                          stroke={style.stroke}
                          strokeWidth="2"
                        />
                      ) : (
                        <rect
                          x={Number(table.x) - width / 2}
                          y={Number(table.y) - height / 2}
                          width={width}
                          height={height}
                          rx="8"
                          fill={style.fill}
                          stroke={style.stroke}
                          strokeWidth="2"
                        />
                      )}
                      <text
                        x={table.x}
                        y={Number(table.y) + 4}
                        textAnchor="middle"
                        fontSize="10"
                        fontWeight="700"
                        fill={style.text}
                      >
                        {table.code}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {!isLoading && visibleTables.length === 0 ? (
                <div className="mt-3 rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center">
                  <p className="font-semibold text-slate-950">Belum ada meja di ruangan ini</p>
                  <p className="mt-2 text-sm text-slate-500">
                    Tambahkan meja dari halaman Kelola Meja terlebih dahulu.
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <aside className="grid gap-6">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold uppercase text-teal-700">Meja Terpilih</p>
            <h3 className="mt-2 text-2xl font-bold text-slate-950">{selectedTable?.code || "-"}</h3>
            <p className="mt-1 text-sm text-slate-500">
              {selectedTable ? `${selectedTable.floor} - ${selectedTable.room}` : "Pilih meja dari canvas"}
            </p>

            {selectedTable ? (
              <>
                <div className="mt-5 grid gap-4">
                  <CustomSelect
                    label="Status"
                    value={selectedTable.status}
                    onChange={(status) => updateSelectedTable({ status })}
                    options={statusOptions}
                  />
                  <CustomSelect
                    label="Bentuk"
                    value={selectedTable.shape}
                    onChange={(shape) => updateSelectedTable({ shape })}
                    options={shapeOptions}
                  />
                  <FieldInput
                    label="Kapasitas"
                    type="number"
                    icon="fa-solid fa-users"
                    value={selectedTable.capacity}
                    onChange={(event) => updateSelectedTable({ capacity: event.target.value })}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <FieldInput
                      label="Lebar"
                      type="number"
                      icon="fa-solid fa-left-right"
                      value={selectedTable.width}
                      onChange={(event) => updateSelectedTable({ width: event.target.value })}
                    />
                    <FieldInput
                      label="Tinggi"
                      type="number"
                      icon="fa-solid fa-up-down"
                      value={selectedTable.height}
                      onChange={(event) => updateSelectedTable({ height: event.target.value })}
                    />
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-2">
                  <span />
                  <button type="button" onClick={() => moveSelectedTable(0, -12)} className="h-10 rounded-md border border-slate-300 bg-white text-slate-700 transition hover:border-teal-300 hover:text-teal-700" aria-label="Geser meja ke atas">
                    <i className="fa-solid fa-arrow-up" aria-hidden="true" />
                  </button>
                  <span />
                  <button type="button" onClick={() => moveSelectedTable(-12, 0)} className="h-10 rounded-md border border-slate-300 bg-white text-slate-700 transition hover:border-teal-300 hover:text-teal-700" aria-label="Geser meja ke kiri">
                    <i className="fa-solid fa-arrow-left" aria-hidden="true" />
                  </button>
                  <div className="flex h-10 items-center justify-center rounded-md bg-slate-100 text-xs font-semibold text-slate-600">
                    Move
                  </div>
                  <button type="button" onClick={() => moveSelectedTable(12, 0)} className="h-10 rounded-md border border-slate-300 bg-white text-slate-700 transition hover:border-teal-300 hover:text-teal-700" aria-label="Geser meja ke kanan">
                    <i className="fa-solid fa-arrow-right" aria-hidden="true" />
                  </button>
                  <span />
                  <button type="button" onClick={() => moveSelectedTable(0, 12)} className="h-10 rounded-md border border-slate-300 bg-white text-slate-700 transition hover:border-teal-300 hover:text-teal-700" aria-label="Geser meja ke bawah">
                    <i className="fa-solid fa-arrow-down" aria-hidden="true" />
                  </button>
                  <span />
                </div>

                <button
                  type="button"
                  disabled={isSaving}
                  onClick={saveSelectedTable}
                  className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-md bg-teal-600 px-5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {isSaving ? "Menyimpan..." : "Simpan Layout"}
                </button>
              </>
            ) : null}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="font-bold text-slate-950">Daftar Meja Ruangan</h3>
            <div className="mt-4 grid gap-2">
              {visibleTables.map((table) => (
                <button
                  key={table.id}
                  type="button"
                  onClick={() => setSelectedId(table.id)}
                  className={`flex items-center justify-between rounded-md px-3 py-2 text-sm transition ${
                    String(selectedTable?.id) === String(table.id)
                      ? "bg-teal-50 text-teal-700"
                      : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <span className="font-semibold">{table.code}</span>
                  <span className={`rounded-md px-2 py-1 text-xs font-semibold ${(statusStyles[table.status] ?? statusStyles.available).pill}`}>
                    {tableStatusLabels[table.status] ?? table.status}
                  </span>
                </button>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </AdminShell>
  );
}
