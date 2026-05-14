interface Option {
  value: string
  label: string
}

interface DropdownProps {
  options: Option[]
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  id?: string
  disabled?: boolean
}

export function Dropdown({ options, value, onChange, placeholder, id, disabled }: DropdownProps) {
  return (
    <select
      id={id}
      className="dropdown-select"
      value={value ?? ''}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      aria-label={placeholder}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}
