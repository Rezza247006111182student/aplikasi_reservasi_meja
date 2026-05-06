"use client";

import { useEffect, useRef, useState } from "react";

export default function CustomSelect({
  label,
  options,
  value,
  onChange,
  className = "",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);
  const selectedOption =
    options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!wrapperRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);

    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      {label ? (
        <span className="text-sm font-semibold text-slate-700">{label}</span>
      ) : null}
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className={`${label ? "mt-2 h-12" : "h-10"} flex w-full items-center justify-between gap-3 rounded-md border border-slate-300 bg-white px-4 text-left text-sm font-medium text-slate-800 shadow-sm outline-none transition hover:border-teal-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-100`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate">{selectedOption.label}</span>
        <i
          className={`fa-solid fa-chevron-down text-xs text-slate-500 transition ${
            isOpen ? "rotate-180 text-teal-700" : ""
          }`}
          aria-hidden="true"
        />
      </button>

      <div
        className={`absolute left-0 right-0 z-40 mt-2 overflow-hidden rounded-md border border-slate-200 bg-white shadow-xl shadow-slate-200/80 transition-all duration-150 ${
          isOpen
            ? "translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-1 opacity-0"
        }`}
        role="listbox"
      >
        {options.map((option) => {
          const isSelected = option.value === selectedOption.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm transition ${
                isSelected
                  ? "bg-teal-50 font-semibold text-teal-700"
                  : "text-slate-700 hover:bg-slate-50"
              }`}
              role="option"
              aria-selected={isSelected}
            >
              <span>{option.label}</span>
              {isSelected ? (
                <i className="fa-solid fa-check text-xs" aria-hidden="true" />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
