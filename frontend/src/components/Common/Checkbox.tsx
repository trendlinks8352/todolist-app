interface CheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  id?: string
  disabled?: boolean
}

export function Checkbox({ checked, onChange, label, id, disabled }: CheckboxProps) {
  const checkboxId = id ?? (label ? `cb-${label.replace(/\s+/g, '-')}` : undefined)

  return (
    <label className="checkbox-wrapper" htmlFor={checkboxId}>
      <input
        type="checkbox"
        id={checkboxId}
        className="checkbox-input"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label && <span className="checkbox-label">{label}</span>}
    </label>
  )
}
