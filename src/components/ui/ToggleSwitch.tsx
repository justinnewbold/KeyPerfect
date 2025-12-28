import React from 'react';

interface ToggleSwitchProps {
  icon: React.ReactNode;
  label: string;
  description?: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

export function ToggleSwitch({
  icon,
  label,
  description,
  value,
  onChange,
  disabled = false,
}: ToggleSwitchProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="text-purple-400">{icon}</div>
        <div>
          <h3 className="font-semibold">{label}</h3>
          {description && (
            <p className="text-xs text-white/60">{description}</p>
          )}
        </div>
      </div>
      <button
        onClick={() => onChange(!value)}
        disabled={disabled}
        aria-pressed={value}
        aria-label={`${label} ${value ? 'enabled' : 'disabled'}`}
        className={`relative w-12 h-6 rounded-full transition-colors ${
          value ? 'bg-purple-500' : 'bg-white/20'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <div
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
            value ? 'translate-x-6' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}
