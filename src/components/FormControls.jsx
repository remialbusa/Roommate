import { COLORS } from "../theme";

const fieldClass =
  "rounded-xl px-3.5 py-2.5 font-body text-[14px] border w-full transition-shadow focus:outline-none focus:ring-2 focus:ring-[#8FE84F] focus:border-transparent placeholder:text-[rgba(18,49,40,0.35)]";

const fieldStyle = { backgroundColor: "#FFFFFF", borderColor: "rgba(18,49,40,0.15)", color: COLORS.ink };

export function TextField({ label, error, ...props }) {
  return (
    <label className="flex flex-col gap-1.5 mb-4">
      <span className="font-body font-semibold text-[12.5px]" style={{ color: "rgba(18,49,40,0.6)" }}>
        {label}
      </span>
      <input {...props} className={fieldClass} style={fieldStyle} aria-invalid={Boolean(error)} />
      {error && (
        <span className="font-body text-[12px]" style={{ color: COLORS.ember }} role="alert">
          {error}
        </span>
      )}
    </label>
  );
}

export function TextAreaField({ label, error, ...props }) {
  return (
    <label className="flex flex-col gap-1.5 mb-4">
      <span className="font-body font-semibold text-[12.5px]" style={{ color: "rgba(18,49,40,0.6)" }}>
        {label}
      </span>
      <textarea {...props} className={`${fieldClass} resize-none`} style={fieldStyle} aria-invalid={Boolean(error)} />
      {error && (
        <span className="font-body text-[12px]" style={{ color: COLORS.ember }} role="alert">
          {error}
        </span>
      )}
    </label>
  );
}

export function SelectField({ label, children, ...props }) {
  return (
    <label className="flex flex-col gap-1.5 mb-4">
      <span className="font-body font-semibold text-[12.5px]" style={{ color: "rgba(18,49,40,0.6)" }}>
        {label}
      </span>
      <select {...props} className={fieldClass} style={fieldStyle}>
        {children}
      </select>
    </label>
  );
}

export function CheckboxRow({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-2.5 py-1.5 cursor-pointer rounded-lg px-1 focus-within:ring-2 focus-within:ring-[#8FE84F]">
      <input type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4 shrink-0 accent-[#123128]" />
      <span className="font-body text-[13.5px] truncate" style={{ color: COLORS.ink }}>
        {label}
      </span>
    </label>
  );
}

export function SubmitRow({ onCancel, submitLabel = "Save", disabled }) {
  return (
    <div className="grid grid-cols-2 gap-3 mt-2">
      <button
        type="button"
        onClick={onCancel}
        className="rounded-xl py-3 font-body font-semibold text-[14px] transition-transform active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2"
        style={{ backgroundColor: "transparent", color: COLORS.ink, border: "1.5px solid rgba(18,49,40,0.25)" }}
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={disabled}
        className="rounded-xl py-3 font-body font-semibold text-[14px] transition-transform active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2"
        style={{ backgroundColor: COLORS.lime, color: COLORS.ink }}
      >
        {submitLabel}
      </button>
    </div>
  );
}
