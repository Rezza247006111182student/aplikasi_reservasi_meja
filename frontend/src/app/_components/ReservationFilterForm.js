"use client";

import CustomSelect from "./CustomSelect";
import FieldInput from "./FieldInput";

export default function ReservationFilterForm({
  selectedTable,
  form,
  floorOptions,
  roomOptions,
  onFormChange,
  onCheckAvailability,
  isChecking = false,
  availabilityMessage = "",
  availabilitySummary = null,
}) {
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
          label="Lantai"
          value={form?.floor ?? "all"}
          onChange={(value) => updateField("floor", value)}
          options={floorOptions}
        />
        <CustomSelect
          label="Ruangan"
          value={form?.room ?? "all"}
          onChange={(value) => updateField("room", value)}
          options={roomOptions}
        />
      </div>

      <button
        type="button"
        onClick={onCheckAvailability}
        disabled={isChecking}
        className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-teal-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"
      >
        <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
        {isChecking ? "Memeriksa..." : "Cek Ketersediaan"}
      </button>

      {availabilityMessage ? (
        <div className="mt-4 rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-800">
          <p className="font-semibold">{availabilityMessage}</p>
          {availabilitySummary ? (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {[
                ["Tersedia", availabilitySummary.available, "text-green-700"],
                ["Telah dipesan", availabilitySummary.reserved, "text-amber-700"],
                ["Sedang dipakai", availabilitySummary.booked, "text-red-700"],
                ["Tidak dapat dipilih", (availabilitySummary.inactive || 0) + (availabilitySummary.unavailable || 0), "text-slate-700"],
              ].map(([label, value, className]) => (
                <div key={label} className="flex items-center justify-between rounded-md bg-white px-3 py-2">
                  <span className="font-medium text-slate-600">{label}</span>
                  <span className={`font-bold ${className}`}>{value}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mt-5 rounded-lg border border-slate-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase text-slate-500">
          {selectedTable ? "Meja terpilih" : "Hasil ketersediaan meja"}
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
          <>
            {availabilitySummary?.tables?.length ? (
              <div className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-1">
                {availabilitySummary.tables.map((table) => (
                  <article
                    key={`${table.floor}-${table.room}-${table.id}`}
                    className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-slate-950">{table.id}</h3>
                        <p className="mt-1 text-xs leading-5 text-slate-600">
                          {table.floor} - {table.room}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Kapasitas {table.seats} orang
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-md px-2 py-1 text-[11px] font-semibold ${table.pill}`}>
                        {table.statusLabel}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Belum ada meja dipilih. Klik cek ketersediaan atau pilih meja pada denah.
              </p>
            )}
          </>
        )}
      </div>
    </form>
  );
}
