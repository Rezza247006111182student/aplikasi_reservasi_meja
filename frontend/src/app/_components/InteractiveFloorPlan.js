"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../_lib/api";
import CustomSelect from "./CustomSelect";

const floorPlans = [
  {
    id: "lantai-1",
    label: "Lantai 1",
    rooms: [
      {
        id: "main-hall",
        label: "Main Hall",
        description: "Area utama dekat kasir dan akses dapur.",
        tables: [
          { id: "A-01", x: 152, y: 78, seats: 4, size: "md", shape: "round", status: "available" },
          { id: "A-02", x: 256, y: 78, seats: 4, size: "md", shape: "round", status: "booked" },
          { id: "A-03", x: 344, y: 116, seats: 4, size: "md", shape: "round", status: "available" },
          { id: "B-01", x: 96, y: 176, seats: 6, size: "lg", shape: "rect", rotation: 0, status: "available" },
          { id: "B-02", x: 248, y: 172, seats: 6, size: "lg", shape: "rect", rotation: 0, status: "inactive" },
          { id: "C-01", x: 118, y: 268, seats: 2, size: "sm", shape: "round", status: "available" },
          { id: "C-02", x: 260, y: 268, seats: 2, size: "sm", shape: "round", status: "booked" },
        ],
      },
      {
        id: "window-side",
        label: "Window Side",
        description: "Area dekat jendela dengan kapasitas meja kecil.",
        tables: [
          { id: "W-01", x: 76, y: 112, seats: 2, size: "sm", shape: "round", status: "available" },
          { id: "W-02", x: 74, y: 166, seats: 2, size: "sm", shape: "round", status: "available" },
          { id: "W-03", x: 74, y: 254, seats: 2, size: "sm", shape: "round", status: "booked" },
          { id: "F-01", x: 226, y: 112, seats: 5, size: "lg", shape: "rect", rotation: 90, status: "available" },
          { id: "F-02", x: 226, y: 226, seats: 5, size: "lg", shape: "rect", rotation: 90, status: "inactive" },
        ],
      },
    ],
  },
  {
    id: "lantai-2",
    label: "Lantai 2",
    rooms: [
      {
        id: "vip-room",
        label: "VIP Room",
        description: "Ruangan privat untuk keluarga dan meeting kecil.",
        tables: [
          { id: "VIP-01", x: 112, y: 94, seats: 8, size: "xl", shape: "rect", status: "available" },
          { id: "VIP-02", x: 274, y: 94, seats: 8, size: "xl", shape: "rect", status: "booked" },
          { id: "VIP-03", x: 208, y: 236, seats: 10, size: "xl", shape: "rect", status: "available" },
        ],
      },
      {
        id: "terrace",
        label: "Terrace",
        description: "Area semi-outdoor untuk suasana makan yang lebih santai.",
        tables: [
          { id: "T-01", x: 76, y: 84, seats: 4, size: "md", shape: "round", status: "available" },
          { id: "T-02", x: 192, y: 84, seats: 4, size: "md", shape: "round", status: "available" },
          { id: "T-03", x: 308, y: 84, seats: 4, size: "md", shape: "round", status: "booked" },
          { id: "T-04", x: 126, y: 216, seats: 4, size: "md", shape: "rect", rotation: 15, status: "inactive" },
          { id: "T-05", x: 264, y: 216, seats: 4, size: "md", shape: "rect", rotation: -15, status: "available" },
        ],
      },
    ],
  },
];

const statusStyles = {
  available: {
    fill: "#bbf7d0",
    stroke: "#16a34a",
    text: "#166534",
    label: "Tersedia",
    pill: "bg-green-100 text-green-700",
  },
  reserved: {
    fill: "#fecaca",
    stroke: "#dc2626",
    text: "#991b1b",
    label: "Dipesan",
    pill: "bg-red-100 text-red-700",
  },
  booked: {
    fill: "#fecaca",
    stroke: "#dc2626",
    text: "#991b1b",
    label: "Dipesan",
    pill: "bg-red-100 text-red-700",
  },
  inactive: {
    fill: "#e2e8f0",
    stroke: "#94a3b8",
    text: "#475569",
    label: "Tidak aktif",
    pill: "bg-slate-100 text-slate-600",
  },
};

