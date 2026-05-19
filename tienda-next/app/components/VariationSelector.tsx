"use client";

import React from "react";

interface VariationSelectorProps {
  label: string;
  options: string[];
  selectedValue: string;
  onSelect: (value: string) => void;
  disabled?: boolean;
}

export default function VariationSelector({
  label,
  options,
  selectedValue,
  onSelect,
  disabled = false,
}: VariationSelectorProps) {
  const handleClick = (option: string) => {
    if (disabled) return;
    // Si ya está seleccionado, deselecciona (pasa string vacío)
    // Si no está seleccionado, lo selecciona
    if (selectedValue === option) {
      onSelect("");
    } else {
      onSelect(option);
    }
  };

  return (
    <div className="flex flex-col gap-2.5">
      <label className="text-xs font-semibold text-slate-700 dark:text-white/80 uppercase tracking-wide">
        {label}
      </label>
      
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => handleClick(option)}
            disabled={disabled}
            className={`
              px-4 py-2 rounded-lg font-medium text-sm transition-all
              border-2 whitespace-nowrap
              ${
                selectedValue === option
                  ? "border-[#E0A11A] bg-[#E0A11A] text-white dark:text-slate-900 shadow-md hover:opacity-90"
                  : "border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-700 dark:text-white/80 hover:border-[#E0A11A] dark:hover:border-[#E0A11A] hover:shadow-sm"
              }
              ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
            `}
            title={selectedValue === option ? `Haz clic para deseleccionar ${option}` : `Haz clic para seleccionar ${option}`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
