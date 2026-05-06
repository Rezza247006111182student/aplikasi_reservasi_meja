"use client";

import CustomSelect from "./CustomSelect";
import FieldInput from "./FieldInput";

const areaOptions = [
  { label: "Semua area", value: "all" },
  { label: "Indoor", value: "indoor" },
  { label: "Window", value: "window" },
  { label: "Garden", value: "garden" },
  { label: "VIP", value: "vip" },
];

export default function ReservationFilterForm({ selectedTable, form, onFormChange }) {
  const updateField = (field, value) => {
    onFormChange?.((current) => ({ ...current, [field]: value }));
  };

  return (
    <form className="animate-fade-up-delay rounded-lg border border-slate-200 bg-slate-50 p-5 shadow-sm">
      <div className="grid gap-4 sm:grid-cols-2">
        <FieldInput
          label="Tanggal"
          type="date"
          icon="fa-regular fa-calendar"
          value={form?.date ?? ""}
          onChange={(event) => updateField("date", event.target.value)}
        />
        <FieldInput
          label="Waktu"
          type="time"
          icon="fa-regular fa-clock"
          value={form?.time ?? ""}
          onChange={(event) => updateField("time", event.target.value)}
        />
        <FieldInput
          label="Jumlah tamu"
          type="number"
          icon="fa-solid fa-user-group"
          min="1"
          placeholder="2"
          value={form?.guestCount ?? ""}
          onChange={(event) => updateField("guestCount", event.target.value)}
        />
        <CustomSelect
          label="Area"
          value={form?.area ?? areaOptions[0].value}
          onChange={(value) => updateField("area", value)}
          options={areaOptions}
        />
      </div>

      <button
        type="button"
        className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-teal-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"
      >
        <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
        Cek Ketersediaan
      </button>

      <div className="mt-5 rounded-lg border border-slate-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase text-slate-500">
          Meja terpilih
        </p>
        {selectedTable ? (
          <div className="mt-3 flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-950">
                {selectedTable.id}
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                {selectedTable.floor} - {selectedTable.room}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Kapasitas {selectedTable.seats} orang
              </p>
            </div>
            <span className="rounded-md bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
              {selectedTable.statusLabel}
            </span>
          </div>
        ) : (
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Belum ada meja dipilih. Klik meja pada denah untuk melihat detailnya di sini.
          </p>
        )}
      </div>
    </form>
  );
}