const getTableSize = (table) => {
  const width = Number(table.width || 48);
  if (width >= 82) return "xl";
  if (width >= 68) return "lg";
  if (width <= 44) return "sm";
  return "md";
};

const normalizeShape = (shape) => (shape === "rectangle" ? "rect" : "round");

const buildFloorPlans = (tables) => {
  const grouped = tables.reduce((acc, table) => {
    const floor = table.floor || "Lantai 1";
    const room = table.room || "Main Hall";

    if (!acc[floor]) acc[floor] = {};
    if (!acc[floor][room]) acc[floor][room] = [];

    acc[floor][room].push({
      id: table.code,
      tableId: table.id,
      x: Number(table.x),
      y: Number(table.y),
      seats: table.capacity,
      size: getTableSize(table),
      shape: normalizeShape(table.shape),
      rotation: Number(table.rotation || 0),
      status: table.status,
    });

    return acc;
  }, {});

  const plans = Object.entries(grouped).map(([floor, rooms]) => ({
    id: floor.toLowerCase().replaceAll(" ", "-"),
    label: floor,
    rooms: Object.entries(rooms).map(([room, roomTables]) => ({
      id: room.toLowerCase().replaceAll(" ", "-"),
      label: room,
      description: `Area ${room} pada ${floor}.`,
      tables: roomTables,
    })),
  }));

  return plans.length ? plans : floorPlans;
};

const tableSizes = {
  sm: { radius: 15, rectW: 34, rectH: 24, chair: 7, labelY: 39 },
  md: { radius: 19, rectW: 44, rectH: 30, chair: 8, labelY: 46 },
  lg: { radius: 23, rectW: 58, rectH: 36, chair: 9, labelY: 52 },
  xl: { radius: 28, rectW: 72, rectH: 42, chair: 10, labelY: 60 },
};

function TableIcon({ table, style, isSelected, onSelect }) {
  const size = tableSizes[table.size] ?? tableSizes.md;
  const rotation = table.rotation ?? 0;
  const selectedStroke = isSelected ? "#0f766e" : style.stroke;
  const selectedWidth = isSelected ? 4 : 2;
  const chairFill = "#ffffff";
  const seatCount = Math.min(table.seats, 10);
  const topSeats = Math.ceil(seatCount / 2);
  const bottomSeats = seatCount - topSeats;
  const seatSpacing = table.shape === "rect" ? size.rectW / (topSeats + 1) : size.radius * 0.85;

  return (
    <g
      className="cursor-pointer transition"
      onClick={onSelect}
      role="button"
      tabIndex="0"
      aria-label={`Meja ${table.id}, ${table.seats} kursi, ${style.label}`}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
    >
      <g transform={`translate(${table.x} ${table.y}) rotate(${rotation})`}>
        {table.shape === "rect" ? (
          <>
            {Array.from({ length: topSeats }).map((_, index) => (
              <rect
                key={`top-${index}`}
                x={-size.rectW / 2 + seatSpacing * (index + 1) - size.chair / 2}
                y={-size.rectH / 2 - size.chair - 4}
                width={size.chair}
                height={size.chair}
                rx="3"
                fill={chairFill}
                stroke={style.stroke}
                strokeWidth="1.5"
              />
            ))}
            {Array.from({ length: bottomSeats }).map((_, index) => (
              <rect
                key={`bottom-${index}`}
                x={-size.rectW / 2 + (size.rectW / (bottomSeats + 1)) * (index + 1) - size.chair / 2}
                y={size.rectH / 2 + 4}
                width={size.chair}
                height={size.chair}
                rx="3"
                fill={chairFill}
                stroke={style.stroke}
                strokeWidth="1.5"
              />
            ))}
            <rect
              x={-size.rectW / 2}
              y={-size.rectH / 2}
              width={size.rectW}
              height={size.rectH}
              rx="8"
              fill={style.fill}
              stroke={selectedStroke}
              strokeWidth={selectedWidth}
            />
          </>
        ) : (
          <>
            {Array.from({ length: seatCount }).map((_, index) => {
              const angle = (Math.PI * 2 * index) / seatCount - Math.PI / 2;
              const chairX = Math.cos(angle) * (size.radius + size.chair + 2);
              const chairY = Math.sin(angle) * (size.radius + size.chair + 2);

              return (
                <circle
                  key={`chair-${index}`}
                  cx={chairX}
                  cy={chairY}
                  r={size.chair / 2}
                  fill={chairFill}
                  stroke={style.stroke}
                  strokeWidth="1.5"
                />
              );
            })}
            <circle
              cx="0"
              cy="0"
              r={size.radius}
              fill={style.fill}
              stroke={selectedStroke}
              strokeWidth={selectedWidth}
            />
          </>
        )}
      </g>
      <text
        x={table.x}
        y={table.y + size.labelY}
        textAnchor="middle"
        fontSize="10"
        fontWeight="700"
        fill={style.text}
      >
        {table.id}
      </text>
    </g>
  );
}

