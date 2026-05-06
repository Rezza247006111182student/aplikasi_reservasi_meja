"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AdminShell from "../../../_components/AdminShell";
import CustomSelect from "../../../_components/CustomSelect";
import FieldInput from "../../../_components/FieldInput";
import { apiFetch, tableStatusLabels } from "../../../_lib/api";

const statusStyles = {
  available: { fill: "#bbf7d0", stroke: "#16a34a", text: "#166534", pill: "bg-green-100 text-green-700" },
  reserved: { fill: "#fde68a", stroke: "#f59e0b", text: "#92400e", pill: "bg-amber-100 text-amber-700" },
  booked: { fill: "#fecaca", stroke: "#dc2626", text: "#991b1b", pill: "bg-red-100 text-red-700" },
  unavailable: { fill: "#f1f5f9", stroke: "#64748b", text: "#334155", pill: "bg-slate-100 text-slate-700" },
  inactive: { fill: "#e2e8f0", stroke: "#94a3b8", text: "#475569", pill: "bg-slate-100 text-slate-700" },
};

const statusOptions = [
  { label: "Tersedia", value: "available" },
  { label: "Telah dipesan", value: "reserved" },
  { label: "Tidak aktif", value: "inactive" },
];

const shapeOptions = [
  { label: "Bundar", value: "round" },
  { label: "Persegi", value: "square" },
  { label: "Persegi panjang", value: "rectangle" },
];

