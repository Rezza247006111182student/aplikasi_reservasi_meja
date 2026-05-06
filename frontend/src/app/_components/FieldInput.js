export default function FieldInput({
  label,
  type = "text",
  icon,
  placeholder,
  min,
  ...props
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <span className="relative mt-2 block">
        <span className="pointer-events-none absolute left-4 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center text-slate-500">
          <i className={icon} aria-hidden="true" />
        </span>
        <input
          type={type}
          min={min}
          placeholder={placeholder}
          {...props}
          className="h-12 w-full rounded-md border border-slate-300 bg-white px-4 pl-11 text-sm font-medium text-slate-800 shadow-sm outline-none transition hover:border-teal-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
        />
      </span>
    </label>
  );
}