export default function InteractiveFloorPlan({
  compact = false,
  minimal = false,
  onConfirmSelection,
  onSelectionChange,
}) {
  const [plans, setPlans] = useState(floorPlans);
  const [isLoading, setIsLoading] = useState(true);
  const [floorId, setFloorId] = useState(floorPlans[0].id);
  const floor = plans.find((item) => item.id === floorId) ?? plans[0];
  const [roomId, setRoomId] = useState(floor.rooms[0].id);

  const activeRoom = useMemo(() => {
    return floor.rooms.find((room) => room.id === roomId) ?? floor.rooms[0];
  }, [floor, roomId]);

  const [selectedTableId, setSelectedTableId] = useState(activeRoom.tables[0].id);
  const selectedTable =
    activeRoom.tables.find((table) => table.id === selectedTableId) ??
    activeRoom.tables[0];
  const selectedStyle = statusStyles[selectedTable?.status] ?? statusStyles.available;

  useEffect(() => {
    let isMounted = true;

    apiFetch("/api/tables")
      .then((tables) => {
        if (!isMounted) return;
        const nextPlans = buildFloorPlans(tables);
        setPlans(nextPlans);
        setFloorId(nextPlans[0].id);
        setRoomId(nextPlans[0].rooms[0].id);
        setSelectedTableId(nextPlans[0].rooms[0].tables[0]?.id);
      })
      .catch(() => {
        if (!isMounted) return;
        setPlans(floorPlans);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleFloorChange = (nextFloorId) => {
    const nextFloor =
      plans.find((item) => item.id === nextFloorId) ?? plans[0];

    setFloorId(nextFloor.id);
    setRoomId(nextFloor.rooms[0].id);
    setSelectedTableId(nextFloor.rooms[0].tables[0]?.id);
  };

  const handleRoomChange = (nextRoomId) => {
    const nextRoom =
      floor.rooms.find((room) => room.id === nextRoomId) ?? floor.rooms[0];

    setRoomId(nextRoom.id);
    setSelectedTableId(nextRoom.tables[0]?.id);
  };

  const buildSelection = (table = selectedTable) => ({
    ...table,
    floor: floor.label,
    room: activeRoom.label,
    statusLabel: statusStyles[table.status]?.label ?? table.status,
  });

  const handleTableSelect = (table) => {
    setSelectedTableId(table.id);
    onSelectionChange?.({
      ...table,
      floor: floor.label,
      room: activeRoom.label,
      statusLabel: statusStyles[table.status]?.label ?? table.status,
    });
  };

  const controls = (
    <>
      <CustomSelect
        label={minimal ? "" : "Lantai"}
        value={floorId}
        onChange={handleFloorChange}
        options={plans.map((item) => ({
          label: item.label,
          value: item.id,
        }))}
      />
      <CustomSelect
        label={minimal ? "" : "Ruangan"}
        value={activeRoom.id}
        onChange={handleRoomChange}
        options={floor.rooms.map((room) => ({
          label: room.label,
          value: room.id,
        }))}
      />
    </>
  );

  const mapCanvas = (
    <div
      className={`rounded-lg ${minimal ? "bg-white p-0" : "border border-slate-200 bg-slate-50 p-3"} ${
        compact ? "overflow-hidden" : "overflow-x-auto"
      }`}
    >
      <svg
        className={`h-auto rounded-md bg-white ${compact ? "w-full" : "min-w-[420px]"}`}
        viewBox="0 0 420 340"
        role="img"
        aria-label={`Denah ${floor.label} ${activeRoom.label}`}
      >
        <rect x="14" y="14" width="392" height="312" rx="10" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" />
        <g aria-label="Pintu masuk">
          <rect x="28" y="24" width="46" height="46" rx="6" fill="#fef3c7" stroke="#f59e0b" strokeWidth="2" />
          <path d="M43 62V33H61V62" fill="#fff7ed" stroke="#92400e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M61 33L67 38V67L61 62Z" fill="#fde68a" stroke="#92400e" strokeWidth="2" strokeLinejoin="round" />
          <circle cx="57" cy="49" r="1.8" fill="#92400e" />
          <path d="M35 75H68" stroke="#92400e" strokeWidth="2" strokeLinecap="round" />
        </g>
        <rect x="322" y="252" width="58" height="42" rx="5" fill="#e0f2fe" stroke="#0284c7" />
        <text x="338" y="277" fontSize="10" fontWeight="700" fill="#0369a1">
          KASIR
        </text>
        <path d="M112 30V310" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="7 8" />
        <path d="M24 120H390" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="7 8" />
        <path d="M24 220H390" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="7 8" />

        {activeRoom.tables.map((table) => {
          const style = statusStyles[table.status];
          const isSelected = table.id === selectedTable.id;

          return (
            <TableIcon
              key={table.id}
              table={table}
              style={style}
              isSelected={isSelected}
              onSelect={() => handleTableSelect(table)}
            />
          );
        })}
      </svg>
    </div>
  );

  if (minimal) {
    return (
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="grid gap-2 border-b border-slate-200 bg-slate-50 p-3 sm:grid-cols-2">
          {controls}
        </div>
        <div className="p-2">{mapCanvas}</div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-100 p-3 shadow-xl shadow-slate-200/70">
      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="grid gap-4 border-b border-slate-200 px-4 py-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">
              Interactive Floor Plan
            </p>
            <h2 className="text-base font-semibold text-slate-950">
              Denah Nusantara Table
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              {isLoading ? "Memuat data meja dari backend..." : activeRoom.description}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:w-72">
            {controls}
          </div>
        </div>

        <div className={`grid gap-4 p-4 ${compact ? "" : "lg:grid-cols-[1fr_220px]"}`}>
          {mapCanvas}

          <aside className={`rounded-lg border border-slate-200 bg-white p-4 ${compact ? "hidden" : ""}`}>
            <p className="text-xs font-semibold uppercase text-slate-500">
              Detail meja
            </p>
            <h3 className="mt-2 text-xl font-bold text-slate-950">
              {selectedTable.id}
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              {floor.label} - {activeRoom.label}
            </p>
            <div className="mt-4 grid gap-2 text-sm">
              <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
                <span className="text-slate-600">Kapasitas</span>
                <span className="font-semibold text-slate-900">
                  {selectedTable.seats} orang
                </span>
              </div>
              <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
                <span className="text-slate-600">Status</span>
                <span className={`rounded-md px-2 py-1 text-xs font-semibold ${selectedStyle.pill}`}>
                  {selectedStyle.label}
                </span>
              </div>
            </div>

            {!compact ? (
              <button
                type="button"
                disabled={selectedTable.status !== "available"}
                className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-md bg-teal-600 px-5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                onClick={() => onConfirmSelection?.(buildSelection())}
              >
                Pilih Meja Ini
              </button>
            ) : null}

            <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-slate-600">
              {Object.entries(statusStyles).map(([key, value]) => (
                <span key={key} className="flex items-center gap-1">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: value.stroke }}
                  />
                  {value.label}
                </span>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
