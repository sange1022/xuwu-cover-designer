import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

export function IconButton({
  icon: Icon,
  label,
  active,
  className = "",
  ...props
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`icon-button ${active ? "active" : ""} ${className}`}
      {...props}
    >
      <Icon size={17} strokeWidth={1.8} />
    </button>
  );
}

export function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
  range = false,
}) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(Math.round(value * 100) / 100)), [value]);
  const commit = () => {
    if (draft.trim() === "" || !Number.isFinite(Number(draft))) {
      setDraft(String(value));
      return;
    }
    const n = Math.max(
      min ?? -Infinity,
      Math.min(max ?? Infinity, Number(draft)),
    );
    setDraft(String(n));
    onChange(n);
  };
  return (
    <div className={`number-field ${range ? "with-range" : ""}`}>
      <span className="field-label">{label}</span>
      {range && (
        <input
          type="range"
          aria-label={`${label}滑块`}
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(+e.target.value)}
        />
      )}
      <div className="number-box">
        <input
          aria-label={label}
          type="number"
          min={min}
          max={max}
          step={step}
          value={draft}
          onChange={(e) => {
            const text = e.target.value;
            setDraft(text);
            const n = Number(text);
            if (
              text &&
              Number.isFinite(n) &&
              n >= (min ?? -Infinity) &&
              n <= (max ?? Infinity)
            )
              onChange(n);
          }}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              commit();
              e.currentTarget.blur();
            }
          }}
        />
        {unit && <span>{unit}</span>}
      </div>
    </div>
  );
}

export function Modal({ title, children, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className="modal"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-heading">
        <h2>{title}</h2>
        <IconButton icon={X} label="关闭" onClick={onClose} />
      </div>
      {children}
    </dialog>
  );
}