const defaultLayout = {
  hasCashier: false,
  cashierX: 500,
  cashierY: 342,
  cashierWidth: 64,
  cashierHeight: 42,
  cashierRotation: 0,
  doorX: 67,
  doorY: 63,
  doorWidth: 62,
  doorHeight: 54,
  doorRotation: 0,
};

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
  const [layouts, setLayouts] = useState([]);
  const [floor, setFloor] = useState("");
  const [room, setRoom] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [dragTarget, setDragTarget] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState({ type: "", message: "" });

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [tableData, zoneData, layoutData] = await Promise.all([
        apiFetch("/api/tables"),
        apiFetch("/api/zones"),
        apiFetch("/api/room-layouts"),
      ]);

      setTables(tableData);
      setZones(zoneData);
      setLayouts(layoutData);

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

  const currentZone = useMemo(
    () => zones.find((zone) => zone.floor === floor && zone.room === room) ?? null,
    [floor, room, zones],
  );

  const currentLayout = useMemo(() => {
    if (!currentZone) return defaultLayout;
    return layouts.find((layout) => Number(layout.zoneId) === Number(currentZone.id)) ?? defaultLayout;
  }, [currentZone, layouts]);

  const selectedTable =
    visibleTables.find((table) => String(table.id) === String(selectedId)) ??
    visibleTables[0] ??
    null;
  const doorWidth = Number(currentLayout.doorWidth || defaultLayout.doorWidth);
  const doorHeight = Number(currentLayout.doorHeight || defaultLayout.doorHeight);
  const doorIconScale = Math.max(0.6, Math.min(1.8, Math.min(doorWidth / 62, doorHeight / 54)));
  const cashierWidth = Number(currentLayout.cashierWidth || defaultLayout.cashierWidth);
  const cashierHeight = Number(currentLayout.cashierHeight || defaultLayout.cashierHeight);

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

  const updateCurrentLayout = (patch) => {
    if (!currentZone) return;

    setLayouts((current) => {
      const existing = current.find((layout) => Number(layout.zoneId) === Number(currentZone.id));
      const nextLayout = {
        ...(existing ?? { ...defaultLayout, zoneId: currentZone.id }),
        ...patch,
        zoneId: currentZone.id,
      };

      if (existing) {
        return current.map((layout) =>
          Number(layout.zoneId) === Number(currentZone.id) ? nextLayout : layout,
        );
      }

      return [...current, nextLayout];
    });
  };

  const handlePointerDown = (event, target) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragTarget(target);
    if (target.type === "table") setSelectedId(target.id);
  };

  const handlePointerMove = (event) => {
    if (!dragTarget) return;
    const point = getSvgPoint(event);
    const nextX = clamp(point.x, 42, 578);
    const nextY = clamp(point.y, 46, 380);

    if (dragTarget.type === "door") {
      updateCurrentLayout({ doorX: Number(nextX.toFixed(2)), doorY: Number(nextY.toFixed(2)) });
      return;
    }

    if (dragTarget.type === "cashier") {
      updateCurrentLayout({ cashierX: Number(nextX.toFixed(2)), cashierY: Number(nextY.toFixed(2)) });
      return;
    }

    setTables((current) =>
      current.map((table) =>
        String(table.id) === String(dragTarget.id)
          ? { ...table, x: nextX, y: nextY }
          : table,
      ),
    );
  };

  const handlePointerUp = () => {
    setDragTarget(null);
  };

  const saveSelectedTable = async () => {
    if (!currentZone) return;
    setIsSaving(true);
    setNotice({ type: "", message: "" });

    try {
      await apiFetch(`/api/admin/room-layouts/${currentZone.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          hasCashier: currentLayout.hasCashier,
          cashierX: Number(currentLayout.cashierX),
          cashierY: Number(currentLayout.cashierY),
          cashierWidth: Number(currentLayout.cashierWidth),
          cashierHeight: Number(currentLayout.cashierHeight),
          cashierRotation: Number(currentLayout.cashierRotation || 0),
          doorX: Number(currentLayout.doorX),
          doorY: Number(currentLayout.doorY),
          doorWidth: Number(currentLayout.doorWidth),
          doorHeight: Number(currentLayout.doorHeight),
          doorRotation: Number(currentLayout.doorRotation || 0),
        }),
      });

      await Promise.all(
        visibleTables.map((table) =>
          apiFetch(`/api/admin/tables/${table.id}`, {
            method: "PATCH",
            body: JSON.stringify({
              x: Number(table.x),
              y: Number(table.y),
              width: Number(table.width),
              height: Number(table.height),
              rotation: Number(table.rotation || 0),
              capacity: Number(table.capacity),
              shape: table.shape,
              status: table.status,
            }),
          }),
        ),
      );

      setNotice({ type: "success", message: "Layout ruangan berhasil disimpan." });
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
                onPointerCancel={handlePointerUp}
              >
                <rect x="18" y="18" width="584" height="384" rx="12" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" />
                <path d="M164 36V384" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="8 10" />
                <path d="M36 150H584" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="8 10" />
                <path d="M36 276H584" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="8 10" />
                <g
                  transform={`translate(${currentLayout.doorX} ${currentLayout.doorY}) rotate(${Number(currentLayout.doorRotation || 0)})`}
                  className="cursor-grab active:cursor-grabbing"
                  onPointerDown={(event) => handlePointerDown(event, { type: "door" })}
                >
                  <rect
                    x={-doorWidth / 2}
                    y={-doorHeight / 2}
                    width={doorWidth}
                    height={doorHeight}
                    rx="8"
                    fill="#fef3c7"
                    stroke="#f59e0b"
                    strokeWidth="2"
                  />
                  <g transform={`scale(${doorIconScale})`}>
                    <path d="M-9 15V-15H13V15" fill="#fff7ed" stroke="#92400e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M13 -15L21 -9V21L13 15Z" fill="#fde68a" stroke="#92400e" strokeWidth="2" strokeLinejoin="round" />
                  </g>
                  <text x="0" y={doorHeight / 2 + 13} textAnchor="middle" fontSize="9" fontWeight="700" fill="#92400e">PINTU</text>
                </g>
                {currentLayout.hasCashier ? (
                  <g
                    transform={`translate(${currentLayout.cashierX} ${currentLayout.cashierY}) rotate(${Number(currentLayout.cashierRotation || 0)})`}
                    className="cursor-grab active:cursor-grabbing"
                    onPointerDown={(event) => handlePointerDown(event, { type: "cashier" })}
                  >
                    <rect
                      x={-cashierWidth / 2}
                      y={-cashierHeight / 2}
                      width={cashierWidth}
                      height={cashierHeight}
                      rx="6"
                      fill="#e0f2fe"
                      stroke="#0284c7"
                    />
                    <text x="0" y="5" textAnchor="middle" fontSize="10" fontWeight="700" fill="#0369a1">KASIR</text>
                  </g>
                ) : null}

                {visibleTables.map((table) => {
                  const style = statusStyles[table.status] ?? statusStyles.available;
                  const isSelected = String(table.id) === String(selectedTable?.id);
                  const width = Number(table.width || 64);
                  const height = Number(table.height || 64);
                  const radius = Math.max(18, Math.min(width, height) / 2);

                  return (
                    <g
                      key={table.id}
                      onPointerDown={(event) => handlePointerDown(event, { type: "table", id: table.id })}
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

        <aside className="grid gap-6 pr-1 xl:sticky xl:top-24 xl:max-h-[calc(100vh-7rem)] xl:self-start xl:overflow-y-auto">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold uppercase text-teal-700">Pengaturan Ruangan</p>
            <h3 className="mt-2 text-2xl font-bold text-slate-950">
              {currentZone ? `${currentZone.floor} - ${currentZone.room}` : "-"}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Drag pintu dan kasir langsung di canvas atau ubah koordinatnya dari panel ini.
            </p>

            <div className="mt-5 grid gap-4">
              <label className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 p-4">
                <input
                  type="checkbox"
                  checked={Boolean(currentLayout.hasCashier)}
                  onChange={(event) => updateCurrentLayout({ hasCashier: event.target.checked })}
                  className="h-4 w-4 accent-teal-600"
                  disabled={!currentZone}
                />
                <span className="text-sm font-semibold text-slate-700">Ruangan memiliki kasir</span>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <FieldInput
                  label="Pintu X"
                  type="number"
                  icon="fa-solid fa-door-open"
                  value={currentLayout.doorX}
                  onChange={(event) => updateCurrentLayout({ doorX: event.target.value })}
                  disabled={!currentZone}
                />
                <FieldInput
                  label="Pintu Y"
                  type="number"
                  icon="fa-solid fa-door-open"
                  value={currentLayout.doorY}
                  onChange={(event) => updateCurrentLayout({ doorY: event.target.value })}
                  disabled={!currentZone}
                />
                <FieldInput
                  label="Lebar Pintu"
                  type="number"
                  icon="fa-solid fa-left-right"
                  min="28"
                  value={currentLayout.doorWidth}
                  onChange={(event) => updateCurrentLayout({ doorWidth: event.target.value })}
                  disabled={!currentZone}
                />
                <FieldInput
                  label="Tinggi Pintu"
                  type="number"
                  icon="fa-solid fa-up-down"
                  min="28"
                  value={currentLayout.doorHeight}
                  onChange={(event) => updateCurrentLayout({ doorHeight: event.target.value })}
                  disabled={!currentZone}
                />
                <FieldInput
                  label="Kemiringan Pintu"
                  type="number"
                  icon="fa-solid fa-rotate"
                  min="-180"
                  max="180"
                  value={currentLayout.doorRotation ?? 0}
                  onChange={(event) => updateCurrentLayout({ doorRotation: event.target.value })}
                  disabled={!currentZone}
                />
                <span className="hidden sm:block" />
                <FieldInput
                  label="Kasir X"
                  type="number"
                  icon="fa-solid fa-cash-register"
                  value={currentLayout.cashierX}
                  onChange={(event) => updateCurrentLayout({ cashierX: event.target.value })}
                  disabled={!currentZone || !currentLayout.hasCashier}
                />
                <FieldInput
                  label="Kasir Y"
                  type="number"
                  icon="fa-solid fa-cash-register"
                  value={currentLayout.cashierY}
                  onChange={(event) => updateCurrentLayout({ cashierY: event.target.value })}
                  disabled={!currentZone || !currentLayout.hasCashier}
                />
                <FieldInput
                  label="Lebar Kasir"
                  type="number"
                  icon="fa-solid fa-left-right"
                  min="28"
                  value={currentLayout.cashierWidth}
                  onChange={(event) => updateCurrentLayout({ cashierWidth: event.target.value })}
                  disabled={!currentZone || !currentLayout.hasCashier}
                />
                <FieldInput
                  label="Tinggi Kasir"
                  type="number"
                  icon="fa-solid fa-up-down"
                  min="28"
                  value={currentLayout.cashierHeight}
                  onChange={(event) => updateCurrentLayout({ cashierHeight: event.target.value })}
                  disabled={!currentZone || !currentLayout.hasCashier}
                />
                <FieldInput
                  label="Kemiringan Kasir"
                  type="number"
                  icon="fa-solid fa-rotate"
                  min="-180"
                  max="180"
                  value={currentLayout.cashierRotation ?? 0}
                  onChange={(event) => updateCurrentLayout({ cashierRotation: event.target.value })}
                  disabled={!currentZone || !currentLayout.hasCashier}
                />
              </div>

              <div className="grid gap-4 rounded-md border border-slate-200 bg-slate-50 p-3">
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-slate-700">Rotasi pintu</span>
                    <span className="text-xs font-semibold text-slate-500">
                      {Number(currentLayout.doorRotation || 0)} deg
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    step="5"
                    value={currentLayout.doorRotation ?? 0}
                    onChange={(event) => updateCurrentLayout({ doorRotation: event.target.value })}
                    className="mt-3 w-full accent-teal-600"
                    disabled={!currentZone}
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-slate-700">Rotasi kasir</span>
                    <span className="text-xs font-semibold text-slate-500">
                      {Number(currentLayout.cashierRotation || 0)} deg
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    step="5"
                    value={currentLayout.cashierRotation ?? 0}
                    onChange={(event) => updateCurrentLayout({ cashierRotation: event.target.value })}
                    className="mt-3 w-full accent-teal-600"
                    disabled={!currentZone || !currentLayout.hasCashier}
                  />
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled={isSaving || !currentZone}
              onClick={saveSelectedTable}
              className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-md bg-teal-600 px-5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isSaving ? "Menyimpan..." : "Simpan Layout Ruangan"}
            </button>
          </section>

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
                  <FieldInput
                    label="Kemiringan"
                    type="number"
                    icon="fa-solid fa-rotate"
                    min="-180"
                    max="180"
                    value={selectedTable.rotation ?? 0}
                    onChange={(event) => updateSelectedTable({ rotation: event.target.value })}
                  />
                </div>

                <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-slate-700">Rotasi cepat</span>
                    <span className="text-xs font-semibold text-slate-500">
                      {Number(selectedTable.rotation || 0)} deg
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    step="5"
                    value={selectedTable.rotation ?? 0}
                    onChange={(event) => updateSelectedTable({ rotation: event.target.value })}
                    className="mt-3 w-full accent-teal-600"
                  />
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
